"""
redis_client.py - Initializes Upstash Redis client using REST API.

This module provides a singleton Redis client that connects to Upstash Redis
using their official Python SDK (upstash-redis). It supports both the 
Upstash REST API credentials and falls back to in-memory caching if 
credentials are not available.

Environment Variables Required:
    - UPSTASH_REDIS_REST_URL: The Upstash Redis REST API URL
    - UPSTASH_REDIS_REST_TOKEN: The Upstash Redis REST API token

Alternative env vars (Vercel integration):
    - KV_REST_API_URL
    - KV_REST_API_TOKEN

Usage:
    from app.cache.redis_client import get_redis_client, redis_client
    
    # Get the singleton client
    client = get_redis_client()
    
    # Or use the pre-initialized instance
    from app.cache.redis_client import redis_client
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Track connection state globally
_redis_client = None
_is_connected = False


def get_upstash_credentials() -> tuple[Optional[str], Optional[str]]:
    """
    Retrieve Upstash Redis credentials from environment variables.
    Supports both Upstash native and Vercel KV naming conventions.
    
    Returns:
        tuple: (url, token) or (None, None) if not configured
    """
    url = (
        os.environ.get('UPSTASH_REDIS_REST_URL') or 
        os.environ.get('KV_REST_API_URL')
    )
    token = (
        os.environ.get('UPSTASH_REDIS_REST_TOKEN') or 
        os.environ.get('KV_REST_API_TOKEN')
    )
    return url, token


def create_upstash_client():
    """
    Create and return an Upstash Redis client instance.
    
    This function attempts to create a connection to Upstash Redis
    and validates it with a ping command.
    
    Returns:
        UpstashRedis client or None if connection fails
    """
    global _redis_client, _is_connected
    
    # Return existing client if already connected
    if _redis_client is not None and _is_connected:
        return _redis_client
    
    url, token = get_upstash_credentials()
    
    if not url or not token:
        logger.warning(
            "Upstash Redis credentials not found. "
            "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN "
            "environment variables. Using in-memory fallback."
        )
        _is_connected = False
        return None
    
    try:
        from upstash_redis import Redis as UpstashRedis
        
        # Create the Upstash Redis client
        client = UpstashRedis(url=url, token=token)
        
        # Test connection with ping
        response = client.ping()
        if response:
            logger.info(f"Upstash Redis connected successfully to {url}")
            _redis_client = client
            _is_connected = True
            return client
        else:
            logger.warning("Upstash Redis ping failed, using fallback")
            _is_connected = False
            return None
            
    except ImportError:
        logger.error(
            "upstash-redis package not installed. "
            "Install with: pip install upstash-redis"
        )
        _is_connected = False
        return None
        
    except Exception as e:
        logger.error(f"Failed to connect to Upstash Redis: {e}")
        _is_connected = False
        return None


def get_redis_client():
    """
    Get the singleton Upstash Redis client instance.
    
    Returns:
        UpstashRedis client or None if not available
    """
    global _redis_client
    
    if _redis_client is None:
        _redis_client = create_upstash_client()
    
    return _redis_client


def is_redis_connected() -> bool:
    """
    Check if Redis is currently connected.
    
    Returns:
        bool: True if connected to Upstash Redis, False otherwise
    """
    return _is_connected


def close_redis_client():
    """
    Close the Redis client connection and reset state.
    Useful for testing and cleanup.
    """
    global _redis_client, _is_connected
    _redis_client = None
    _is_connected = False
    logger.info("Redis client connection closed")


# Pre-initialize the client on module import
redis_client = create_upstash_client()
