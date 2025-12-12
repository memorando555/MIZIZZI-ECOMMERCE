"""
Featured Products Routes
Handles featured, new arrivals, sale items, and special product collections
OPTIMIZED with Upstash Redis caching for fast frontend responses.
"""
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import or_, func, desc
from datetime import datetime
import logging

from app.configuration.extensions import db, limiter
from app.models.models import Product, ProductVariant, ProductImage, Category, Brand

logger = logging.getLogger(__name__)

featured_products_routes = Blueprint('featured_products', __name__)

# Add proper fallback decorators when cache isn't available
try:
    from app.utils.redis_cache import (
        product_cache,
        cached_response,
        fast_cached_response,
        invalidate_on_change,
        fast_json_dumps
    )
    CACHE_AVAILABLE = True
    logger.info("✅ Redis cache available for featured products routes")
except ImportError as e:
    logger.warning(f"Redis cache not available: {e}")
    CACHE_AVAILABLE = False
    product_cache = None
    
    # Fallback no-op decorators
    def cached_response(prefix, ttl=30, key_params=None):
        def decorator(func):
            return func
        return decorator
    
    def fast_cached_response(prefix, ttl=30, key_params=None):
        def decorator(func):
            return func
        return decorator
    
    def invalidate_on_change(prefixes):
        def decorator(func):
            return func
        return decorator
    
    def fast_json_dumps(data):
        import json
        return json.dumps(data)


def serialize_product_lightweight(product):
    """Lightweight product serialization for faster responses."""
    try:
        # Get primary image
        primary_image = None
        if product.images:
            for img in product.images:
                if img.is_primary:
                    primary_image = img.image_url
                    break
            if not primary_image and product.images:
                primary_image = product.images[0].image_url
        
        # Get price info from variants
        base_price = float(product.base_price) if product.base_price else 0
        sale_price = None
        if product.variants:
            for variant in product.variants:
                if variant.sale_price and variant.sale_price < base_price:
                    sale_price = float(variant.sale_price)
                    break
        
        return {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "base_price": base_price,
            "sale_price": sale_price,
            "primary_image": primary_image,
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else None,
            "brand_id": product.brand_id,
            "brand_name": product.brand.name if product.brand else None,
            "is_featured": product.is_featured,
            "is_new": product.is_new,
            "is_sale": product.is_sale,
            "is_flash_sale": product.is_flash_sale,
            "is_luxury_deal": product.is_luxury_deal,
            "is_new_arrival": product.is_new_arrival,
            "stock_quantity": sum(v.stock_quantity or 0 for v in product.variants) if product.variants else 0,
            "average_rating": float(product.average_rating) if product.average_rating else 0,
            "review_count": product.review_count or 0
        }
    except Exception as e:
        logger.error(f"Error serializing product {product.id}: {e}")
        return None


@featured_products_routes.route('/', methods=['GET'])
@limiter.limit("300 per minute")
@cached_response("featured_products", ttl=60, key_params=["limit"])
def get_featured_products():
    """
    Get featured products for homepage display.
    OPTIMIZED: Redis cached with 60 second TTL.
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)  # Max 50 products
        
        products = Product.query.filter_by(
            is_featured=True,
            is_active=True
        ).order_by(desc(Product.created_at)).limit(limit).all()
        
        serialized = [serialize_product_lightweight(p) for p in products if p]
        serialized = [p for p in serialized if p]  # Filter out None values
        
        return {
            "success": True,
            "products": serialized,
            "count": len(serialized),
            "cached": CACHE_AVAILABLE
        }, 200
        
    except Exception as e:
        logger.error(f"Error fetching featured products: {e}")
        return {
            "success": False,
            "error": str(e),
            "products": []
        }, 500


@featured_products_routes.route('/new-arrivals', methods=['GET'])
@limiter.limit("300 per minute")
@cached_response("new_arrivals", ttl=60, key_params=["limit"])
def get_new_arrivals():
    """Get new arrival products. OPTIMIZED: Redis cached."""
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)
        
        products = Product.query.filter(
            or_(Product.is_new_arrival == True, Product.is_new == True),
            Product.is_active == True
        ).order_by(desc(Product.created_at)).limit(limit).all()
        
        serialized = [serialize_product_lightweight(p) for p in products if p]
        serialized = [p for p in serialized if p]
        
        return {
            "success": True,
            "products": serialized,
            "count": len(serialized),
            "cached": CACHE_AVAILABLE
        }, 200
        
    except Exception as e:
        logger.error(f"Error fetching new arrivals: {e}")
        return {
            "success": False,
            "error": str(e),
            "products": []
        }, 500


@featured_products_routes.route('/sale', methods=['GET'])
@limiter.limit("300 per minute")
@cached_response("sale_products", ttl=60, key_params=["limit"])
def get_sale_products():
    """Get products on sale. OPTIMIZED: Redis cached."""
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)
        
        products = Product.query.filter_by(
            is_sale=True,
            is_active=True
        ).order_by(desc(Product.created_at)).limit(limit).all()
        
        serialized = [serialize_product_lightweight(p) for p in products if p]
        serialized = [p for p in serialized if p]
        
        return {
            "success": True,
            "products": serialized,
            "count": len(serialized),
            "cached": CACHE_AVAILABLE
        }, 200
        
    except Exception as e:
        logger.error(f"Error fetching sale products: {e}")
        return {
            "success": False,
            "error": str(e),
            "products": []
        }, 500


@featured_products_routes.route('/flash-sales', methods=['GET'])
@limiter.limit("300 per minute")
@cached_response("flash_sale_products", ttl=30, key_params=["limit"])
def get_flash_sale_products():
    """Get flash sale products. OPTIMIZED: Redis cached with shorter TTL."""
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)
        
        products = Product.query.filter_by(
            is_flash_sale=True,
            is_active=True
        ).order_by(desc(Product.created_at)).limit(limit).all()
        
        serialized = [serialize_product_lightweight(p) for p in products if p]
        serialized = [p for p in serialized if p]
        
        return {
            "success": True,
            "products": serialized,
            "count": len(serialized),
            "cached": CACHE_AVAILABLE
        }, 200
        
    except Exception as e:
        logger.error(f"Error fetching flash sale products: {e}")
        return {
            "success": False,
            "error": str(e),
            "products": []
        }, 500


@featured_products_routes.route('/luxury-deals', methods=['GET'])
@limiter.limit("300 per minute")
@cached_response("luxury_deal_products", ttl=60, key_params=["limit"])
def get_luxury_deals():
    """Get luxury deal products. OPTIMIZED: Redis cached."""
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)
        
        products = Product.query.filter_by(
            is_luxury_deal=True,
            is_active=True
        ).order_by(desc(Product.created_at)).limit(limit).all()
        
        serialized = [serialize_product_lightweight(p) for p in products if p]
        serialized = [p for p in serialized if p]
        
        return {
            "success": True,
            "products": serialized,
            "count": len(serialized),
            "cached": CACHE_AVAILABLE
        }, 200
        
    except Exception as e:
        logger.error(f"Error fetching luxury deals: {e}")
        return {
            "success": False,
            "error": str(e),
            "products": []
        }, 500


@featured_products_routes.route('/cache/status', methods=['GET'])
def featured_cache_status():
    """Get cache status for featured products routes."""
    cache_info = {
        "connected": False,
        "type": "none",
        "stats": {}
    }
    
    if CACHE_AVAILABLE and product_cache:
        cache_info = {
            "connected": product_cache.is_connected,
            "type": "upstash" if product_cache.is_connected else "memory",
            "stats": product_cache.stats
        }
    
    return {
        "service": "featured_products",
        "cache": cache_info,
        "timestamp": datetime.utcnow().isoformat()
    }, 200
