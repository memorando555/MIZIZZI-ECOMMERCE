"""
Featured product routes for specific sections like Trending, Top Picks, etc.
ULTRA-OPTIMIZED: Lightweight JSON responses with Upstash Redis pre-serialized caching.
"""
from flask import Blueprint, request, current_app, Response
from sqlalchemy.orm import load_only
from datetime import datetime
import time
import json

from app.models.models import Product
from app.configuration.extensions import db
from app.utils.redis_cache import (
    product_cache, 
    fast_cached_response, 
    fast_json_dumps,
    cached_response
)

featured_routes = Blueprint('featured_routes', __name__)

FEATURED_CACHE_CONFIG = {
    'trending': {'ttl': 120, 'key': 'featured:trending'},
    'flash_sale': {'ttl': 60, 'key': 'featured:flash_sale'},
    'new_arrivals': {'ttl': 180, 'key': 'featured:new_arrivals'},
    'top_picks': {'ttl': 120, 'key': 'featured:top_picks'},
    'daily_finds': {'ttl': 300, 'key': 'featured:daily_finds'},
    'luxury_deals': {'ttl': 180, 'key': 'featured:luxury_deals'},
    'all_featured': {'ttl': 300, 'key': 'featured:all'},
}


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


def cache_all_featured_products():
    """
    Pre-cache all featured product sections for optimal performance.
    Returns dict with cache status for each section.
    """
    results = {}
    sections = {
        'trending': {'filter': Product.is_trending == True, 'fallback': None},
        'flash_sale': {'filter': Product.is_flash_sale == True, 'fallback': None},
        'new_arrivals': {'filter': Product.is_new_arrival == True, 'fallback': None},
        'top_picks': {'filter': Product.is_top_pick == True, 'fallback': None},
        'daily_finds': {'filter': Product.is_daily_find == True, 'fallback': Product.is_flash_sale == True},
        'luxury_deals': {'filter': Product.is_luxury_deal == True, 'fallback': None},
    }
    
    for section_name, config in sections.items():
        try:
            start_time = time.time()
            
            # Query products for this section
            products = get_minimal_product_query().filter(
                Product.is_active == True, 
                Product.is_visible == True,
                config['filter']
            ).limit(50).all()
            
            # Try fallback if no products found
            if not products and config['fallback'] is not None:
                products = get_minimal_product_query().filter(
                    Product.is_active == True, 
                    Product.is_visible == True,
                    config['fallback']
                ).limit(50).all()
            
            # Serialize and cache
            serialized = [serialize_minimal_product(p) for p in products]
            cache_data = {
                'items': serialized,
                'count': len(serialized),
                'cached_at': datetime.utcnow().isoformat(),
                'section': section_name
            }
            
            cache_key = FEATURED_CACHE_CONFIG[section_name]['key']
            ttl = FEATURED_CACHE_CONFIG[section_name]['ttl']
            
            # Store in Redis
            if product_cache.is_connected:
                product_cache.set(cache_key, json.dumps(cache_data), ttl=ttl)
            
            elapsed = time.time() - start_time
            results[section_name] = {
                'success': True,
                'count': len(serialized),
                'time_ms': round(elapsed * 1000, 2),
                'cache_key': cache_key
            }
            
        except Exception as e:
            current_app.logger.error(f"Failed to cache {section_name}: {str(e)}")
            results[section_name] = {
                'success': False,
                'error': str(e)
            }
    
    return results


@featured_routes.route('/cache/warm', methods=['POST'])
def warm_featured_cache():
    """Warm all featured product caches."""
    try:
        if not product_cache.is_connected:
            return {'error': 'Redis not connected', 'success': False}, 503
        
        results = cache_all_featured_products()
        
        success_count = sum(1 for r in results.values() if r.get('success'))
        
        return {
            'success': True,
            'message': f'Warmed {success_count}/{len(results)} featured caches',
            'sections': results,
            'timestamp': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Featured cache warming error: {str(e)}")
        return {'error': str(e), 'success': False}, 500


@featured_routes.route('/cache/all', methods=['GET'])
def get_all_featured_cached():
    """Get all featured products from cache."""
    try:
        results = {}
        cache_stats = {
            'hits': 0,
            'misses': 0,
            'total_products': 0
        }
        
        for section_name, config in FEATURED_CACHE_CONFIG.items():
            if section_name == 'all_featured':
                continue
                
            cache_key = config['key']
            
            # Try to get from cache
            if product_cache.is_connected:
                cached = product_cache.get(cache_key)
                if cached:
                    try:
                        data = json.loads(cached)
                        results[section_name] = data
                        cache_stats['hits'] += 1
                        cache_stats['total_products'] += data.get('count', 0)
                        continue
                    except json.JSONDecodeError:
                        pass
            
            cache_stats['misses'] += 1
            results[section_name] = {'items': [], 'count': 0, 'from_cache': False}
        
        return {
            'sections': results,
            'cache_stats': cache_stats,
            'redis_connected': product_cache.is_connected,
            'timestamp': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        current_app.logger.error(f"Get all featured error: {str(e)}")
        return {'error': str(e)}, 500


@featured_routes.route('/cache/status', methods=['GET'])
def get_featured_cache_status():
    """Get detailed cache status for all featured sections."""
    try:
        status = {
            'redis_connected': product_cache.is_connected,
            'cache_type': 'upstash' if product_cache.is_connected else 'memory',
            'sections': {}
        }
        
        for section_name, config in FEATURED_CACHE_CONFIG.items():
            if section_name == 'all_featured':
                continue
                
            cache_key = config['key']
            section_status = {
                'key': cache_key,
                'ttl_config': config['ttl'],
                'cached': False,
                'count': 0,
                'cached_at': None
            }
            
            if product_cache.is_connected:
                cached = product_cache.get(cache_key)
                if cached:
                    try:
                        data = json.loads(cached)
                        section_status['cached'] = True
                        section_status['count'] = data.get('count', 0)
                        section_status['cached_at'] = data.get('cached_at')
                    except json.JSONDecodeError:
                        pass
            
            status['sections'][section_name] = section_status
        
        status['global_stats'] = product_cache.stats
        status['timestamp'] = datetime.utcnow().isoformat()
        
        return status, 200
        
    except Exception as e:
        current_app.logger.error(f"Featured cache status error: {str(e)}")
        return {'error': str(e)}, 500


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
