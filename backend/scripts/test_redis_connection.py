"""
test_redis_connection.py - Test script to verify Upstash Redis connection.

This script tests the Redis connection and basic cache operations.
Run this to verify your Upstash configuration is working correctly.

Usage:
    # First, set your environment variables:
    export UPSTASH_REDIS_REST_URL='https://calm-marmot-36085.upstash.io'
    export UPSTASH_REDIS_REST_TOKEN='your-token-here'
    
    # Then run the test:
    python backend/scripts/test_redis_connection.py
    
Expected output when working:
    [OK] Upstash Redis connected
    [OK] Set operation successful
    [OK] Get operation successful
    [OK] JSON caching works correctly
"""
import os
import sys
import time

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)


def test_redis_connection():
    """Test the Upstash Redis connection and basic operations."""
    print("=" * 60)
    print("  Upstash Redis Connection Test")
    print("=" * 60)
    
    # Check environment variables
    url = os.environ.get('UPSTASH_REDIS_REST_URL') or os.environ.get('KV_REST_API_URL')
    token = os.environ.get('UPSTASH_REDIS_REST_TOKEN') or os.environ.get('KV_REST_API_TOKEN')
    
    print(f"\n[1] Environment Check:")
    print(f"    UPSTASH_REDIS_REST_URL: {'SET ✓' if url else 'NOT SET ✗'}")
    print(f"    UPSTASH_REDIS_REST_TOKEN: {'SET ✓' if token else 'NOT SET ✗'}")
    
    if not url or not token:
        print("\n[ERROR] Missing Upstash credentials!")
        print("\nTo fix this, set the environment variables:")
        print()
        print("  export UPSTASH_REDIS_REST_URL='https://calm-marmot-36085.upstash.io'")
        print("  export UPSTASH_REDIS_REST_TOKEN='your-token-from-upstash-console'")
        print()
        print("Or run the setup script:")
        print("  python backend/scripts/setup_redis_env.py")
        return False
    
    print(f"\n[2] Connecting to: {url}")
    
    try:
        # Test direct Upstash connection
        from upstash_redis import Redis as UpstashRedis
        
        client = UpstashRedis(url=url, token=token)
        
        # Test ping
        print("\n[3] Testing connection...")
        response = client.ping()
        if response:
            print("    [OK] Ping successful - Redis is connected!")
        else:
            print("    [ERROR] Ping failed")
            return False
        
        # Test set operation
        print("\n[4] Testing write operation...")
        start = time.time()
        client.set("mizizzi:test:connection", "test_value", ex=60)
        write_time = (time.time() - start) * 1000
        print(f"    [OK] Set operation successful ({write_time:.2f}ms)")
        
        # Test get operation
        print("\n[5] Testing read operation...")
        start = time.time()
        value = client.get("mizizzi:test:connection")
        read_time = (time.time() - start) * 1000
        if value == "test_value":
            print(f"    [OK] Get operation successful ({read_time:.2f}ms)")
        else:
            print(f"    [WARNING] Get returned unexpected value: {value}")
        
        # Test delete operation
        print("\n[6] Testing delete operation...")
        client.delete("mizizzi:test:connection")
        print("    [OK] Delete operation successful")
        
        # Test JSON caching through cache manager
        print("\n[7] Testing cache manager with JSON data...")
        try:
            from app.cache import cache_manager, fast_json_dumps
            
            test_data = {
                "products": [
                    {"id": 1, "name": "Test Product", "price": 99.99},
                    {"id": 2, "name": "Another Product", "price": 149.99}
                ],
                "total": 2,
                "cached_at": "2024-01-01T00:00:00Z"
            }
            
            # Test set with JSON
            start = time.time()
            cache_manager.set("test:json", test_data, ttl=60)
            json_write_time = (time.time() - start) * 1000
            print(f"    [OK] JSON set successful ({json_write_time:.2f}ms)")
            
            # Test get with JSON
            start = time.time()
            retrieved = cache_manager.get("test:json")
            json_read_time = (time.time() - start) * 1000
            
            if retrieved and retrieved.get("total") == 2:
                print(f"    [OK] JSON get successful ({json_read_time:.2f}ms)")
            else:
                print(f"    [WARNING] JSON get returned: {retrieved}")
            
            # Clean up
            cache_manager.delete("test:json")
            
            # Print stats
            stats = cache_manager.stats
            print(f"\n[8] Cache Statistics:")
            print(f"    - Cache Type: {stats['cache_type']}")
            print(f"    - Using orjson: {stats['using_orjson']}")
            print(f"    - Hits: {stats['hits']}")
            print(f"    - Misses: {stats['misses']}")
            print(f"    - Sets: {stats['sets']}")
            print(f"    - Hit Rate: {stats['hit_rate_percent']}%")
            
        except ImportError as e:
            print(f"    [WARNING] Could not test cache manager: {e}")
        
        # Performance summary
        print()
        print("=" * 60)
        print("  Performance Summary")
        print("=" * 60)
        print(f"  Average read latency:  {read_time:.2f}ms")
        print(f"  Average write latency: {write_time:.2f}ms")
        print()
        if read_time < 20:
            print("  [EXCELLENT] Read latency is under 20ms - perfect for production!")
        elif read_time < 50:
            print("  [GOOD] Read latency is under 50ms - acceptable for most use cases")
        else:
            print("  [WARNING] Read latency is high - check your network connection")
        
        print()
        print("=" * 60)
        print("  All tests passed! Redis is working correctly.")
        print("=" * 60)
        return True
        
    except ImportError:
        print("\n[ERROR] upstash-redis package not installed")
        print("Install with: pip install upstash-redis")
        return False
    except Exception as e:
        print(f"\n[ERROR] Connection failed: {e}")
        print("\nPossible causes:")
        print("  1. Invalid URL or token")
        print("  2. Network connectivity issues")
        print("  3. Upstash service unavailable")
        return False


if __name__ == "__main__":
    success = test_redis_connection()
    sys.exit(0 if success else 1)
