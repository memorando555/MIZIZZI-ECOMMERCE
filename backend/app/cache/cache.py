"""
cache.py - High-performance JSON cache operations for Upstash Redis.

This module provides JSON-safe caching utilities optimized for frontend
consumption (Next.js). All cached data is properly serialized to JSON
and can be directly consumed by JavaScript clients.

Features:
    - JSON-safe serialization using orjson (fast) or standard json
    - Automatic TTL management
    - Cache key generation with MD5 hashing
    - In-memory fallback when Redis is unavailable
    - Cache statistics tracking
    - Pattern-based cache invalidation

Usage:
    from app.cache.cache import cache_manager
    
    # Set a value
    cache_manager.set("products:list", {"items": [...]}, ttl=60)
    
    # Get a value
    data = cache_manager.get("products:list")
    
    # Delete by pattern
    cache_manager.delete_pattern("products:*")
"""
import logging
import hashlib
from datetime import datetime
from typing import Any, Optional, Dict
from functools import wraps

logger = logging.getLogger(__name__)

# Try to import orjson for faster JSON serialization
try:
    import orjson
    
    def fast_json_dumps(obj: Any) -> str:
        """
        Serialize object to JSON string using orjson (fast).
        Handles datetime objects and other non-standard types.
        """
        return orjson.dumps(obj, default=str).decode('utf-8')
    
    def fast_json_loads(s: str) -> Any:
        """Deserialize JSON string to object using orjson."""
        return orjson.loads(s)
    
    USING_ORJSON = True
    logger.info("Using orjson for fast JSON serialization")
    
except ImportError:
    import json
    
    def fast_json_dumps(obj: Any) -> str:
        """
        Serialize object to JSON string using standard json.
        Uses compact separators for smaller payload size.
        """
        return json.dumps(obj, default=str, separators=(',', ':'))
    
    def fast_json_loads(s: str) -> Any:
        """Deserialize JSON string to object using standard json."""
        return json.loads(s)
    
    USING_ORJSON = False
    logger.info("Using standard json library (install orjson for better performance)")


# In-memory fallback cache
_memory_cache: Dict[str, Any] = {}
_memory_timestamps: Dict[str, float] = {}


class CacheManager:
    """
    JSON-safe cache manager for Upstash Redis with in-memory fallback.
    
    All operations are designed to be JSON-safe for frontend (Next.js)
    consumption. The cache automatically falls back to in-memory storage
    when Redis is not available.
    
    Attributes:
        prefix (str): Prefix for all cache keys (default: "mizizzi")
        default_ttl (int): Default TTL in seconds (default: 30)
    """
    
    def __init__(self, prefix: str = "mizizzi", default_ttl: int = 30):
        """
        Initialize the cache manager.
        
        Args:
            prefix: Prefix for all cache keys
            default_ttl: Default time-to-live in seconds
        """
        self.prefix = prefix
        self.default_ttl = default_ttl
        self._stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'errors': 0,
            'invalidations': 0
        }
        self._client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the Redis client connection."""
        try:
            from app.cache.redis_client import get_redis_client, is_redis_connected
            self._client = get_redis_client()
            self._connected = is_redis_connected()
        except ImportError:
            logger.warning("Redis client module not available, using memory cache")
            self._client = None
            self._connected = False
    
    @property
    def is_connected(self) -> bool:
        """Check if Redis is connected."""
        return self._connected and self._client is not None
    
    @property
    def stats(self) -> dict:
        """
        Get cache statistics.
        
        Returns:
            dict: Cache statistics including hit rate
        """
        total = self._stats['hits'] + self._stats['misses']
        hit_rate = (self._stats['hits'] / total * 100) if total > 0 else 0
        return {
            **self._stats,
            'total_requests': total,
            'hit_rate_percent': round(hit_rate, 2),
            'using_orjson': USING_ORJSON,
            'cache_type': 'upstash' if self.is_connected else 'memory'
        }
    
    def generate_key(self, namespace: str, params: Optional[dict] = None) -> str:
        """
        Generate a cache key from namespace and parameters.
        
        Args:
            namespace: The cache namespace (e.g., "products", "trending")
            params: Optional dictionary of parameters to include in the key
        
        Returns:
            str: A unique cache key
        """
        if params:
            sorted_params = sorted(params.items())
            param_str = fast_json_dumps(sorted_params)
            param_hash = hashlib.md5(param_str.encode()).hexdigest()[:12]
            return f"{self.prefix}:{namespace}:{param_hash}"
        return f"{self.prefix}:{namespace}"
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from cache and deserialize from JSON.
        
        Args:
            key: The cache key
        
        Returns:
            The cached value or None if not found
        """
        try:
            if self.is_connected:
                value = self._client.get(key)
                if value is not None:
                    self._stats['hits'] += 1
                    logger.debug(f"CACHE HIT: {key}")
                    # Value from Upstash is already a string
                    return fast_json_loads(value) if isinstance(value, str) else value
                
                self._stats['misses'] += 1
                logger.debug(f"CACHE MISS: {key}")
                return None
            else:
                # In-memory fallback
                return self._get_from_memory(key)
                
        except Exception as e:
            logger.error(f"Cache get error for {key}: {e}")
            self._stats['errors'] += 1
            return None
    
    def get_raw(self, key: str) -> Optional[str]:
        """
        Get raw string value from cache (pre-serialized JSON).
        Use this for fast cache hits that bypass deserialization.
        
        Args:
            key: The cache key
        
        Returns:
            The raw JSON string or None if not found
        """
        try:
            if self.is_connected:
                value = self._client.get(key)
                if value is not None:
                    self._stats['hits'] += 1
                    logger.debug(f"RAW CACHE HIT: {key}")
                    return value
                
                self._stats['misses'] += 1
                logger.debug(f"RAW CACHE MISS: {key}")
                return None
            else:
                return self._get_raw_from_memory(key)
                
        except Exception as e:
            logger.error(f"Cache get_raw error for {key}: {e}")
            self._stats['errors'] += 1
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Serialize value to JSON and store in cache.
        
        Args:
            key: The cache key
            value: The value to cache (will be JSON serialized)
            ttl: Time-to-live in seconds (optional, uses default if not provided)
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            ttl = ttl or self.default_ttl
            json_value = fast_json_dumps(value)
            
            if self.is_connected:
                self._client.set(key, json_value, ex=ttl)
                self._stats['sets'] += 1
                logger.debug(f"CACHE SET: {key} (TTL: {ttl}s)")
                return True
            else:
                return self._set_to_memory(key, value, ttl)
                
        except Exception as e:
            logger.error(f"Cache set error for {key}: {e}")
            self._stats['errors'] += 1
            return False
    
    def set_raw(self, key: str, json_string: str, ttl: Optional[int] = None) -> bool:
        """
        Store a pre-serialized JSON string in cache.
        Use this to avoid double serialization for maximum performance.
        
        Args:
            key: The cache key
            json_string: The pre-serialized JSON string
            ttl: Time-to-live in seconds
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            ttl = ttl or self.default_ttl
            
            if self.is_connected:
                self._client.set(key, json_string, ex=ttl)
                self._stats['sets'] += 1
                logger.debug(f"RAW CACHE SET: {key} (TTL: {ttl}s)")
                return True
            else:
                return self._set_raw_to_memory(key, json_string, ttl)
                
        except Exception as e:
            logger.error(f"Cache set_raw error for {key}: {e}")
            self._stats['errors'] += 1
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete a key from cache.
        
        Args:
            key: The cache key to delete
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if self.is_connected:
                self._client.delete(key)
                logger.debug(f"CACHE DELETE: {key}")
                return True
            else:
                if key in _memory_cache:
                    del _memory_cache[key]
                    if key in _memory_timestamps:
                        del _memory_timestamps[key]
                return True
                
        except Exception as e:
            logger.error(f"Cache delete error for {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern.
        
        Args:
            pattern: Pattern to match (e.g., "mizizzi:products:*")
        
        Returns:
            int: Number of keys deleted
        """
        try:
            count = 0
            
            if self.is_connected:
                keys = self._client.keys(pattern)
                if keys:
                    for key in keys:
                        self._client.delete(key)
                        count += 1
                    logger.info(f"CACHE PATTERN DELETE: {pattern} ({count} keys)")
            else:
                # Memory cache fallback
                prefix = pattern.replace('*', '')
                keys_to_delete = [k for k in _memory_cache.keys() if k.startswith(prefix)]
                for key in keys_to_delete:
                    del _memory_cache[key]
                    if key in _memory_timestamps:
                        del _memory_timestamps[key]
                    count += 1
            
            self._stats['invalidations'] += count
            return count
            
        except Exception as e:
            logger.error(f"Cache pattern delete error for {pattern}: {e}")
            return 0
    
    def invalidate_products(self) -> int:
        """Invalidate all product-related cache entries."""
        return self.delete_pattern(f"{self.prefix}:products:*")
    
    def invalidate_featured(self) -> int:
        """Invalidate all featured product caches."""
        count = 0
        patterns = [
            f"{self.prefix}:featured:*",
            f"{self.prefix}:fast_*",
            f"{self.prefix}:trending:*",
            f"{self.prefix}:top_picks:*",
            f"{self.prefix}:new_arrivals:*",
            f"{self.prefix}:daily_finds:*",
            f"{self.prefix}:flash_sale:*",
            f"{self.prefix}:luxury_deals:*",
        ]
        for pattern in patterns:
            count += self.delete_pattern(pattern)
        return count
    
    def invalidate_all(self) -> int:
        """Invalidate all cache entries for this prefix."""
        return self.delete_pattern(f"{self.prefix}:*")
    
    # In-memory fallback methods
    
    def _get_from_memory(self, key: str) -> Optional[Any]:
        """Get value from in-memory cache with TTL check."""
        if key in _memory_cache:
            timestamp = _memory_timestamps.get(key, 0)
            if datetime.now().timestamp() - timestamp < 300:  # 5 min default
                self._stats['hits'] += 1
                logger.debug(f"MEMORY HIT: {key}")
                return _memory_cache[key]
            else:
                del _memory_cache[key]
                del _memory_timestamps[key]
        
        self._stats['misses'] += 1
        logger.debug(f"MEMORY MISS: {key}")
        return None
    
    def _get_raw_from_memory(self, key: str) -> Optional[str]:
        """Get raw JSON string from in-memory cache."""
        value = self._get_from_memory(key)
        if value is not None:
            return fast_json_dumps(value)
        return None
    
    def _set_to_memory(self, key: str, value: Any, ttl: int) -> bool:
        """Set value in in-memory cache."""
        _memory_cache[key] = value
        _memory_timestamps[key] = datetime.now().timestamp()
        self._stats['sets'] += 1
        logger.debug(f"MEMORY SET: {key}")
        return True
    
    def _set_raw_to_memory(self, key: str, json_string: str, ttl: int) -> bool:
        """Set raw JSON string in in-memory cache."""
        _memory_cache[key] = fast_json_loads(json_string)
        _memory_timestamps[key] = datetime.now().timestamp()
        self._stats['sets'] += 1
        logger.debug(f"MEMORY RAW SET: {key}")
        return True


# Global cache manager instance
cache_manager = CacheManager()


# Decorator for caching Flask route responses
def cached_response(namespace: str, ttl: int = 30, key_params: Optional[list] = None):
    """
    Decorator for caching Flask route responses.
    
    Caches the JSON response and returns it directly on cache hits,
    reducing database queries and serialization overhead.
    
    Args:
        namespace: Cache namespace (e.g., "products", "trending")
        ttl: Time-to-live in seconds
        key_params: List of request args to include in cache key
    
    Usage:
        @app.route('/api/products')
        @cached_response("products", ttl=30, key_params=["page", "limit"])
        def get_products():
            return {"items": [...]}
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from flask import request, jsonify, current_app
            
            try:
                # Build cache key from specified params
                params = {}
                if key_params:
                    for param in key_params:
                        value = request.args.get(param)
                        if value is not None:
                            params[param] = value
                
                cache_key = cache_manager.generate_key(namespace, params)
                
                # Try to get from cache
                cached = cache_manager.get(cache_key)
                if cached is not None:
                    current_app.logger.info(f"[CACHE HIT] {namespace} - {cache_key}")
                    response = jsonify(cached)
                    response.headers['X-Cache'] = 'HIT'
                    response.headers['X-Cache-Key'] = cache_key
                    return response, 200
                
                current_app.logger.info(f"[CACHE MISS] {namespace} - {cache_key}")
                
                # Execute function
                result = func(*args, **kwargs)
                
                # Handle tuple returns (data, status_code)
                if isinstance(result, tuple):
                    data, status_code = result[0], result[1] if len(result) > 1 else 200
                    if status_code == 200:
                        if hasattr(data, 'get_json'):
                            json_data = data.get_json()
                        else:
                            json_data = data
                        cache_manager.set(cache_key, json_data, ttl)
                    return result
                else:
                    if hasattr(result, 'get_json'):
                        json_data = result.get_json()
                        cache_manager.set(cache_key, json_data, ttl)
                    return result
                    
            except Exception as e:
                current_app.logger.error(f"Cache decorator error: {e}")
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


def fast_cached_response(namespace: str, ttl: int = 30, key_params: Optional[list] = None):
    """
    ULTRA-FAST decorator that caches pre-serialized JSON strings.
    
    This decorator bypasses Flask's jsonify() on cache hits for maximum
    speed (5-20ms response times when cached). Use this for high-traffic
    endpoints that need sub-20ms response times.
    
    Args:
        namespace: Cache namespace
        ttl: Time-to-live in seconds
        key_params: List of request args to include in cache key
    
    Usage:
        @app.route('/api/fast/trending')
        @fast_cached_response("fast_trending", ttl=60, key_params=["limit"])
        def get_fast_trending():
            return {"items": [...]}  # Return dict, not jsonify()
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from flask import request, Response, current_app
            
            try:
                # Build cache key
                params = {}
                if key_params:
                    for param in key_params:
                        value = request.args.get(param)
                        if value is not None:
                            params[param] = value
                
                cache_key = cache_manager.generate_key(namespace, params)
                
                # Try to get pre-serialized JSON from cache
                cached_json = cache_manager.get_raw(cache_key)
                if cached_json is not None:
                    current_app.logger.info(f"[FAST CACHE HIT] {namespace}")
                    response = Response(
                        cached_json,
                        status=200,
                        mimetype='application/json'
                    )
                    response.headers['X-Cache'] = 'HIT'
                    response.headers['X-Cache-Key'] = cache_key
                    response.headers['X-Fast-Cache'] = 'true'
                    return response
                
                current_app.logger.info(f"[FAST CACHE MISS] {namespace}")
                
                # Execute function - expects dict return
                result = func(*args, **kwargs)
                
                # Handle tuple returns (data, status_code)
                if isinstance(result, tuple):
                    data, status_code = result[0], result[1] if len(result) > 1 else 200
                else:
                    data, status_code = result, 200
                
                if status_code == 200:
                    json_str = fast_json_dumps(data)
                    cache_manager.set_raw(cache_key, json_str, ttl)
                    
                    response = Response(
                        json_str,
                        status=200,
                        mimetype='application/json'
                    )
                    response.headers['X-Cache'] = 'MISS'
                    response.headers['X-Cache-Key'] = cache_key
                    return response
                else:
                    return Response(
                        fast_json_dumps(data),
                        status=status_code,
                        mimetype='application/json'
                    )
                    
            except Exception as e:
                current_app.logger.error(f"Fast cache decorator error: {e}")
                result = func(*args, **kwargs)
                if isinstance(result, tuple):
                    data, status_code = result[0], result[1] if len(result) > 1 else 200
                else:
                    data, status_code = result, 200
                return Response(
                    fast_json_dumps(data),
                    status=status_code,
                    mimetype='application/json'
                )
        
        return wrapper
    return decorator


def invalidate_on_change(namespaces: list):
    """
    Decorator to invalidate cache after successful mutations.
    
    Use this on POST, PUT, DELETE endpoints to automatically
    invalidate related cache entries after successful operations.
    
    Args:
        namespaces: List of cache namespaces to invalidate
    
    Usage:
        @app.route('/api/admin/products', methods=['POST'])
        @invalidate_on_change(["products", "featured", "trending"])
        def create_product():
            # Create product...
            return {"success": True}
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            from flask import current_app
            
            result = func(*args, **kwargs)
            
            # Check if operation was successful
            if isinstance(result, tuple):
                status_code = result[1] if len(result) > 1 else 200
            else:
                status_code = 200
            
            # Invalidate cache on successful mutations
            if 200 <= status_code < 300:
                for namespace in namespaces:
                    count = cache_manager.delete_pattern(f"{cache_manager.prefix}:{namespace}:*")
                    current_app.logger.info(f"[CACHE INVALIDATE] {namespace} ({count} keys)")
            
            return result
        
        return wrapper
    return decorator
