"""
Upstash Redis Cache Utility for Mizizzi E-commerce platform.
OPTIMIZED: High-performance caching with Upstash Redis (serverless, HTTP-based).

NOTE: This file maintains backwards compatibility with existing imports.
The actual implementation has been moved to app/cache/ for better organization.
"""
import os
import logging
from functools import wraps
from datetime import datetime
from typing import Any, Optional, Callable
import hashlib

logger = logging.getLogger(__name__)

try:
    from app.cache.cache import (
        fast_json_dumps,
        fast_json_loads,
        cache_manager as _cache_manager,
        cached_response,
        fast_cached_response,
        invalidate_on_change,
        USING_ORJSON
    )
    from app.cache.redis_client import (
        redis_client as _redis_client,
        is_redis_connected
    )
    
    FAST_JSON = USING_ORJSON
    
    # Backwards compatible wrapper class
    class RedisCache:
        """
        Backwards-compatible wrapper for the new CacheManager.
        Maintains the same API as the original implementation.
        """
        
        def __init__(self):
            self._cache = _cache_manager
        
        @property
        def is_connected(self) -> bool:
            return self._cache.is_connected
        
        @property
        def stats(self) -> dict:
            return self._cache.stats
        
        def _generate_key(self, prefix: str, params: dict) -> str:
            return self._cache.generate_key(prefix, params)
        
        def get_raw(self, key: str) -> Optional[str]:
            return self._cache.get_raw(key)
        
        def set_raw(self, key: str, value: str, ttl: int = 30) -> bool:
            return self._cache.set_raw(key, value, ttl)
        
        def get(self, key: str) -> Optional[Any]:
            return self._cache.get(key)
        
        def set(self, key: str, value: Any, ttl: int = 30) -> bool:
            return self._cache.set(key, value, ttl)
        
        def delete(self, key: str) -> bool:
            return self._cache.delete(key)
        
        def delete_pattern(self, pattern: str) -> int:
            return self._cache.delete_pattern(pattern)
        
        def invalidate_products(self) -> int:
            return self._cache.invalidate_products()
        
        def invalidate_featured(self) -> int:
            return self._cache.invalidate_featured()
        
        def invalidate_search(self) -> int:
            return self._cache.delete_pattern("mizizzi:search:*")
        
        def invalidate_all_products(self) -> int:
            return self._cache.invalidate_all()
        
        def flush_all(self) -> bool:
            try:
                self._cache.invalidate_all()
                return True
            except Exception:
                return False
    
    # Global instance
    product_cache = RedisCache()
    
    logger.info("Using new modular cache system from app/cache/")

except ImportError as e:
    logger.warning(f"Could not import from app.cache, using fallback: {e}")
    
    # Fallback to original implementation if new module not available
    try:
        import orjson
        
        def fast_json_dumps(obj):
            return orjson.dumps(obj, default=str).decode('utf-8')
        
        def fast_json_loads(s):
            return orjson.loads(s)
        
        FAST_JSON = True
    except ImportError:
        import json
        
        def fast_json_dumps(obj):
            return json.dumps(obj, default=str, separators=(',', ':'))
        
        def fast_json_loads(s):
            return json.loads(s)
        
        FAST_JSON = False

    # In-memory fallback
    _memory_cache = {}
    _memory_cache_timestamps = {}

    class RedisCache:
        """Fallback Redis cache implementation."""
        
        def __init__(self):
            self._client = None
            self._connected = False
            self._stats = {'hits': 0, 'misses': 0, 'sets': 0, 'errors': 0}
            self._initialize()
        
        def _initialize(self):
            url = os.environ.get('UPSTASH_REDIS_REST_URL') or os.environ.get('KV_REST_API_URL')
            token = os.environ.get('UPSTASH_REDIS_REST_TOKEN') or os.environ.get('KV_REST_API_TOKEN')
            
            if not url or not token:
                logger.warning("Upstash credentials not found, using memory cache")
                return
            
            try:
                from upstash_redis import Redis as UpstashRedis
                self._client = UpstashRedis(url=url, token=token)
                self._client.ping()
                self._connected = True
                logger.info("Upstash Redis connected")
            except Exception as e:
                logger.warning(f"Upstash connection failed: {e}")
        
        @property
        def is_connected(self) -> bool:
            return self._connected
        
        @property
        def stats(self) -> dict:
            total = self._stats['hits'] + self._stats['misses']
            hit_rate = (self._stats['hits'] / total * 100) if total > 0 else 0
            return {**self._stats, 'hit_rate_percent': round(hit_rate, 2)}
        
        def _generate_key(self, prefix: str, params: dict) -> str:
            param_str = fast_json_dumps(sorted(params.items()))
            param_hash = hashlib.md5(param_str.encode()).hexdigest()[:12]
            return f"mizizzi:{prefix}:{param_hash}"
        
        def get_raw(self, key: str) -> Optional[str]:
            try:
                if self._connected:
                    value = self._client.get(key)
                    if value:
                        self._stats['hits'] += 1
                        return value
                self._stats['misses'] += 1
                return None
            except Exception:
                self._stats['errors'] += 1
                return None
        
        def set_raw(self, key: str, value: str, ttl: int = 30) -> bool:
            try:
                if self._connected:
                    self._client.set(key, value, ex=ttl)
                    self._stats['sets'] += 1
                    return True
                return False
            except Exception:
                self._stats['errors'] += 1
                return False
        
        def get(self, key: str) -> Optional[Any]:
            raw = self.get_raw(key)
            return fast_json_loads(raw) if raw else None
        
        def set(self, key: str, value: Any, ttl: int = 30) -> bool:
            return self.set_raw(key, fast_json_dumps(value), ttl)
        
        def delete(self, key: str) -> bool:
            try:
                if self._connected:
                    self._client.delete(key)
                return True
            except Exception:
                return False
        
        def delete_pattern(self, pattern: str) -> int:
            try:
                if self._connected:
                    keys = self._client.keys(pattern)
                    for key in (keys or []):
                        self._client.delete(key)
                    return len(keys or [])
                return 0
            except Exception:
                return 0
        
        def invalidate_products(self) -> int:
            return self.delete_pattern("mizizzi:products:*")
        
        def invalidate_featured(self) -> int:
            return self.delete_pattern("mizizzi:featured:*")
        
        def invalidate_search(self) -> int:
            return self.delete_pattern("mizizzi:search:*")
        
        def invalidate_all_products(self) -> int:
            return self.delete_pattern("mizizzi:*")
        
        def flush_all(self) -> bool:
            return self.delete_pattern("mizizzi:*") >= 0

    product_cache = RedisCache()

    def cached_response(prefix: str, ttl: int = 30, key_params: Optional[list] = None):
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                from flask import request, jsonify, current_app
                try:
                    params = {p: request.args.get(p) for p in (key_params or []) if request.args.get(p)}
                    cache_key = product_cache._generate_key(prefix, params)
                    cached = product_cache.get(cache_key)
                    if cached:
                        response = jsonify(cached)
                        response.headers['X-Cache'] = 'HIT'
                        return response, 200
                    result = func(*args, **kwargs)
                    if isinstance(result, tuple) and result[1] == 200:
                        data = result[0].get_json() if hasattr(result[0], 'get_json') else result[0]
                        product_cache.set(cache_key, data, ttl)
                    return result
                except Exception as e:
                    current_app.logger.error(f"Cache error: {e}")
                    return func(*args, **kwargs)
            return wrapper
        return decorator

    def fast_cached_response(prefix: str, ttl: int = 30, key_params: Optional[list] = None):
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                from flask import request, Response, current_app
                try:
                    params = {p: request.args.get(p) for p in (key_params or []) if request.args.get(p)}
                    cache_key = product_cache._generate_key(prefix, params)
                    cached_json = product_cache.get_raw(cache_key)
                    if cached_json:
                        response = Response(cached_json, status=200, mimetype='application/json')
                        response.headers['X-Cache'] = 'HIT'
                        response.headers['X-Fast-Cache'] = 'true'
                        return response
                    result = func(*args, **kwargs)
                    data, status = (result[0], result[1]) if isinstance(result, tuple) else (result, 200)
                    if status == 200:
                        json_str = fast_json_dumps(data)
                        product_cache.set_raw(cache_key, json_str, ttl)
                        return Response(json_str, status=200, mimetype='application/json')
                    return Response(fast_json_dumps(data), status=status, mimetype='application/json')
                except Exception as e:
                    current_app.logger.error(f"Fast cache error: {e}")
                    result = func(*args, **kwargs)
                    data, status = (result[0], result[1]) if isinstance(result, tuple) else (result, 200)
                    return Response(fast_json_dumps(data), status=status, mimetype='application/json')
            return wrapper
        return decorator

    def invalidate_on_change(prefixes: list):
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                from flask import current_app
                result = func(*args, **kwargs)
                status = result[1] if isinstance(result, tuple) and len(result) > 1 else 200
                if 200 <= status < 300:
                    for prefix in prefixes:
                        product_cache.delete_pattern(f"mizizzi:{prefix}:*")
                return result
            return wrapper
        return decorator
