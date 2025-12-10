#!/usr/bin/env python3
"""
Direct Upstash Redis Test - Tests your Upstash connection without relying on env vars
Run: python scripts/test_upstash_direct.py
"""

import time
import json

# Your Upstash credentials
UPSTASH_URL = "https://calm-marmot-36085.upstash.io"
UPSTASH_TOKEN = "AYz1AAIncDFhODhkODAyZGM3NTg0YWM4YWU2NzY0ZjM1ZGM5MzY1NnAxMzYwODU"

def test_upstash():
    print("=" * 60)
    print("UPSTASH REDIS DIRECT CONNECTION TEST")
    print("=" * 60)
    
    # Test 1: Check if upstash-redis package is installed
    print("\n[TEST 1] Checking upstash-redis package...")
    try:
        from upstash_redis import Redis
        print("  ✓ upstash-redis package is installed")
    except ImportError:
        print("  ✗ upstash-redis package NOT installed")
        print("  Run: pip install upstash-redis")
        return False
    
    # Test 2: Create connection
    print("\n[TEST 2] Connecting to Upstash...")
    try:
        redis = Redis(url=UPSTASH_URL, token=UPSTASH_TOKEN)
        print(f"  ✓ Redis client created")
        print(f"  URL: {UPSTASH_URL}")
    except Exception as e:
        print(f"  ✗ Failed to create client: {e}")
        return False
    
    # Test 3: PING test
    print("\n[TEST 3] PING test...")
    try:
        start = time.time()
        result = redis.ping()
        latency = (time.time() - start) * 1000
        print(f"  ✓ PING response: {result}")
        print(f"  Latency: {latency:.2f}ms")
        if latency > 5:
            print("  → This latency confirms you're using Upstash (remote), not local Redis")
    except Exception as e:
        print(f"  ✗ PING failed: {e}")
        return False
    
    # Test 4: SET operation
    print("\n[TEST 4] SET operation...")
    test_key = "v0_test_key"
    test_value = {"message": "Hello from v0!", "timestamp": time.time()}
    try:
        start = time.time()
        redis.set(test_key, json.dumps(test_value), ex=60)  # expires in 60 seconds
        latency = (time.time() - start) * 1000
        print(f"  ✓ SET successful")
        print(f"  Key: {test_key}")
        print(f"  Latency: {latency:.2f}ms")
    except Exception as e:
        print(f"  ✗ SET failed: {e}")
        return False
    
    # Test 5: GET operation
    print("\n[TEST 5] GET operation...")
    try:
        start = time.time()
        result = redis.get(test_key)
        latency = (time.time() - start) * 1000
        retrieved = json.loads(result) if result else None
        print(f"  ✓ GET successful")
        print(f"  Value: {retrieved}")
        print(f"  Latency: {latency:.2f}ms")
    except Exception as e:
        print(f"  ✗ GET failed: {e}")
        return False
    
    # Test 6: DELETE operation
    print("\n[TEST 6] DELETE operation...")
    try:
        start = time.time()
        redis.delete(test_key)
        latency = (time.time() - start) * 1000
        print(f"  ✓ DELETE successful")
        print(f"  Latency: {latency:.2f}ms")
    except Exception as e:
        print(f"  ✗ DELETE failed: {e}")
        return False
    
    # Test 7: Verify deletion
    print("\n[TEST 7] Verify deletion...")
    try:
        result = redis.get(test_key)
        if result is None:
            print(f"  ✓ Key correctly deleted (returns None)")
        else:
            print(f"  ✗ Key still exists: {result}")
            return False
    except Exception as e:
        print(f"  ✗ Verification failed: {e}")
        return False
    
    # Summary
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED!")
    print("=" * 60)
    print("\nYour Upstash Redis is working correctly.")
    print("You are using: Upstash REST API (not local Redis)")
    print(f"Endpoint: {UPSTASH_URL}")
    print("\nNext steps:")
    print("1. Make sure these env vars are set on Render:")
    print("   UPSTASH_REDIS_REST_URL=https://calm-marmot-36085.upstash.io")
    print("   UPSTASH_REDIS_REST_TOKEN=AYz1AAIncDFhODhkODAyZGM3NTg0YWM4YWU2NzY0ZjM1ZGM5MzY1NnAxMzYwODU")
    print("2. Redeploy your app on Render")
    
    return True


if __name__ == "__main__":
    test_upstash()
