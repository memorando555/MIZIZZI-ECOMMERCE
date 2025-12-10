"""
Add this health check endpoint to your Flask app to monitor Upstash Redis status.
Import and register this blueprint in your main app.
"""
from flask import Blueprint, jsonify
import time
import os
import json
import sys
import importlib
from upstash_redis import Redis as UpstashRedis

redis_health_bp = Blueprint('redis_health', __name__)


def _ensure_project_on_path():
    """Ensure likely project directories are on sys.path so local modules can be imported when running this script directly."""
    # add current scripts dir
    scripts_dir = os.path.dirname(__file__)
    if scripts_dir and scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)
    # add backend dir (one level up)
    backend_dir = os.path.dirname(scripts_dir)
    if backend_dir and backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    # add repository root (two levels up)
    repo_root = os.path.dirname(backend_dir)
    if repo_root and repo_root not in sys.path:
        sys.path.insert(0, repo_root)


def test_upstash_directly():
    """
    Test Upstash Redis directly without importing any project modules.
    This is the cleanest way to verify Upstash is working.
    """
    result = {
        "service": "upstash-redis",
        "timestamp": time.time(),
    }
    
    # Check environment variables
    upstash_url = os.environ.get('UPSTASH_REDIS_REST_URL') or os.environ.get('KV_REST_API_URL')
    upstash_token = os.environ.get('UPSTASH_REDIS_REST_TOKEN') or os.environ.get('KV_REST_API_TOKEN')
    
    result["environment_vars"] = {
        "UPSTASH_REDIS_REST_URL": bool(upstash_url),
        "UPSTASH_REDIS_REST_TOKEN": bool(upstash_token),
        "url_preview": upstash_url[:40] + "..." if upstash_url and len(upstash_url) > 40 else upstash_url,
    }
    
    if not upstash_url or not upstash_token:
        result.update({
            "is_connected": False,
            "cache_type": "none",
            "status": "unhealthy",
            "message": "Missing environment variables! Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
            "fix": "On Render: Go to Dashboard > Your Service > Environment > Add these variables from your Upstash dashboard"
        })
        return result, 503
    
    try:
        from upstash_redis import Redis as UpstashRedis
        result["package_installed"] = True
    except ImportError:
        result.update({
            "is_connected": False,
            "cache_type": "none", 
            "package_installed": False,
            "status": "unhealthy",
            "message": "upstash-redis package not installed!",
            "fix": "Run: pip install upstash-redis"
        })
        return result, 503
    
    try:
        redis_client = UpstashRedis(url=upstash_url, token=upstash_token)
        
        # PING test
        start = time.time()
        ping_result = redis_client.ping()
        ping_latency = (time.time() - start) * 1000
        
        # SET test
        test_key = "mizizzi:health:direct_test"
        test_value = f"test_{int(time.time())}"
        
        start = time.time()
        redis_client.set(test_key, test_value, ex=60)
        set_latency = (time.time() - start) * 1000
        
        # GET test
        start = time.time()
        retrieved = redis_client.get(test_key)
        get_latency = (time.time() - start) * 1000
        
        # Cleanup
        redis_client.delete(test_key)
        
        # Check existing mizizzi keys
        try:
            existing_keys = redis_client.keys("mizizzi:*")
            key_count = len(existing_keys) if existing_keys else 0
        except:
            key_count = "unknown"
        
        result.update({
            "is_connected": True,
            "cache_type": "upstash",
            "status": "healthy",
            "message": "Upstash Redis is working perfectly!",
            "operations_test": {
                "ping": {"success": True, "latency_ms": round(ping_latency, 2)},
                "set": {"success": True, "latency_ms": round(set_latency, 2)},
                "get": {"success": retrieved == test_value, "latency_ms": round(get_latency, 2)},
            },
            "existing_cache_keys": key_count,
            "verification": {
                "is_upstash": "upstash.io" in upstash_url.lower() or "upstash" in upstash_url.lower(),
                "is_rest_api": "https://" in upstash_url,
                "not_local_redis": "localhost" not in upstash_url and "127.0.0.1" not in upstash_url,
            }
        })
        return result, 200
        
    except Exception as e:
        result.update({
            "is_connected": False,
            "cache_type": "none",
            "status": "unhealthy",
            "message": f"Connection failed: {str(e)}",
            "error_type": type(e).__name__
        })
        return result, 503


@redis_health_bp.route('/api/health/redis', methods=['GET'])
def redis_health_check():
    """Health check endpoint to verify Upstash Redis connection."""
    result, status_code = test_upstash_directly()
    return jsonify(result), status_code


@redis_health_bp.route('/api/health/redis/stats', methods=['GET'])
def redis_stats():
    """Get detailed cache statistics."""
    upstash_url = os.environ.get('UPSTASH_REDIS_REST_URL') or os.environ.get('KV_REST_API_URL')
    upstash_token = os.environ.get('UPSTASH_REDIS_REST_TOKEN') or os.environ.get('KV_REST_API_TOKEN')
    
    try:
        redis_client = UpstashRedis(url=upstash_url, token=upstash_token)
        
        return jsonify({
            "cache_type": "upstash",
            "is_upstash_connected": redis_client.is_connected,
            "stats": redis_client.stats(),
            "message": "Using Upstash Redis (persistent, fast)"
        })
    except Exception as e:
        return jsonify({
            "cache_type": "none",
            "is_upstash_connected": False,
            "stats": {},
            "message": str(e),
            "error_type": type(e).__name__
        }), 503


@redis_health_bp.route('/api/health/redis/clear-test', methods=['POST'])
def clear_test_cache():
    """Clear all test cache keys (for debugging)."""
    upstash_url = os.environ.get('UPSTASH_REDIS_REST_URL') or os.environ.get('KV_REST_API_URL')
    upstash_token = os.environ.get('UPSTASH_REDIS_REST_TOKEN') or os.environ.get('KV_REST_API_TOKEN')
    
    try:
        redis_client = UpstashRedis(url=upstash_url, token=upstash_token)
        
        count = redis_client.delete_pattern("mizizzi:test:*")
        count += redis_client.delete_pattern("mizizzi:health:*")
        
        return jsonify({
            "status": "success",
            "keys_deleted": count,
            "cache_type": "upstash"
        })
    except Exception as e:
        return jsonify({
            "status": "failure",
            "keys_deleted": 0,
            "cache_type": "none",
            "message": str(e),
            "error_type": type(e).__name__
        }), 503


if __name__ == '__main__':
    # CLI mode for quick local testing / CI checks.
    # ensure project root is on sys.path early
    _ensure_project_on_path()
    result, status_code = test_upstash_directly()
    # Pretty-print to stdout and exit with non-zero when unhealthy.
    print(json.dumps(result, indent=2))
    
    print("\n" + "=" * 60)
    if result["status"] == "healthy":
        print("SUCCESS: Upstash Redis is connected and working!")
        print("Your app is using REAL Upstash Redis (not memory cache)")
    else:
        print("FAILED: " + result.get("message", "Unknown error"))
        if "fix" in result:
            print("FIX: " + result["fix"])
    print("=" * 60)
    
    sys.exit(0 if status_code == 200 else 1)
