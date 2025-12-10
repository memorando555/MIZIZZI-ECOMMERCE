"""
Cache module for Mizizzi E-commerce platform.

This module provides Upstash Redis caching with JSON-safe operations
optimized for Next.js frontend consumption.

Exports:
    - redis_client: The raw Upstash Redis client
    - cache_manager: High-level cache operations manager
    - cached_response: Decorator for caching Flask routes
    - fast_cached_response: Ultra-fast caching decorator
    - invalidate_on_change: Decorator for cache invalidation
    - fast_json_dumps: Fast JSON serialization function
    - fast_json_loads: Fast JSON deserialization function
"""
from app.cache.redis_client import (
    redis_client,
    get_redis_client,
    is_redis_connected,
    close_redis_client
)
from app.cache.cache import (
    cache_manager,
    cached_response,
    fast_cached_response,
    invalidate_on_change,
    fast_json_dumps,
    fast_json_loads,
    CacheManager
)

__all__ = [
    # Redis client
    'redis_client',
    'get_redis_client',
    'is_redis_connected',
    'close_redis_client',
    # Cache manager
    'cache_manager',
    'CacheManager',
    # Decorators
    'cached_response',
    'fast_cached_response',
    'invalidate_on_change',
    # JSON utilities
    'fast_json_dumps',
    'fast_json_loads',
]
