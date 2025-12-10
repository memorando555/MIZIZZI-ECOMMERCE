"""
User-facing products routes for Mizizzi E-commerce platform.
Handles public product viewing, searching, and browsing functionality.
OPTIMIZED with Upstash Redis caching and lightweight JSON responses.
"""
from flask import Blueprint, request, jsonify, current_app, Response
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from sqlalchemy import or_, func, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import load_only, joinedload
from datetime import datetime
import re
import time

from app.configuration.extensions import db, limiter
from app.models.models import (
    Product, ProductVariant, ProductImage, Category, Brand,
    User, UserRole
)
from app.utils.redis_cache import (
    product_cache,
    cached_response,
    fast_cached_response,
    invalidate_on_change,
    fast_json_dumps
)

# Create blueprint for user-facing product routes
products_routes = Blueprint('products_routes', __name__, url_prefix='/api/products')

# ----------------------
# Lightweight Serializers (Optimized for speed)
# ----------------------

def serialize_product_lightweight(product):
    """
    FAST: Lightweight serialization for list views.
    Returns only essential fields for maximum speed.
    """
    try:
        # Get first image URL efficiently
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
            'discount_percentage': product.discount_percentage,
            'image_url': image_url,
            'thumbnail_url': image_url,
            'stock': product.stock,
            'is_featured': product.is_featured,
            'is_new': product.is_new,
            'is_sale': product.is_sale,
            'is_flash_sale': product.is_flash_sale,
            'is_luxury_deal': product.is_luxury_deal,
            'is_trending': product.is_trending,
            'is_top_pick': product.is_top_pick,
            'is_daily_find': product.is_daily_find,
            'is_new_arrival': product.is_new_arrival,
            'rating': 4.5,  # Default rating, fetch from reviews if needed
            'category_id': product.category_id,
            'brand_id': product.brand_id,
        }
    except Exception as e:
        current_app.logger.error(f"Error in lightweight serialize: {e}")
        return None


def serialize_product(product, include_variants=False, include_images=False):
    """
    Serialize a product to dictionary format.

    Args:
        product: Product instance
        include_variants: Whether to include variants
        include_images: Whether to include images

    Returns:
        Dictionary representation of the product
    """
    try:
        # Get images from the ProductImage table
        product_images = ProductImage.query.filter_by(product_id=product.id).order_by(
            ProductImage.is_primary.desc(),
            ProductImage.sort_order.asc()
        ).all()

        # Extract URLs from ProductImage records
        image_urls_from_db = [img.url for img in product_images if img.url]

        # If we have images in the database, use those instead of product.get_image_urls()
        if image_urls_from_db:
            image_urls = image_urls_from_db
        else:
            image_urls = product.get_image_urls()

        data = {
            'id': product.id,
            'name': product.name,
            'slug': product.slug,
            'description': product.description,
            'price': float(product.price) if product.price else None,
            'sale_price': float(product.sale_price) if product.sale_price else None,
            'stock': product.stock,
            'category_id': product.category_id,
            'brand_id': product.brand_id,
            'image_urls': image_urls,
            'thumbnail_url': image_urls[0] if image_urls else product.thumbnail_url,
            'is_featured': product.is_featured,
            'is_new': product.is_new,
            'is_sale': product.is_sale,
            'is_flash_sale': product.is_flash_sale,
            'is_luxury_deal': product.is_luxury_deal,
            'is_trending': product.is_trending,
            'is_top_pick': product.is_top_pick,
            'is_daily_find': product.is_daily_find,
            'is_new_arrival': product.is_new_arrival,
            'is_active': product.is_active,
            'sku': product.sku,
            'weight': product.weight,
            'dimensions': product.dimensions,
            'meta_title': product.meta_title,
            'meta_description': product.meta_description,
            'short_description': product.short_description,
            'specifications': product.specifications,
            'warranty_info': product.warranty_info,
            'shipping_info': product.shipping_info,
            'availability_status': product.availability_status,
            'min_order_quantity': product.min_order_quantity,
            'max_order_quantity': product.max_order_quantity,
            'related_products': product.get_related_products(),
            'cross_sell_products': product.get_cross_sell_products(),
            'up_sell_products': product.get_up_sell_products(),
            'discount_percentage': product.discount_percentage,
            'tax_rate': product.tax_rate,
            'tax_class': product.tax_class,
            'barcode': product.barcode,
            'manufacturer': product.manufacturer,
            'country_of_origin': product.country_of_origin,
            'is_digital': product.is_digital,
            'download_link': product.download_link,
            'download_expiry_days': product.download_expiry_days,
            'is_taxable': product.is_taxable,
            'is_shippable': product.is_shippable,
            'requires_shipping': product.requires_shipping,
            'is_gift_card': product.is_gift_card,
            'gift_card_value': float(product.gift_card_value) if product.gift_card_value else None,
            'is_customizable': product.is_customizable,
            'customization_options': product.customization_options,
            'seo_keywords': product.get_seo_keywords(),
            'canonical_url': product.canonical_url,
            'condition': product.condition,
            'video_url': product.video_url,
            'is_visible': product.is_visible,
            'is_searchable': product.is_searchable,
            'is_comparable': product.is_comparable,
            'is_preorder': product.is_preorder,
            'preorder_release_date': product.preorder_release_date.isoformat() if product.preorder_release_date else None,
            'preorder_message': product.preorder_message,
            'badge_text': product.badge_text,
            'badge_color': product.badge_color,
            'sort_order': product.sort_order,
            'created_at': product.created_at.isoformat() if product.created_at else None,
            'updated_at': product.updated_at.isoformat() if product.updated_at else None
        }

        # Include category and brand details if available
        if product.category:
            data['category'] = {
                'id': product.category.id,
                'name': product.category.name,
                'slug': product.category.slug
            }

        if product.brand:
            data['brand'] = {
                'id': product.brand.id,
                'name': product.brand.name,
                'slug': product.brand.slug
            }

        # Include variants if requested
        if include_variants and product.variants:
            data['variants'] = [serialize_variant(variant) for variant in product.variants]

        # Include images if requested
        if include_images and product.images:
            data['images'] = [serialize_image(image) for image in product.images]

        return data
    except Exception as e:
        current_app.logger.error(f"Error serializing product {product.id}: {str(e)}")
        return None

def serialize_variant(variant):
    """Serialize a product variant to dictionary format."""
    return {
        'id': variant.id,
        'product_id': variant.product_id,
        'color': variant.color,
        'size': variant.size,
        'price': float(variant.price) if variant.price else None,
        'sale_price': float(variant.sale_price) if variant.sale_price else None,
        'stock': variant.stock,
        'sku': variant.sku,
        'image_url': variant.image_url,
        'created_at': variant.created_at.isoformat() if variant.created_at else None,
        'updated_at': variant.updated_at.isoformat() if variant.updated_at else None
    }

def serialize_image(image):
    """Serialize a product image to dictionary format."""
    return {
        'id': image.id,
        'product_id': image.product_id,
        'filename': image.filename,
        'url': image.url,
        'is_primary': image.is_primary,
        'sort_order': image.sort_order,
        'alt_text': image.alt_text,
        'created_at': image.created_at.isoformat() if image.created_at else None,
        'updated_at': image.updated_at.isoformat() if image.updated_at else None
    }

def is_admin_user():
    """Check if the current user is an admin."""
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()

        if not current_user_id:
            return False

        user = db.session.get(User, current_user_id)
        return user and user.role == UserRole.ADMIN
    except Exception:
        return False

# ----------------------
# Health Check
# ----------------------

@products_routes.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for products service."""
    return jsonify({
        'status': 'ok',
        'service': 'products_routes',
        'cache_connected': product_cache.is_connected,
        'cache_type': 'upstash' if product_cache.is_connected else 'memory',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


# ----------------------
# Cache Management Endpoints
# ----------------------

@products_routes.route('/cache/status', methods=['GET'])
def cache_status():
    """Get cache status and info."""
    return jsonify({
        'connected': product_cache.is_connected,
        'type': 'upstash' if product_cache.is_connected else 'memory',
        'stats': product_cache.stats,
        'timestamp': datetime.utcnow().isoformat()
    }), 200


@products_routes.route('/cache/invalidate', methods=['POST'])
def invalidate_cache():
    """Invalidate all product caches (admin only)."""
    if not is_admin_user():
        return jsonify({'error': 'Admin access required'}), 403

    total_cleared = product_cache.invalidate_all_products()

    return jsonify({
        'success': True,
        'total_cleared': total_cleared,
        'cache_type': 'upstash' if product_cache.is_connected else 'memory'
    }), 200


# ----------------------
# Public Products List (OPTIMIZED with Redis)
# ----------------------

@products_routes.route('/', methods=['GET'])
@limiter.limit("600 per minute")
@cached_response("products", ttl=30, key_params=[
    "page", "per_page", "category_id", "brand_id", "min_price", "max_price",
    "is_featured", "is_new", "is_sale", "is_flash_sale", "is_luxury_deal",
    "is_new_arrival", "search", "sort_by", "sort_order"
])
def get_products():
    """
    Get products with filtering, sorting, and pagination.
    OPTIMIZED: Uses Redis caching and lightweight serialization.
    """
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        category_id = request.args.get('category_id', type=int)
        brand_id = request.args.get('brand_id', type=int)
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        is_featured = request.args.get('is_featured', type=str)
        is_new = request.args.get('is_new', type=str)
        is_sale = request.args.get('is_sale', type=str)
        is_flash_sale = request.args.get('is_flash_sale', type=str)
        is_luxury_deal = request.args.get('is_luxury_deal', type=str)
        is_new_arrival = request.args.get('is_new_arrival', type=str)
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        include_inactive = request.args.get('include_inactive', False, type=bool)

        # Convert string booleans
        def str_to_bool(val):
            if val is None:
                return None
            return val.lower() in ('true', '1', 'yes')

        is_featured = str_to_bool(is_featured)
        is_new = str_to_bool(is_new)
        is_sale = str_to_bool(is_sale)
        is_flash_sale = str_to_bool(is_flash_sale)
        is_luxury_deal = str_to_bool(is_luxury_deal)
        is_new_arrival = str_to_bool(is_new_arrival)

        query = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.stock, Product.thumbnail_url,
                Product.image_urls, Product.discount_percentage,
                Product.is_featured, Product.is_new, Product.is_sale,
                Product.is_flash_sale, Product.is_luxury_deal, Product.is_trending,
                Product.is_top_pick, Product.is_daily_find, Product.is_new_arrival,
                Product.is_active, Product.is_visible, Product.category_id,
                Product.brand_id, Product.created_at, Product.sort_order
            )
        )

        # Filter by active status (unless admin requests inactive products)
        if not (include_inactive and is_admin_user()):
            query = query.filter(Product.is_active == True)

        # Only show visible products for non-admin users
        if not is_admin_user():
            query = query.filter(Product.is_visible == True)

        # Apply filters using indexed columns
        if category_id:
            query = query.filter(Product.category_id == category_id)

        if brand_id:
            query = query.filter(Product.brand_id == brand_id)

        if min_price is not None:
            query = query.filter(Product.price >= min_price)

        if max_price is not None:
            query = query.filter(Product.price <= max_price)

        if is_featured is not None:
            query = query.filter(Product.is_featured == is_featured)

        if is_new is not None:
            query = query.filter(Product.is_new == is_new)

        if is_sale is not None:
            query = query.filter(Product.is_sale == is_sale)

        if is_flash_sale is not None:
            query = query.filter(Product.is_flash_sale == is_flash_sale)

        if is_luxury_deal is not None:
            query = query.filter(Product.is_luxury_deal == is_luxury_deal)

        if is_new_arrival is not None:
            query = query.filter(Product.is_new_arrival == is_new_arrival)

        # Search functionality
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.short_description.ilike(search_term)
                )
            )

        # Sorting (using indexed columns for speed)
        valid_sort_fields = ['name', 'price', 'created_at', 'updated_at', 'stock', 'sort_order']
        if sort_by in valid_sort_fields:
            sort_column = getattr(Product, sort_by)
            if sort_order.lower() == 'desc':
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(Product.created_at.desc())

        # Execute query with pagination
        try:
            pagination = query.paginate(
                page=page,
                per_page=per_page,
                error_out=False
            )
        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error during pagination: {str(e)}")
            return jsonify({'error': 'Database error occurred'}), 500

        products = []
        for product in pagination.items:
            serialized = serialize_product_lightweight(product)
            if serialized:
                products.append(serialized)

        return jsonify({
            'items': products,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total_items': pagination.total,
                'total_pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200

    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error getting products: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        current_app.logger.error(f"Error getting products: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# Flash Sale Products (OPTIMIZED)
# ----------------------

@products_routes.route('/flash-sale', methods=['GET'])
@limiter.limit("600 per minute")
@cached_response("flash_sale", ttl=30, key_params=["limit", "page"])
def get_flash_sale_products():
    """
    Get flash sale products.
    OPTIMIZED: Redis cached, lightweight response.
    """
    try:
        limit = min(request.args.get('limit', 20, type=int), 50)

        # Optimized query with indexed column is_flash_sale
        products = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.thumbnail_url, Product.image_urls,
                Product.discount_percentage, Product.stock,
                Product.is_flash_sale, Product.is_sale
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_flash_sale == True
        ).order_by(
            Product.discount_percentage.desc()
        ).limit(limit).all()

        return jsonify({
            'items': [serialize_product_lightweight(p) for p in products if p],
            'total': len(products),
            'cached_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting flash sale products: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# Luxury Deals Products (OPTIMIZED)
# ----------------------

@products_routes.route('/luxury-deals', methods=['GET'])
@limiter.limit("600 per minute")
@cached_response("luxury_deals", ttl=30, key_params=["limit", "page"])
def get_luxury_deals_products():
    """
    Get luxury deals products.
    OPTIMIZED: Redis cached, lightweight response.
    """
    try:
        limit = min(request.args.get('limit', 20, type=int), 50)

        # Optimized query with indexed column is_luxury_deal
        products = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.thumbnail_url, Product.image_urls,
                Product.discount_percentage, Product.stock,
                Product.is_luxury_deal, Product.created_at
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_luxury_deal == True
        ).order_by(
            Product.created_at.desc()
        ).limit(limit).all()

        return jsonify({
            'items': [serialize_product_lightweight(p) for p in products if p],
            'total': len(products),
            'cached_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting luxury deals products: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# Get Product by ID (with caching for single product)
# ----------------------

@products_routes.route('/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    """Get a product by ID."""
    try:
        # Check cache first
        cache_key = f"mizizzi:product:{product_id}"
        cached = product_cache.get(cache_key)
        if cached:
            current_app.logger.info(f"[CACHE HIT] product:{product_id}")
            return jsonify(cached), 200

        product = db.session.get(Product, product_id)

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        # Check if product is active and visible (unless admin)
        if not is_admin_user():
            if not product.is_active or not product.is_visible:
                return jsonify({'error': 'Product not found'}), 404

        serialized = serialize_product(product, include_variants=True, include_images=True)

        # Cache for 60 seconds (single products can be cached longer)
        product_cache.set(cache_key, serialized, ttl=60)

        return jsonify(serialized), 200

    except Exception as e:
        current_app.logger.error(f"Error getting product {product_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# Get Product by Slug
# ----------------------

@products_routes.route('/slug/<string:slug>', methods=['GET'])
def get_product_by_slug(slug):
    """Get a product by slug."""
    try:
        # Check cache first
        cache_key = f"mizizzi:product:slug:{slug}"
        cached = product_cache.get(cache_key)
        if cached:
            current_app.logger.info(f"[CACHE HIT] product:slug:{slug}")
            return jsonify(cached), 200

        product = Product.query.filter_by(slug=slug).first()

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        # Check if product is active and visible (unless admin)
        if not is_admin_user():
            if not product.is_active or not product.is_visible:
                return jsonify({'error': 'Product not found'}), 404

        serialized = serialize_product(product, include_variants=True, include_images=True)

        # Cache for 60 seconds
        product_cache.set(cache_key, serialized, ttl=60)

        return jsonify(serialized), 200

    except Exception as e:
        current_app.logger.error(f"Error getting product by slug {slug}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# Product Variants (Read-only for users)
# ----------------------

@products_routes.route('/<int:product_id>/variants', methods=['GET'])
def get_product_variants(product_id):
    """Get variants for a product."""
    try:
        product = db.session.get(Product, product_id)

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        # Check if product is accessible to user
        if not is_admin_user():
            if not product.is_active or not product.is_visible:
                return jsonify({'error': 'Product not found'}), 404

        variants = ProductVariant.query.filter_by(product_id=product_id).all()

        return jsonify([serialize_variant(variant) for variant in variants]), 200

    except Exception as e:
        current_app.logger.error(f"Error getting variants for product {product_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# Product Images (Read-only for users)
# ----------------------

@products_routes.route('/<int:product_id>/images', methods=['GET'])
def get_product_images(product_id):
    """Get images for a product."""
    try:
        product = db.session.get(Product, product_id)

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        # Check if product is accessible to user
        if not is_admin_user():
            if not product.is_active or not product.is_visible:
                return jsonify({'error': 'Product not found'}), 404

        images = ProductImage.query.filter_by(product_id=product_id).order_by(
            ProductImage.is_primary.desc(),
            ProductImage.sort_order.asc()
        ).all()

        return jsonify({
            'items': [serialize_image(image) for image in images]
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting images for product {product_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@products_routes.route('/product-images/<int:image_id>', methods=['GET'])
def get_product_image(image_id):
    """Get a specific product image."""
    try:
        image = db.session.get(ProductImage, image_id)

        if not image:
            return jsonify({'error': 'Image not found'}), 404

        # Check if the product is accessible to user
        if not is_admin_user():
            product = db.session.get(Product, image.product_id)
            if not product or not product.is_active or not product.is_visible:
                return jsonify({'error': 'Image not found'}), 404

        return jsonify(serialize_image(image)), 200

    except Exception as e:
        current_app.logger.error(f"Error getting image {image_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# Search and Filter Endpoints (OPTIMIZED)
# ----------------------

@products_routes.route('/search', methods=['GET'])
@cached_response("search", ttl=30, key_params=["q", "page", "per_page"])
def search_products():
    """Advanced product search endpoint with caching."""
    try:
        # Get search parameters
        query_text = request.args.get('q', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)

        if not query_text:
            return jsonify({'error': 'Search query is required'}), 400

        # Build search query with optimized columns
        search_term = f"%{query_text}%"
        query = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.thumbnail_url, Product.image_urls,
                Product.discount_percentage, Product.stock, Product.sku
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_searchable == True,
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.short_description.ilike(search_term),
                Product.sku.ilike(search_term)
            )
        )

        # Execute query with pagination
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        # Serialize products
        products = [serialize_product_lightweight(p) for p in pagination.items if p]

        return jsonify({
            'query': query_text,
            'items': products,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total_items': pagination.total,
                'total_pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error searching products: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@products_routes.route('/featured', methods=['GET'])
@cached_response("featured", ttl=30, key_params=["page", "per_page"])
def get_featured_products():
    """Get featured products with caching."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 12, type=int), 50)

        query = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.thumbnail_url, Product.image_urls,
                Product.discount_percentage, Product.stock, Product.sort_order
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_featured == True
        ).order_by(Product.sort_order.asc(), Product.created_at.desc())

        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        products = [serialize_product_lightweight(p) for p in pagination.items if p]

        return jsonify({
            'items': products,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total_items': pagination.total,
                'total_pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting featured products: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@products_routes.route('/new', methods=['GET'])
@cached_response("new_products", ttl=30, key_params=["page", "per_page"])
def get_new_products():
    """Get new products with caching."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 12, type=int), 50)

        query = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.thumbnail_url, Product.image_urls,
                Product.discount_percentage, Product.stock
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_new == True
        ).order_by(Product.created_at.desc())

        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        products = [serialize_product_lightweight(p) for p in pagination.items if p]

        return jsonify({
            'items': products,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total_items': pagination.total,
                'total_pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting new products: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@products_routes.route('/sale', methods=['GET'])
@cached_response("sale_products", ttl=30, key_params=["page", "per_page"])
def get_sale_products():
    """Get products on sale with caching."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 12, type=int), 50)

        query = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.thumbnail_url, Product.image_urls,
                Product.discount_percentage, Product.stock
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_sale == True
        ).order_by(Product.discount_percentage.desc(), Product.created_at.desc())

        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        products = [serialize_product_lightweight(p) for p in pagination.items if p]

        return jsonify({
            'items': products,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total_items': pagination.total,
                'total_pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting sale products: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# Trending Products (OPTIMIZED)
# ----------------------

@products_routes.route('/trending', methods=['GET'])
@cached_response("trending", ttl=30, key_params=["limit"])
def get_trending_products():
    """Get trending products with caching."""
    try:
        limit = min(request.args.get('limit', 12, type=int), 50)

        products = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.thumbnail_url, Product.image_urls,
                Product.discount_percentage, Product.stock, Product.is_trending
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_trending == True
        ).limit(limit).all()

        # Fallback to random products if no trending
        if not products:
            products = Product.query.options(
                load_only(
                    Product.id, Product.name, Product.slug, Product.price,
                    Product.sale_price, Product.thumbnail_url, Product.image_urls,
                    Product.discount_percentage, Product.stock
                )
            ).filter(
                Product.is_active == True,
                Product.is_visible == True
            ).order_by(func.random()).limit(limit).all()

        return jsonify({
            'items': [serialize_product_lightweight(p) for p in products if p],
            'total': len(products)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting trending products: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# Top Picks Products (OPTIMIZED)
# ----------------------

@products_routes.route('/top-picks', methods=['GET'])
@cached_response("top_picks", ttl=30, key_params=["limit"])
def get_top_picks_products():
    """Get top pick products with caching."""
    try:
        limit = min(request.args.get('limit', 12, type=int), 50)

        products = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.thumbnail_url, Product.image_urls,
                Product.discount_percentage, Product.stock, Product.is_top_pick
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_top_pick == True
        ).limit(limit).all()

        # Fallback to highest priced if no top picks
        if not products:
            products = Product.query.options(
                load_only(
                    Product.id, Product.name, Product.slug, Product.price,
                    Product.sale_price, Product.thumbnail_url, Product.image_urls,
                    Product.discount_percentage, Product.stock
                )
            ).filter(
                Product.is_active == True,
                Product.is_visible == True
            ).order_by(Product.price.desc()).limit(limit).all()

        return jsonify({
            'items': [serialize_product_lightweight(p) for p in products if p],
            'total': len(products)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting top picks: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# Daily Finds Products (OPTIMIZED)
# ----------------------

@products_routes.route('/daily-finds', methods=['GET'])
@cached_response("daily_finds", ttl=30, key_params=["limit"])
def get_daily_finds_products():
    """Get daily find products with caching."""
    try:
        limit = min(request.args.get('limit', 12, type=int), 50)

        products = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.thumbnail_url, Product.image_urls,
                Product.discount_percentage, Product.stock, Product.is_daily_find
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_daily_find == True
        ).limit(limit).all()

        # Fallback to flash sales if no daily finds
        if not products:
            products = Product.query.options(
                load_only(
                    Product.id, Product.name, Product.slug, Product.price,
                    Product.sale_price, Product.thumbnail_url, Product.image_urls,
                    Product.discount_percentage, Product.stock, Product.is_flash_sale
                )
            ).filter(
                Product.is_active == True,
                Product.is_visible == True,
                Product.is_flash_sale == True
            ).limit(limit).all()

        return jsonify({
            'items': [serialize_product_lightweight(p) for p in products if p],
            'total': len(products)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting daily finds: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# New Arrivals Products (OPTIMIZED)
# ----------------------

@products_routes.route('/new-arrivals', methods=['GET'])
@cached_response("new_arrivals", ttl=30, key_params=["limit"])
def get_new_arrivals_products():
    """Get new arrival products with caching."""
    try:
        limit = min(request.args.get('limit', 12, type=int), 50)

        products = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.thumbnail_url, Product.image_urls,
                Product.discount_percentage, Product.stock, Product.is_new_arrival
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_new_arrival == True
        ).order_by(Product.created_at.desc()).limit(limit).all()

        return jsonify({
            'items': [serialize_product_lightweight(p) for p in products if p],
            'total': len(products)
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting new arrivals: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ----------------------
# Recent Searches
# ----------------------

@products_routes.route('/recent-searches', methods=['GET'])
@cached_response("recent_searches", ttl=60, key_params=["limit"])
def get_recent_searches():
    """Get recent search terms with actual products."""
    try:
        limit = min(request.args.get('limit', 8, type=int), 20)

        # Get trending products as suggestions
        trending_products = Product.query.options(
            load_only(
                Product.id, Product.name, Product.thumbnail_url, Product.price, Product.slug
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_searchable == True
        ).filter(
            or_(
                Product.is_featured == True,
                Product.is_new == True,
                Product.is_sale == True
            )
        ).order_by(
            Product.created_at.desc()
        ).limit(limit).all()

        # Get popular categories
        popular_categories = db.session.query(
            Category.name
        ).join(Product).filter(
            Product.is_active == True,
            Product.is_visible == True
        ).group_by(Category.id, Category.name).order_by(
            func.count(Product.id).desc()
        ).limit(5).all()

        recent_searches = []

        for product in trending_products:
            image_url = product.thumbnail_url
            if not image_url and hasattr(product, 'image_urls') and product.image_urls:
                if isinstance(product.image_urls, list):
                    image_url = product.image_urls[0] if product.image_urls else None

            recent_searches.append({
                'id': product.id,
                'name': product.name,
                'type': 'product',
                'image': image_url,
                'price': float(product.price) if product.price else None,
                'slug': f'/product/{product.id}',
                'search_term': product.name
            })

        for category_name, in popular_categories:
            recent_searches.append({
                'name': category_name,
                'type': 'category',
                'search_term': category_name
            })

        recent_searches = recent_searches[:limit]

        return jsonify({
            'items': recent_searches,
            'total': len(recent_searches),
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error getting recent searches: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# ----------------------
# FAST Public Products List (NEW - Ultra-optimized with Upstash)
# ----------------------

@products_routes.route('/fast', methods=['GET'])
@limiter.limit("600 per minute")
def get_products_fast():
    """
    ULTRA-FAST: Get products with minimal overhead.
    Uses pre-serialized JSON caching for maximum speed.
    """
    start = time.perf_counter()

    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        category_id = request.args.get('category_id', type=int)
        brand_id = request.args.get('brand_id', type=int)
        is_featured = request.args.get('is_featured', type=str)
        is_sale = request.args.get('is_sale', type=str)
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')

        # Build cache key
        cache_key = f"mizizzi:products:fast:{page}:{per_page}:{category_id}:{brand_id}:{is_featured}:{is_sale}:{sort_by}:{sort_order}"

        # Try cache first
        cached = product_cache.get_raw(cache_key)
        if cached:
            cache_time = (time.perf_counter() - start) * 1000
            response = Response(cached, status=200, mimetype='application/json')
            response.headers['X-Cache'] = 'HIT'
            response.headers['X-Cache-Time-Ms'] = str(round(cache_time, 2))
            return response

        # Convert string booleans
        def str_to_bool(val):
            if val is None:
                return None
            return val.lower() in ('true', '1', 'yes')

        is_featured = str_to_bool(is_featured)
        is_sale = str_to_bool(is_sale)

        # Optimized query with minimal columns
        query = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.stock, Product.thumbnail_url,
                Product.image_urls, Product.discount_percentage,
                Product.is_featured, Product.is_new, Product.is_sale,
                Product.category_id, Product.brand_id
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True
        )

        # Apply filters
        if category_id:
            query = query.filter(Product.category_id == category_id)
        if brand_id:
            query = query.filter(Product.brand_id == brand_id)
        if is_featured is not None:
            query = query.filter(Product.is_featured == is_featured)
        if is_sale is not None:
            query = query.filter(Product.is_sale == is_sale)

        # Sorting
        valid_sort_fields = ['name', 'price', 'created_at', 'stock']
        if sort_by in valid_sort_fields:
            sort_column = getattr(Product, sort_by)
            query = query.order_by(sort_column.desc() if sort_order == 'desc' else sort_column.asc())
        else:
            query = query.order_by(Product.created_at.desc())

        # Execute with pagination
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        products = []
        for product in pagination.items:
            serialized = serialize_product_lightweight(product)
            if serialized:
                products.append(serialized)

        data = {
            'items': products,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total_items': pagination.total,
                'total_pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            },
            'cached_at': datetime.utcnow().isoformat()
        }

        # Cache the pre-serialized JSON
        json_str = fast_json_dumps(data)
        product_cache.set_raw(cache_key, json_str, ttl=30)

        total_time = (time.perf_counter() - start) * 1000
        response = Response(json_str, status=200, mimetype='application/json')
        response.headers['X-Cache'] = 'MISS'
        response.headers['X-Response-Time-Ms'] = str(round(total_time, 2))
        return response

    except Exception as e:
        current_app.logger.error(f"Error in fast products: {str(e)}")
        return Response(
            fast_json_dumps({'error': 'Internal server error'}),
            status=500,
            mimetype='application/json'
        )


# ----------------------
# OPTIONS handlers for CORS
# ----------------------

@products_routes.route('/', methods=['OPTIONS'])
@products_routes.route('/<int:product_id>', methods=['OPTIONS'])
@products_routes.route('/slug/<string:slug>', methods=['OPTIONS'])
@products_routes.route('/<int:product_id>/variants', methods=['OPTIONS'])
@products_routes.route('/<int:product_id>/images', methods=['OPTIONS'])
@products_routes.route('/product-images/<int:image_id>', methods=['OPTIONS'])
@products_routes.route('/search', methods=['OPTIONS'])
@products_routes.route('/featured', methods=['OPTIONS'])
@products_routes.route('/new', methods=['OPTIONS'])
@products_routes.route('/sale', methods=['OPTIONS'])
@products_routes.route('/flash-sale', methods=['OPTIONS'])
@products_routes.route('/luxury-deals', methods=['OPTIONS'])
@products_routes.route('/trending', methods=['OPTIONS'])
@products_routes.route('/top-picks', methods=['OPTIONS'])
@products_routes.route('/daily-finds', methods=['OPTIONS'])
@products_routes.route('/new-arrivals', methods=['OPTIONS'])
@products_routes.route('/recent-searches', methods=['OPTIONS'])
@products_routes.route('/cache/status', methods=['OPTIONS'])
@products_routes.route('/cache/invalidate', methods=['OPTIONS'])
@products_routes.route('/fast', methods=['OPTIONS'])
def handle_options():
    """Handle OPTIONS requests for CORS."""
    return '', 200
