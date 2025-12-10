"""
Upstash Redis Connection Test Script
Run this to verify your Upstash Redis is properly configured and working.
"""
import os
import time
import sys
import argparse
import getpass

# Try to load .env if python-dotenv is available (best-effort)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

def _get_credentials():
    """Resolve Upstash credentials from CLI args, env, .env, or interactive prompt (TTY)."""
    p = argparse.ArgumentParser(add_help=False)
    p.add_argument('--url', help='Upstash REST URL')
    p.add_argument('--token', help='Upstash REST token')
    args, _ = p.parse_known_args()

    # priority: CLI args, env vars
    url = args.url or os.environ.get('UPSTASH_REDIS_REST_URL') or os.environ.get('KV_REST_API_URL')
    token = args.token or os.environ.get('UPSTASH_REDIS_REST_TOKEN') or os.environ.get('KV_REST_API_TOKEN')

    # if missing and interactive, prompt user (token masked)
    if (not url or not token) and sys.stdin.isatty():
        print("\nCredentials not found in environment — you can enter them interactively.")
        if not url:
            url = input("Enter UPSTASH_REDIS_REST_URL (or leave blank to abort): ").strip() or None
        if not token:
            token = getpass.getpass("Enter UPSTASH_REDIS_REST_TOKEN (input hidden): ").strip() or None

    return url, token

print("=" * 60)
print("UPSTASH REDIS CONNECTION TEST")
print("=" * 60)

print("\n[1] Checking Environment Variables / CLI / .env...")
upstash_url, upstash_token = _get_credentials()

if upstash_url:
    # Mask the URL for security but show first 40 chars / domain hint
    masked_url = upstash_url[:40] + "..." if len(upstash_url) > 40 else upstash_url
    print(f"   ✓ UPSTASH_REDIS_REST_URL found: {masked_url}")
else:
    print("   ✗ UPSTASH_REDIS_REST_URL NOT FOUND!")
    print("     Set UPSTASH_REDIS_REST_URL in your environment variables")

if upstash_token:
    print(f"   ✓ UPSTASH_REDIS_REST_TOKEN found: {upstash_token[:4]}... (masked)")
else:
    print("   ✗ UPSTASH_REDIS_REST_TOKEN NOT FOUND!")
    print("     Set UPSTASH_REDIS_REST_TOKEN in your environment variables")

if not upstash_url or not upstash_token:
    print("\n❌ Missing credentials. Cannot proceed with Upstash test.")
    print("   Options: set UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN,")
    print("            pass --url / --token to the script, or create a .env file.")
    print("   Your app will fall back to IN-MEMORY cache (not persistent!)")
    sys.exit(1)

# Test 2: Check upstash-redis package
print("\n[2] Checking upstash-redis Package...")
try:
    from upstash_redis import Redis as UpstashRedis
    print("   ✓ upstash-redis package is installed")
except ImportError:
    print("   ✗ upstash-redis package NOT INSTALLED!")
    print("     Run: pip install upstash-redis")
    sys.exit(1)

# Test 3: Connect to Upstash Redis
print("\n[3] Connecting to Upstash Redis...")
try:
    redis_client = UpstashRedis(url=upstash_url, token=upstash_token)
    print("   ✓ Client created successfully")
except Exception as e:
    print(f"   ✗ Failed to create client: {e}")
    sys.exit(1)

# Test 4: Ping test
print("\n[4] Testing Connection (PING)...")
try:
    start = time.time()
    result = redis_client.ping()
    latency = (time.time() - start) * 1000
    print(f"   ✓ PING successful! Response: {result}")
    print(f"   ✓ Latency: {latency:.2f}ms")
except Exception as e:
    print(f"   ✗ PING failed: {e}")
    sys.exit(1)

# Test 5: SET/GET operations
print("\n[5] Testing SET/GET Operations...")
test_key = "mizizzi:test:upstash_verification"
test_value = f"test_value_{int(time.time())}"

try:
    # SET
    start = time.time()
    redis_client.set(test_key, test_value, ex=60)  # 60 second TTL
    set_latency = (time.time() - start) * 1000
    print(f"   ✓ SET successful (latency: {set_latency:.2f}ms)")
    
    # GET
    start = time.time()
    retrieved = redis_client.get(test_key)
    get_latency = (time.time() - start) * 1000
    
    if retrieved == test_value:
        print(f"   ✓ GET successful - Value matches! (latency: {get_latency:.2f}ms)")
    else:
        print(f"   ✗ GET returned wrong value: {retrieved}")
        sys.exit(1)
        
except Exception as e:
    print(f"   ✗ SET/GET failed: {e}")
    sys.exit(1)

# Test 6: JSON serialization test
print("\n[6] Testing JSON Data Storage...")
json_key = "mizizzi:test:json_data"
json_data = {
    "products": [
        {"id": 1, "name": "Test Product", "price": 99.99},
        {"id": 2, "name": "Another Product", "price": 149.99}
    ],
    "timestamp": time.time(),
    "source": "upstash_test"
}

try:
    import json
    start = time.time()
    redis_client.set(json_key, json.dumps(json_data), ex=60)
    set_latency = (time.time() - start) * 1000
    
    start = time.time()
    retrieved_json = redis_client.get(json_key)
    get_latency = (time.time() - start) * 1000
    
    parsed = json.loads(retrieved_json)
    if parsed["source"] == "upstash_test":
        print(f"   ✓ JSON storage works! (SET: {set_latency:.2f}ms, GET: {get_latency:.2f}ms)")
    else:
        print("   ✗ JSON data mismatch")
except Exception as e:
    print(f"   ✗ JSON test failed: {e}")

# Test 7: Check existing keys
print("\n[7] Checking Existing Cache Keys...")
try:
    keys = redis_client.keys("mizizzi:*")
    print(f"   ✓ Found {len(keys)} cached keys with 'mizizzi:' prefix")
    if keys and len(keys) <= 10:
        for key in keys[:10]:
            print(f"      - {key}")
    elif keys:
        print(f"      Showing first 10 of {len(keys)} keys:")
        for key in keys[:10]:
            print(f"      - {key}")
except Exception as e:
    print(f"   ⚠ Could not list keys: {e}")

# Test 8: Cleanup test keys
print("\n[8] Cleaning Up Test Keys...")
try:
    redis_client.delete(test_key)
    redis_client.delete(json_key)
    print("   ✓ Test keys cleaned up")
except Exception as e:
    print(f"   ⚠ Cleanup warning: {e}")

# Final Summary
print("\n" + "=" * 60)
print("TEST RESULTS SUMMARY")
print("=" * 60)
print("✓ Upstash Redis is CONNECTED and WORKING!")
print("✓ You are NOT using in-memory fallback cache")
print("✓ You are NOT using regular Redis (this is Upstash REST API)")
print(f"✓ Upstash URL: {upstash_url.split('.')[0]}...")
print("\nYour caching is production-ready with Upstash Redis!")
print("=" * 60)
