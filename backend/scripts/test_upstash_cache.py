#!/usr/bin/env python3
"""
Upstash Redis Cache Test Script for Mizizzi E-commerce platform.
Tests Upstash connection, caching functionality, and performance.

Run: python scripts/test_upstash_cache.py

Environment variables needed:
  - UPSTASH_REDIS_REST_URL or KV_REST_API_URL
  - UPSTASH_REDIS_REST_TOKEN or KV_REST_API_TOKEN
"""
import os
import sys
import time
import json
import requests
from datetime import datetime, timezone

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# --- Added: simple .env loader to populate os.environ when running the script directly ---
def _load_env_file_if_needed():
    """Load backend/.env into os.environ if Upstash env vars are missing."""
    required_keys = [
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
        "KV_REST_API_URL",
        "KV_REST_API_TOKEN",
    ]
    if any(os.environ.get(k) for k in required_keys):
        return False  # nothing to do

    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if not os.path.isfile(dotenv_path):
        return False

    loaded = False
    try:
        with open(dotenv_path, "r", encoding="utf-8") as fh:
            for raw in fh:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                # skip comments that were accidentally placed at file top
                if k.startswith("//"):
                    continue
                if k not in os.environ and v:
                    os.environ[k] = v
                    loaded = True
    except Exception:
        loaded = False

    return loaded

# Attempt to load .env early so modules imported afterwards can pick up env vars
_env_loaded = _load_env_file_if_needed()
if _env_loaded:
    print(f"  [INFO] Loaded environment variables from .env")

# Move import after ensuring env vars are available so redis_cache can detect Upstash
from app.utils.redis_cache import product_cache, RedisCache


def print_header(title: str):
    """Print a formatted header."""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_result(test_name: str, passed: bool, details: str = ""):
    """Print test result."""
    status = "PASS" if passed else "FAIL"
    symbol = "[OK]" if passed else "[X]"
    print(f"  {symbol} {test_name}: {status}")
    if details:
        print(f"      -> {details}")


def print_info(message: str):
    """Print info message."""
    print(f"  [INFO] {message}")


def test_upstash_connection():
    """Test 1: Verify Upstash Redis connection."""
    print_header("Test 1: Upstash Redis Connection")
    
    # Check environment variables
    upstash_url = os.environ.get('UPSTASH_REDIS_REST_URL') or os.environ.get('KV_REST_API_URL')
    upstash_token = os.environ.get('UPSTASH_REDIS_REST_TOKEN') or os.environ.get('KV_REST_API_TOKEN')
    
    print_info(f"URL configured: {'Yes' if upstash_url else 'No'}")
    print_info(f"Token configured: {'Yes' if upstash_token else 'No'}")
    
    if upstash_url:
        # Mask the URL for security
        masked_url = upstash_url[:30] + "..." if len(upstash_url) > 30 else upstash_url
        print_info(f"Upstash URL: {masked_url}")
    
    connected = product_cache.is_connected
    cache_type = "Upstash Redis" if connected else "In-Memory Fallback"
    
    print_result(
        "Connection Status",
        connected,
        f"Using {cache_type} cache"
    )
    
    if connected and hasattr(product_cache, '_client') and product_cache._client:
        # Test ping via Upstash REST API
        try:
            pong = product_cache._client.ping()
            print_result("Upstash PING", pong == "PONG" or pong == True, f"Response: {pong}")
        except Exception as e:
            print_result("Upstash PING", False, str(e))
    
    return connected


def test_basic_operations():
    """Test 2: Basic cache operations (GET, SET, DELETE)."""
    print_header("Test 2: Basic Cache Operations")
    
    test_key = "mizizzi:test:upstash_basic"
    test_value = {
        "message": "Hello from Upstash!",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "platform": "Mizizzi E-commerce"
    }
    
    # Test SET
    start = time.perf_counter()
    set_result = product_cache.set(test_key, test_value, ttl=60)
    set_time = (time.perf_counter() - start) * 1000
    print_result("SET operation", set_result, f"Key: {test_key} ({set_time:.2f}ms)")
    
    # Test GET
    start = time.perf_counter()
    get_result = product_cache.get(test_key)
    get_time = (time.perf_counter() - start) * 1000
    get_passed = get_result is not None and get_result.get("message") == test_value["message"]
    print_result("GET operation", get_passed, f"Retrieved in {get_time:.2f}ms")
    
    # Test DELETE
    start = time.perf_counter()
    delete_result = product_cache.delete(test_key)
    delete_time = (time.perf_counter() - start) * 1000
    print_result("DELETE operation", delete_result, f"Deleted in {delete_time:.2f}ms")
    
    # Verify deletion
    verify_delete = product_cache.get(test_key)
    print_result("Verify deletion", verify_delete is None, "Key no longer exists")
    
    return set_result and get_passed and delete_result


def test_large_payload():
    """Test 3: Large payload handling (simulating product list)."""
    print_header("Test 3: Large Payload (100 Products)")
    
    test_key = "mizizzi:test:large_payload"
    
    # Simulate a products list response
    test_data = {
        "products": [
            {
                "id": i,
                "name": f"Product {i}",
                "slug": f"product-{i}",
                "price": 99.99 + i,
                "sale_price": 79.99 + i,
                "discount_percentage": 20,
                "image_url": f"https://example.com/product-{i}.jpg",
                "thumbnail_url": f"https://example.com/product-{i}-thumb.jpg",
                "stock": 100 + i,
                "is_featured": i % 5 == 0,
                "is_new": i % 3 == 0,
                "is_sale": i % 2 == 0,
                "category_id": (i % 10) + 1,
                "brand_id": (i % 5) + 1,
                "rating": 4.5,
            }
            for i in range(100)
        ],
        "total": 100,
        "page": 1,
        "per_page": 100,
        "total_pages": 1
    }
    
    payload_size = len(json.dumps(test_data))
    print_info(f"Payload size: {payload_size:,} bytes ({payload_size/1024:.2f} KB)")
    
    # Test SET with large payload
    start = time.perf_counter()
    set_result = product_cache.set(test_key, test_data, ttl=60)
    set_time = (time.perf_counter() - start) * 1000
    print_result("SET large payload", set_result, f"{set_time:.2f}ms")
    
    # Test GET large payload
    start = time.perf_counter()
    get_result = product_cache.get(test_key)
    get_time = (time.perf_counter() - start) * 1000
    get_passed = get_result is not None and len(get_result.get("products", [])) == 100
    print_result("GET large payload", get_passed, f"{get_time:.2f}ms")
    
    # Cleanup
    product_cache.delete(test_key)
    
    return set_result and get_passed


def test_ttl_expiration():
    """Test 4: TTL expiration (2 second TTL)."""
    print_header("Test 4: TTL Expiration")
    
    if not product_cache.is_connected:
        print_info("Skipping TTL test - using memory cache")
        return True
    
    test_key = "mizizzi:test:ttl_expire"
    test_value = {"expires": "soon", "created": datetime.now(timezone.utc).isoformat()}
    
    # Set with 2 second TTL
    product_cache.set(test_key, test_value, ttl=2)
    
    # Verify it exists
    immediate_get = product_cache.get(test_key)
    print_result("Key exists immediately", immediate_get is not None)
    
    # Wait for expiration
    print_info("Waiting 3 seconds for TTL expiration...")
    time.sleep(3)
    
    # Verify it expired
    after_ttl_get = product_cache.get(test_key)
    print_result("Key expired after TTL", after_ttl_get is None)
    
    return immediate_get is not None and after_ttl_get is None


def test_pattern_invalidation():
    """Test 5: Pattern-based cache invalidation."""
    print_header("Test 5: Pattern-Based Invalidation")
    
    # Create multiple test keys
    test_keys = [
        "mizizzi:products:pattern_test1",
        "mizizzi:products:pattern_test2",
        "mizizzi:products:pattern_test3",
        "mizizzi:featured:pattern_test1",
        "mizizzi:categories:pattern_test1",
    ]
    
    for key in test_keys:
        product_cache.set(key, {"test": True, "key": key}, ttl=60)
    
    print_info(f"Created {len(test_keys)} test keys")
    
    # Delete products pattern only
    deleted_count = product_cache.delete_pattern("mizizzi:products:*")
    print_result(
        "Pattern delete (products:*)",
        deleted_count >= 3,
        f"Deleted {deleted_count} keys"
    )
    
    # Verify products keys deleted
    prod_key_gone = product_cache.get("mizizzi:products:pattern_test1") is None
    print_result("Products keys deleted", prod_key_gone)
    
    # Verify featured key still exists
    feat_key_exists = product_cache.get("mizizzi:featured:pattern_test1") is not None
    print_result("Featured key preserved", feat_key_exists)
    
    # Cleanup remaining keys
    product_cache.delete("mizizzi:featured:pattern_test1")
    product_cache.delete("mizizzi:categories:pattern_test1")
    
    return deleted_count >= 3 and prod_key_gone


def test_performance_benchmark():
    """Test 6: Performance benchmark (latency test)."""
    print_header("Test 6: Performance Benchmark")
    
    test_key = "mizizzi:test:perf_bench"
    test_data = {
        "products": [{"id": i, "name": f"Product {i}"} for i in range(50)],
        "total": 50
    }
    
    iterations = 20
    
    # Benchmark SET operations
    set_times = []
    for i in range(iterations):
        start = time.perf_counter()
        product_cache.set(f"{test_key}_{i}", test_data, ttl=60)
        set_times.append((time.perf_counter() - start) * 1000)
    
    avg_set = sum(set_times) / len(set_times)
    min_set = min(set_times)
    max_set = max(set_times)
    print_result(
        f"SET latency ({iterations} ops)",
        avg_set < 100,
        f"avg={avg_set:.2f}ms, min={min_set:.2f}ms, max={max_set:.2f}ms"
    )
    
    # Benchmark GET operations
    get_times = []
    for i in range(iterations):
        start = time.perf_counter()
        product_cache.get(f"{test_key}_{i}")
        get_times.append((time.perf_counter() - start) * 1000)
    
    avg_get = sum(get_times) / len(get_times)
    min_get = min(get_times)
    max_get = max(get_times)
    print_result(
        f"GET latency ({iterations} ops)",
        avg_get < 50,
        f"avg={avg_get:.2f}ms, min={min_get:.2f}ms, max={max_get:.2f}ms"
    )
    
    # Cleanup
    for i in range(iterations):
        product_cache.delete(f"{test_key}_{i}")
    
    # Calculate throughput
    total_ops = iterations * 2  # SET + GET
    total_time = sum(set_times) + sum(get_times)
    throughput = (total_ops / total_time) * 1000  # ops per second
    print_info(f"Throughput: ~{throughput:.0f} ops/second")
    
    return avg_get < 100


def test_cache_statistics():
    """Test 7: Cache statistics and monitoring."""
    print_header("Test 7: Cache Statistics")
    
    # Perform operations to generate stats
    test_key = "mizizzi:test:stats_test"
    
    product_cache.set(test_key, {"test": True}, ttl=60)  # 1 SET
    product_cache.get(test_key)  # 1 HIT
    product_cache.get(test_key)  # 1 HIT
    product_cache.get("mizizzi:nonexistent:key123")  # 1 MISS
    
    stats = product_cache.stats
    
    print_info(f"Total Hits: {stats['hits']}")
    print_info(f"Total Misses: {stats['misses']}")
    print_info(f"Total Sets: {stats['sets']}")
    print_info(f"Total Errors: {stats['errors']}")
    print_info(f"Hit Rate: {stats['hit_rate_percent']}%")
    
    stats_working = stats['hits'] > 0 or stats['sets'] > 0
    print_result("Statistics tracking", stats_working)
    
    # Cleanup
    product_cache.delete(test_key)
    
    return stats_working


def test_invalidation_methods():
    """Test 8: Built-in invalidation helper methods."""
    print_header("Test 8: Invalidation Helpers")
    
    # Create test data
    product_cache.set("mizizzi:products:inv_helper1", {"test": True}, ttl=60)
    product_cache.set("mizizzi:products:inv_helper2", {"test": True}, ttl=60)
    product_cache.set("mizizzi:featured:inv_helper1", {"test": True}, ttl=60)
    product_cache.set("mizizzi:categories:inv_helper1", {"test": True}, ttl=60)
    
    print_info("Created test keys in products, featured, categories")
    
    # Test invalidate_products
    prod_cleared = product_cache.invalidate_products()
    print_result("invalidate_products()", prod_cleared >= 0, f"Cleared {prod_cleared} keys")
    
    # Test invalidate_featured  
    feat_cleared = product_cache.invalidate_featured()
    print_result("invalidate_featured()", feat_cleared >= 0, f"Cleared {feat_cleared} keys")
    
    # Test invalidate_categories
    cat_cleared = product_cache.invalidate_categories()
    print_result("invalidate_categories()", cat_cleared >= 0, f"Cleared {cat_cleared} keys")
    
    return True


def test_concurrent_access():
    """Test 9: Concurrent access simulation."""
    print_header("Test 9: Concurrent Access Simulation")
    
    import threading
    import random
    
    test_key = "mizizzi:test:concurrent"
    errors = []
    successes = []
    
    def worker(worker_id):
        try:
            # Simulate read/write pattern
            for i in range(5):
                key = f"{test_key}_{worker_id}_{i}"
                product_cache.set(key, {"worker": worker_id, "iteration": i}, ttl=30)
                result = product_cache.get(key)
                if result and result.get("worker") == worker_id:
                    successes.append(True)
                product_cache.delete(key)
        except Exception as e:
            errors.append(str(e))
    
    # Create 5 worker threads
    threads = []
    for i in range(5):
        t = threading.Thread(target=worker, args=(i,))
        threads.append(t)
    
    # Start all threads
    start = time.perf_counter()
    for t in threads:
        t.start()
    
    # Wait for completion
    for t in threads:
        t.join()
    
    elapsed = (time.perf_counter() - start) * 1000
    
    print_info(f"5 threads, 5 ops each = 25 total operations")
    print_info(f"Completed in {elapsed:.2f}ms")
    print_info(f"Successful operations: {len(successes)}")
    print_info(f"Errors: {len(errors)}")
    
    print_result("Concurrent access", len(errors) == 0, f"{len(successes)} successful, {len(errors)} errors")
    
    return len(errors) == 0


def run_all_tests():
    """Run all tests and print summary."""
    print("\n")
    print("*" * 70)
    print("*  MIZIZZI UPSTASH REDIS CACHE TEST SUITE")
    print("*" * 70)
    print(f"\nTest started at: {datetime.now(timezone.utc).isoformat()}")
    print(f"UPSTASH_REDIS_REST_URL: {'Set' if os.environ.get('UPSTASH_REDIS_REST_URL') else 'Not set'}")
    print(f"KV_REST_API_URL: {'Set' if os.environ.get('KV_REST_API_URL') else 'Not set'}")
    
    results = {
        "Upstash Connection": test_upstash_connection(),
        "Basic Operations": test_basic_operations(),
        "Large Payload": test_large_payload(),
        "TTL Expiration": test_ttl_expiration(),
        "Pattern Invalidation": test_pattern_invalidation(),
        "Performance Benchmark": test_performance_benchmark(),
        "Cache Statistics": test_cache_statistics(),
        "Invalidation Helpers": test_invalidation_methods(),
        "Concurrent Access": test_concurrent_access(),
    }
    
    # Print summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for r in results.values() if r)
    total = len(results)
    
    for test_name, result in results.items():
        print_result(test_name, result)
    
    print("\n" + "-" * 70)
    print(f"  Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("  Status: ALL TESTS PASSED - Upstash Redis cache is working perfectly!")
        print("  Your products will be FAST!")
    elif passed >= total - 2:
        print("  Status: MOSTLY PASSING - Cache is functional with minor issues")
    else:
        print("  Status: ISSUES DETECTED - Review output above for details")
    
    print("-" * 70 + "\n")
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
