"""
Flash Sale Routes for Mizizzi E-commerce platform.
Handles flash sale events, products, and real-time stock updates.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import load_only
from datetime import datetime, timedelta
import json

from app.configuration.extensions import db
from app.models.models import Product, User, UserRole
from app.utils.redis_cache import product_cache

flash_sale_bp = Blueprint('flash_sale', __name__, url_prefix='/api/flash-sale')


def is_admin():
    """Check if current user is admin."""
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if not user_id:
            return False
        user = db.session.get(User, user_id)
        return user and user.role == UserRole.ADMIN
    except:
        return False


def serialize_flash_sale_product(product):
    """
    Serialize a flash sale product with stock tracking data.
    Includes flash_sale_stock, flash_sale_sold, and items_left.
    """
    # Get image URL
    image_url = product.thumbnail_url
    if not image_url and hasattr(product, 'image_urls') and product.image_urls:
        if isinstance(product.image_urls, list) and len(product.image_urls) > 0:
            image_url = product.image_urls[0]
        elif isinstance(product.image_urls, str):
            image_url = product.image_urls.split(',')[0] if product.image_urls else None
    
    # Calculate flash sale specific data
    # Use flash_sale_stock if available, otherwise use regular stock
    flash_stock = getattr(product, 'flash_sale_stock', None) or product.stock or 100
    flash_sold = getattr(product, 'flash_sale_sold', None) or 0
    items_left = max(0, flash_stock - flash_sold)
    
    # Calculate progress percentage (how much is left)
    progress_percentage = (items_left / flash_stock * 100) if flash_stock > 0 else 0
    
    return {
        'id': product.id,
        'name': product.name,
        'slug': product.slug,
        'price': float(product.price) if product.price else 0,
        'sale_price': float(product.sale_price) if product.sale_price else None,
        'discount_percentage': product.discount_percentage,
        'image_url': image_url,
        'thumbnail_url': image_url,
        
        # Flash sale specific fields
        'flash_sale_stock': flash_stock,
        'flash_sale_sold': flash_sold,
        'items_left': items_left,
        'progress_percentage': round(progress_percentage, 1),
        'is_almost_gone': items_left <= 5,
        'is_sold_out': items_left == 0,
        
        # Standard fields
        'stock': product.stock,
        'is_flash_sale': product.is_flash_sale,
        'rating': 4.5,
        'review_count': 10
    }


@flash_sale_bp.route('/event', methods=['GET'])
def get_current_event():
    """
    Get the current active flash sale event with countdown data.
    Returns event timing, status, and time remaining.
    """
    try:
        # Return default event (ends at midnight)
        now = datetime.utcnow()
        end_of_day = now.replace(hour=23, minute=59, second=59)
        if end_of_day <= now:
            end_of_day += timedelta(days=1)
        
        return jsonify({
            'id': 1,
            'name': 'Flash Sales | Live Now',
            'description': 'Limited time offers!',
            'start_time': now.replace(hour=0, minute=0, second=0).isoformat(),
            'end_time': end_of_day.isoformat(),
            'is_active': True,
            'is_live': True,
            'time_remaining': int((end_of_day - now).total_seconds()),
            'banner_color': '#8B1538'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting flash sale event: {str(e)}")
        now = datetime.utcnow()
        end_of_day = now.replace(hour=23, minute=59, second=59)
        return jsonify({
            'id': 0,
            'name': 'Flash Sales',
            'is_live': True,
            'time_remaining': int((end_of_day - now).total_seconds()),
            'end_time': end_of_day.isoformat()
        }), 200


@flash_sale_bp.route('/products', methods=['GET'])
def get_flash_sale_products():
    """
    Get flash sale products with real-time stock data.
    Returns products with items_left, progress bar percentage, and timing.
    """
    try:
        limit = min(request.args.get('limit', 12, type=int), 50)
        
        # Query flash sale products
        products = Product.query.options(
            load_only(
                Product.id, Product.name, Product.slug, Product.price,
                Product.sale_price, Product.stock, Product.thumbnail_url,
                Product.image_urls, Product.discount_percentage,
                Product.is_flash_sale, Product.is_active, Product.is_visible
            )
        ).filter(
            Product.is_active == True,
            Product.is_visible == True,
            Product.is_flash_sale == True
        ).limit(limit).all()
        
        # Serialize with flash sale specific data
        serialized = [serialize_flash_sale_product(p) for p in products]
        
        # Get event timing
        now = datetime.utcnow()
        end_of_day = now.replace(hour=23, minute=59, second=59)
        if end_of_day <= now:
            end_of_day += timedelta(days=1)
        
        response_data = {
            'items': serialized,
            'total': len(serialized),
            'event': {
                'end_time': end_of_day.isoformat(),
                'time_remaining': int((end_of_day - now).total_seconds()),
                'is_live': True
            },
            'cached_at': now.isoformat()
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting flash sale products: {str(e)}")
        return jsonify({'error': 'Failed to fetch flash sale products'}), 500


@flash_sale_bp.route('/stock/<int:product_id>', methods=['GET'])
def get_product_stock(product_id):
    """
    Get real-time stock for a flash sale product.
    Used for polling stock updates.
    """
    try:
        product = Product.query.options(
            load_only(Product.id, Product.stock)
        ).filter(
            Product.id == product_id,
            Product.is_flash_sale == True
        ).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        flash_stock = getattr(product, 'flash_sale_stock', None) or product.stock or 100
        flash_sold = getattr(product, 'flash_sale_sold', None) or 0
        items_left = max(0, flash_stock - flash_sold)
        
        return jsonify({
            'product_id': product_id,
            'items_left': items_left,
            'flash_sale_stock': flash_stock,
            'flash_sale_sold': flash_sold,
            'progress_percentage': round((items_left / flash_stock * 100) if flash_stock > 0 else 0, 1),
            'is_sold_out': items_left == 0,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting stock for product {product_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch stock'}), 500
