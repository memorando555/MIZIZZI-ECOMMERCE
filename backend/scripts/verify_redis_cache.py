import sys
import os
import time
import logging

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask
from app import create_app
from app.utils.redis_cache import product_cache

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_redis_connection():
    """Test the direct connection to Redis Cache."""
    print("\n" + "="*50)
    print("Testing Redis Cache Connection")
    print("="*50)
    
    stats = product_cache.stats
    print(f"Connection Status: {'✅ Connected' if product_cache.is_connected else '❌ Disconnected'}")
    print(f"Client Type:       {stats.get('client_type', 'Unknown')}")
    print(f"Serializer:        {stats.get('serializer', 'Unknown')}")
    
    if not product_cache.is_connected:
        print("\n⚠️  WARNING: Running in In-Memory Fallback mode.")
        print("   Make sure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in .env")
        return

    # Test Set
    test_key = "mizizzi:test:connection"
    test_value = {"status": "ok", "timestamp": time.time()}
    print(f"\n1. Setting key '{test_key}'...")
    success = product_cache.set(test_key, test_value, ttl=60)
    if success:
        print("   ✅ Set successful")
    else:
        print("   ❌ Set failed")

    # Test Get
    print(f"2. Getting key '{test_key}'...")
    cached_value = product_cache.get(test_key)
    if cached_value and cached_value.get('status') == 'ok':
        print(f"   ✅ Get successful: {cached_value}")
    else:
        print(f"   ❌ Get failed. Received: {cached_value}")

    # Test Delete
    print(f"3. Deleting key '{test_key}'...")
    product_cache.delete(test_key)
    deleted_val = product_cache.get(test_key)
    if deleted_val is None:
        print("   ✅ Delete successful")
    else:
        print("   ❌ Delete failed")

def test_product_route_caching(app):
    """Test if the Product Routes are correctly caching responses."""
    print("\n" + "="*50)
    print("Testing Product Route Caching Integration")
    print("="*50)

    client = app.test_client()
    route = "/api/products/"

    print(f"1. First Request to {route} (Expect MISS)...")
    try:
        # Clear cache first to ensure a MISS
        product_cache.delete_pattern("mizizzi:products:*")
        
        start_time = time.time()
        response = client.get(route)
        duration = (time.time() - start_time) * 1000
        
        if response.status_code != 200:
            print(f"   ❌ Request failed with status {response.status_code}")
            return

        cache_status = response.headers.get('X-Cache')
        print(f"   Status: {response.status_code}")
        print(f"   Time:   {duration:.2f}ms")
        print(f"   Header [X-Cache]: {cache_status}")
        
        if cache_status == 'MISS':
            print("   ✅ Correctly missed cache on fresh request.")
        else:
            print(f"   ⚠️  Unexpected cache status: {cache_status} (Expected MISS)")

    except Exception as e:
        print(f"   ❌ Error calling route: {e}")
        return

    print(f"\n2. Second Request to {route} (Expect HIT)...")
    try:
        start_time = time.time()
        response = client.get(route)
        duration = (time.time() - start_time) * 1000
        
        cache_status = response.headers.get('X-Cache')
        print(f"   Status: {response.status_code}")
        print(f"   Time:   {duration:.2f}ms")
        print(f"   Header [X-Cache]: {cache_status}")
        
        if cache_status == 'HIT':
            print("   ✅ Correctly hit cache on subsequent request.")
        else:
            print(f"   ❌ Failed to hit cache. Status: {cache_status}")

    except Exception as e:
        print(f"   ❌ Error calling route: {e}")

if __name__ == "__main__":
    # Initialize App
    print("Initializing Application Context...")
    try:
        app = create_app()
        with app.app_context():
            test_redis_connection()
            test_product_route_caching(app)
            
            print("\n" + "="*50)
            print("Final Cache Stats")
            print("="*50)
            print(product_cache.stats)
            
    except Exception as e:
        print(f"❌ Critical Error: {e}")
        import traceback
        traceback.print_exc()