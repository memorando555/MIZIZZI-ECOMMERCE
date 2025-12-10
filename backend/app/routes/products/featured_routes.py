"""
Featured product routes for specific sections like Trending, Top Picks, etc.
ULTRA-OPTIMIZED: Lightweight JSON responses with Upstash Redis pre-serialized caching.
"""
from flask import Blueprint, request, current_app, Response
from sqlalchemy.orm import load_only
from datetime import datetime
import time

from app.models.models import Product
from app.configuration.extensions import db
from app.utils.redis_cache import (
    product_cache, 
    fast_cached_response, 
    fast_json_dumps,
    cached_response
)

featured_routes = Blueprint('featured_routes', __name__)


def serialize_minimal_product(product):
    """
    ULTRA-FAST: Minimal serialization for listing views.
    Returns only the 6 fields the frontend actually needs.
    ~80% smaller payload than full serialization.
    """
    # Get primary image
    image_url = product.thumbnail_url
    if not image_url and hasattr(product, 'image_urls') and product.image_urls:
        if isinstance(product.image_urls, list) and len(product.image_urls) > 0:
            image_url = product.image_urls[0]
        elif isinstance(product.image_urls, str):
            image_url = product.image_urls.split(',')[0] if product.image_urls else None
    
    return {
        'id': product.id,
        'name': product.name,
        'slug': product.slug,
        'price': float(product.price) if product.price else 0,
        'sale_price': float(product.sale_price) if product.sale_price else None,
        'image': image_url
    }


def get_minimal_product_query():
    """Return a query with only essential columns loaded."""
    return Product.query.options(
        load_only(
            Product.id, 
            Product.name, 
            Product.slug, 
            Product.price,
            Product.sale_price, 
            Product.thumbnail_url,
            Product.image_urls,
            Product.is_active, 
            Product.is_visible
        )
    )


# ==========================================
# ULTRA-FAST ENDPOINTS (Upstash Redis Optimized)
# ==========================================

@featured_routes.route('/fast/trending', methods=['GET'])
@fast_cached_response("fast_trending", ttl=60, key_params=["limit"])
def get_fast_trending():
    """ULTRA-FAST: Minimal trending products endpoint with Upstash caching."""
    try:
        limit = min(request.args.get('limit', 12, type=int), 50)
        
        products = get_minimal_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_trending == True
        ).limit(limit).all()
        
        if not products:
            products = get_minimal_product_query().filter(
                Product.is_active == True, 
                Product.is_visible == True
            ).limit(limit).all()
        
        return {
            'items': [serialize_minimal_product(p) for p in products],
            'count': len(products),
            'ts': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Fast trending error: {str(e)}")
        return {'error': 'Failed to fetch'}, 500


@featured_routes.route('/fast/flash-sale', methods=['GET'])
@fast_cached_response("fast_flash_sale", ttl=60, key_params=["limit"])
def get_fast_flash_sale():
    """ULTRA-FAST: Minimal flash sale products endpoint with Upstash caching."""
    try:
        limit = min(request.args.get('limit', 12, type=int), 50)
        
        products = get_minimal_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_flash_sale == True
        ).limit(limit).all()
        
        return {
            'items': [serialize_minimal_product(p) for p in products],
            'count': len(products),
            'ts': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Fast flash sale error: {str(e)}")
        return {'error': 'Failed to fetch'}, 500


@featured_routes.route('/fast/new-arrivals', methods=['GET'])
@fast_cached_response("fast_new_arrivals", ttl=60, key_params=["limit"])
def get_fast_new_arrivals():
    """ULTRA-FAST: Minimal new arrivals endpoint with Upstash caching."""
    try:
        limit = min(request.args.get('limit', 12, type=int), 50)
        
        products = get_minimal_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_new_arrival == True
        ).order_by(Product.created_at.desc()).limit(limit).all()
        
        return {
            'items': [serialize_minimal_product(p) for p in products],
            'count': len(products),
            'ts': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Fast new arrivals error: {str(e)}")
        return {'error': 'Failed to fetch'}, 500


@featured_routes.route('/fast/top-picks', methods=['GET'])
@fast_cached_response("fast_top_picks", ttl=60, key_params=["limit"])
def get_fast_top_picks():
    """ULTRA-FAST: Minimal top picks endpoint with Upstash caching."""
    try:
        limit = min(request.args.get('limit', 12, type=int), 50)
        
        products = get_minimal_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_top_pick == True
        ).limit(limit).all()
        
        if not products:
            products = get_minimal_product_query().filter(
                Product.is_active == True, 
                Product.is_visible == True
            ).order_by(Product.price.desc()).limit(limit).all()
        
        return {
            'items': [serialize_minimal_product(p) for p in products],
            'count': len(products),
            'ts': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Fast top picks error: {str(e)}")
        return {'error': 'Failed to fetch'}, 500


@featured_routes.route('/fast/daily-finds', methods=['GET'])
@fast_cached_response("fast_daily_finds", ttl=60, key_params=["limit"])
def get_fast_daily_finds():
    """ULTRA-FAST: Minimal daily finds endpoint with Upstash caching."""
    try:
        limit = min(request.args.get('limit', 12, type=int), 50)
        
        products = get_minimal_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_daily_find == True
        ).limit(limit).all()
        
        if not products:
            products = get_minimal_product_query().filter(
                Product.is_active == True, 
                Product.is_visible == True,
                Product.is_flash_sale == True
            ).limit(limit).all()
        
        return {
            'items': [serialize_minimal_product(p) for p in products],
            'count': len(products),
            'ts': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Fast daily finds error: {str(e)}")
        return {'error': 'Failed to fetch'}, 500


@featured_routes.route('/fast/luxury-deals', methods=['GET'])
@fast_cached_response("fast_luxury_deals", ttl=60, key_params=["limit"])
def get_fast_luxury_deals():
    """ULTRA-FAST: Minimal luxury deals endpoint with Upstash caching."""
    try:
        limit = min(request.args.get('limit', 12, type=int), 50)
        
        products = get_minimal_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_luxury_deal == True
        ).limit(limit).all()
        
        return {
            'items': [serialize_minimal_product(p) for p in products],
            'count': len(products),
            'ts': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Fast luxury deals error: {str(e)}")
        return {'error': 'Failed to fetch'}, 500


# ==========================================
# ORIGINAL ENDPOINTS (Using Upstash decorators)
# ==========================================

def serialize_simple_product(product):
    """Standard serialization for list views with more fields for backwards compatibility."""
    image_url = None
    if product.thumbnail_url:
        image_url = product.thumbnail_url
    elif hasattr(product, 'image_urls') and product.image_urls:
        if isinstance(product.image_urls, list) and len(product.image_urls) > 0:
            image_url = product.image_urls[0]
        elif isinstance(product.image_urls, str):
            image_url = product.image_urls.split(',')[0]

    return {
        'id': product.id,
        'name': product.name,
        'slug': product.slug,
        'price': float(product.price) if product.price else 0,
        'sale_price': float(product.sale_price) if product.sale_price else None,
        'stock': product.stock,
        'image_url': image_url,
        'thumbnail_url': image_url,
        'is_new': product.is_new,
        'is_sale': product.is_sale,
        'is_featured': product.is_featured,
        'is_flash_sale': product.is_flash_sale,
        'is_luxury_deal': product.is_luxury_deal,
        'is_trending': product.is_trending,
        'is_top_pick': product.is_top_pick,
        'is_daily_find': product.is_daily_find,
        'is_new_arrival': product.is_new_arrival,
        'discount_percentage': product.discount_percentage,
        'rating': 4.5,
        'review_count': 10
    }


def get_optimized_product_query():
    """Return a query with optimized column loading."""
    return Product.query.options(
        load_only(
            Product.id, Product.name, Product.slug, Product.price,
            Product.sale_price, Product.stock, Product.thumbnail_url,
            Product.image_urls, Product.discount_percentage,
            Product.is_new, Product.is_sale, Product.is_featured,
            Product.is_flash_sale, Product.is_luxury_deal, Product.is_trending,
            Product.is_top_pick, Product.is_daily_find, Product.is_new_arrival,
            Product.is_active, Product.is_visible
        )
    )


@featured_routes.route('/trending', methods=['GET'])
@fast_cached_response("trending", ttl=30, key_params=["limit"])
def get_trending():
    """Get trending products with Upstash caching."""
    try:
        limit = request.args.get('limit', 12, type=int)
        
        products = get_optimized_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_trending == True
        ).limit(limit).all()
        
        if not products:
            from sqlalchemy import func
            products = get_optimized_product_query().filter(
                Product.is_active == True, 
                Product.is_visible == True
            ).order_by(func.random()).limit(limit).all()
            
        return {
            'items': [serialize_simple_product(p) for p in products],
            'total': len(products),
            'cached_at': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching trending: {str(e)}")
        return {'error': 'Failed to fetch trending products'}, 500


@featured_routes.route('/top-picks', methods=['GET'])
@fast_cached_response("top_picks", ttl=30, key_params=["limit"])
def get_top_picks():
    """Get top pick products with Upstash caching."""
    try:
        limit = request.args.get('limit', 12, type=int)
        
        products = get_optimized_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_top_pick == True
        ).limit(limit).all()
        
        if not products:
            products = get_optimized_product_query().filter(
                Product.is_active == True, 
                Product.is_visible == True
            ).order_by(Product.price.desc()).limit(limit).all()
            
        return {
            'items': [serialize_simple_product(p) for p in products],
            'total': len(products),
            'cached_at': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching top picks: {str(e)}")
        return {'error': 'Failed to fetch top picks'}, 500


@featured_routes.route('/new-arrivals', methods=['GET'])
@fast_cached_response("new_arrivals", ttl=30, key_params=["limit"])
def get_new_arrivals():
    """Get new arrival products with Upstash caching."""
    try:
        limit = request.args.get('limit', 12, type=int)
        
        products = get_optimized_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_new_arrival == True
        ).order_by(Product.created_at.desc()).limit(limit).all()
            
        return {
            'items': [serialize_simple_product(p) for p in products],
            'total': len(products),
            'cached_at': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching new arrivals: {str(e)}")
        return {'error': 'Failed to fetch new arrivals'}, 500


@featured_routes.route('/daily-finds', methods=['GET'])
@fast_cached_response("daily_finds", ttl=30, key_params=["limit"])
def get_daily_finds():
    """Get daily find products with Upstash caching."""
    try:
        limit = request.args.get('limit', 12, type=int)
        
        products = get_optimized_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_daily_find == True
        ).limit(limit).all()
        
        if not products:
            products = get_optimized_product_query().filter(
                Product.is_active == True, 
                Product.is_visible == True,
                Product.is_flash_sale == True
            ).limit(limit).all()
            
        return {
            'items': [serialize_simple_product(p) for p in products],
            'total': len(products),
            'cached_at': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching daily finds: {str(e)}")
        return {'error': 'Failed to fetch daily finds'}, 500


@featured_routes.route('/flash-sale', methods=['GET'])
@fast_cached_response("flash_sale", ttl=30, key_params=["limit"])
def get_flash_sale():
    """Get flash sale products with Upstash caching."""
    try:
        limit = request.args.get('limit', 12, type=int)
        
        products = get_optimized_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_flash_sale == True
        ).order_by(Product.discount_percentage.desc()).limit(limit).all()
            
        return {
            'items': [serialize_simple_product(p) for p in products],
            'total': len(products),
            'cached_at': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching flash sale: {str(e)}")
        return {'error': 'Failed to fetch flash sale products'}, 500


@featured_routes.route('/luxury-deals', methods=['GET'])
@fast_cached_response("luxury_deals", ttl=30, key_params=["limit"])
def get_luxury_deals():
    """Get luxury deal products with Upstash caching."""
    try:
        limit = request.args.get('limit', 12, type=int)
        
        products = get_optimized_product_query().filter(
            Product.is_active == True, 
            Product.is_visible == True,
            Product.is_luxury_deal == True
        ).order_by(Product.created_at.desc()).limit(limit).all()
            
        return {
            'items': [serialize_simple_product(p) for p in products],
            'total': len(products),
            'cached_at': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching luxury deals: {str(e)}")
        return {'error': 'Failed to fetch luxury deals'}, 500


# ----------------------
# Cache Status Endpoint
# ----------------------

@featured_routes.route('/cache-status', methods=['GET'])
def featured_cache_status():
    """Get cache status for featured routes."""
    return Response(
        fast_json_dumps({
            'connected': product_cache.is_connected,
            'type': 'upstash' if product_cache.is_connected else 'memory',
            'stats': product_cache.stats,
            'timestamp': datetime.utcnow().isoformat()
        }),
        status=200,
        mimetype='application/json'
    )


def init_featured_routes_tables():
    """Initialize any required tables for featured routes."""
    pass
