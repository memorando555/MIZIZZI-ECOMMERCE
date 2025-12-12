"""
Carousel Management Routes
Handles carousel banner CRUD operations and carousel display
OPTIMIZED with Upstash Redis caching for fast frontend responses.
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

carousel_routes = Blueprint('carousel_routes', __name__)

try:
    from ...utils.redis_cache import (
        product_cache,
        cached_response,
        fast_cached_response,
        invalidate_on_change,
        fast_json_dumps
    )
    CACHE_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Redis cache not available: {e}")
    CACHE_AVAILABLE = False

try:
    from ...models.carousel_model import CarouselBanner
    from ...configuration.extensions import db
    logger.info("✅ Imported CarouselBanner from models.carousel_model")
    CAROUSEL_AVAILABLE = True
except ImportError as e:
    logger.error(f"❌ Failed to import CarouselBanner: {str(e)}")
    CAROUSEL_AVAILABLE = False
    db = None
    CarouselBanner = None


def init_carousel_tables():
    """Initialize carousel tables if they don't exist."""
    if db is None:
        logger.warning("Database not available for carousel table initialization")
        return
    
    try:
        db.create_all()
        logger.info("✅ Carousel tables initialized successfully")
    except Exception as e:
        logger.error(f"❌ Error initializing carousel tables: {str(e)}")


# ============================================================================
# PUBLIC ROUTES - Get carousel items for display (OPTIMIZED with Redis)
# ============================================================================

@carousel_routes.route('/items', methods=['GET'])
@cached_response("carousel_items", ttl=60, key_params=["position"]) if CACHE_AVAILABLE else lambda f: f
def get_carousel_items():
    """
    Get active carousel items for a specific position.
    OPTIMIZED: Redis cached for instant frontend loading.
    Query params: position (homepage, category_page, flash_sales, luxury_deals)
    """
    try:
        position = request.args.get('position', 'homepage')
        
        if not CAROUSEL_AVAILABLE or CarouselBanner is None:
            logger.warning(f"Carousel system not available, returning empty items")
            return {
                "success": False,
                "error": "Carousel system not available",
                "items": [],
                "position": position
            }, 503
        
        # Get active carousel items for the position, ordered by sort_order
        items = CarouselBanner.query.filter_by(
            position=position,
            is_active=True
        ).order_by(CarouselBanner.sort_order).all()
        
        logger.info(f"[v0] Retrieved {len(items)} active carousel items for position: {position}")
        
        carousel_data = [{
            "id": item.id,
            "name": item.name,
            "title": item.title,
            "description": item.description,
            "badge_text": item.badge_text,
            "discount": item.discount,
            "button_text": item.button_text,
            "link_url": item.link_url,
            "image_url": item.image_url,
            "sort_order": item.sort_order
        } for item in items]
        
        return {
            "success": True,
            "position": position,
            "items": carousel_data,
            "count": len(carousel_data),
            "cached_at": datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching carousel items: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "items": []
        }, 500


@carousel_routes.route('/item/<int:item_id>', methods=['GET'])
@cached_response("carousel_item", ttl=60, key_params=[]) if CACHE_AVAILABLE else lambda f: f
def get_carousel_item(item_id):
    """Get a specific carousel item by ID. OPTIMIZED: Redis cached."""
    try:
        if not CAROUSEL_AVAILABLE or CarouselBanner is None:
            return {
                "success": False,
                "error": "Carousel system not available"
            }, 503
        
        item = CarouselBanner.query.get(item_id)
        if not item:
            return {
                "success": False,
                "error": "Carousel item not found"
            }, 404
        
        return {
            "success": True,
            "item": item.to_dict()
        }, 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching carousel item: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }, 500


# ============================================================================
# ADMIN ROUTES - Manage carousel items (with cache invalidation)
# ============================================================================

@carousel_routes.route('/admin/all', methods=['GET'])
@jwt_required()
def get_all_carousel_items():
    """Get all carousel items for a specific position (admin)."""
    try:
        position = request.args.get('position', 'homepage')
        
        if not CAROUSEL_AVAILABLE or CarouselBanner is None:
            logger.error("CarouselBanner model is not available")
            return jsonify({
                "success": False,
                "error": "Carousel system not available",
                "banners": []
            }), 503
        
        items = CarouselBanner.query.filter_by(position=position).order_by(
            CarouselBanner.sort_order
        ).all()
        
        logger.info(f"[v0] Admin retrieved {len(items)} carousel items for position: {position}")
        
        banners = [item.to_dict() for item in items]
        
        return jsonify({
            "success": True,
            "position": position,
            "banners": banners,
            "count": len(banners)
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching carousel items: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e),
            "banners": []
        }), 500


@carousel_routes.route('/admin', methods=['POST'])
@jwt_required()
@invalidate_on_change(["carousel_items", "carousel_item"]) if CACHE_AVAILABLE else lambda f: f
def create_carousel_item():
    """Create a new carousel item. Invalidates carousel cache."""
    try:
        if not CAROUSEL_AVAILABLE or CarouselBanner is None:
            return jsonify({
                "success": False,
                "error": "Carousel system not available"
            }), 503
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'title', 'button_text', 'image_url', 'position']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Get the highest sort_order for this position
        max_sort = db.session.query(db.func.max(CarouselBanner.sort_order)).filter_by(
            position=data['position']
        ).scalar() or 0
        
        # Create new carousel item
        new_item = CarouselBanner(
            name=data['name'],
            title=data['title'],
            description=data.get('description', ''),
            badge_text=data.get('badge_text', ''),
            discount=data.get('discount', ''),
            button_text=data['button_text'],
            link_url=data.get('link_url', ''),
            image_url=data['image_url'],
            position=data['position'],
            is_active=data.get('is_active', True),
            sort_order=max_sort + 1
        )
        
        db.session.add(new_item)
        db.session.commit()
        
        logger.info(f"[v0] Created carousel item: {new_item.id}")
        
        return jsonify({
            "success": True,
            "message": "Carousel item created successfully",
            "banner": new_item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error creating carousel item: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@carousel_routes.route('/admin/<int:item_id>', methods=['PUT'])
@jwt_required()
@invalidate_on_change(["carousel_items", "carousel_item"]) if CACHE_AVAILABLE else lambda f: f
def update_carousel_item(item_id):
    """Update a carousel item. Invalidates carousel cache."""
    try:
        if not CAROUSEL_AVAILABLE or CarouselBanner is None:
            return jsonify({
                "success": False,
                "error": "Carousel system not available"
            }), 503
        
        item = CarouselBanner.query.get(item_id)
        if not item:
            return jsonify({
                "success": False,
                "error": "Carousel item not found"
            }), 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            item.name = data['name']
        if 'title' in data:
            item.title = data['title']
        if 'description' in data:
            item.description = data['description']
        if 'badge_text' in data:
            item.badge_text = data['badge_text']
        if 'discount' in data:
            item.discount = data['discount']
        if 'button_text' in data:
            item.button_text = data['button_text']
        if 'link_url' in data:
            item.link_url = data['link_url']
        if 'image_url' in data:
            item.image_url = data['image_url']
        if 'is_active' in data:
            item.is_active = data['is_active']
        if 'sort_order' in data:
            item.sort_order = data['sort_order']
        
        item.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        logger.info(f"[v0] Updated carousel item: {item_id}")
        
        return jsonify({
            "success": True,
            "message": "Carousel item updated successfully",
            "banner": item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error updating carousel item: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@carousel_routes.route('/admin/<int:item_id>', methods=['DELETE'])
@jwt_required()
@invalidate_on_change(["carousel_items", "carousel_item"]) if CACHE_AVAILABLE else lambda f: f
def delete_carousel_item(item_id):
    """Delete a carousel item. Invalidates carousel cache."""
    try:
        if not CAROUSEL_AVAILABLE or CarouselBanner is None:
            return jsonify({
                "success": False,
                "error": "Carousel system not available"
            }), 503
        
        item = CarouselBanner.query.get(item_id)
        if not item:
            return jsonify({
                "success": False,
                "error": "Carousel item not found"
            }), 404
        
        db.session.delete(item)
        db.session.commit()
        
        logger.info(f"[v0] Deleted carousel item: {item_id}")
        
        return jsonify({
            "success": True,
            "message": "Carousel item deleted successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error deleting carousel item: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@carousel_routes.route('/admin/reorder', methods=['POST'])
@jwt_required()
@invalidate_on_change(["carousel_items"]) if CACHE_AVAILABLE else lambda f: f
def reorder_carousel_items():
    """Reorder carousel items. Invalidates carousel cache."""
    try:
        if not CAROUSEL_AVAILABLE or CarouselBanner is None:
            return jsonify({
                "success": False,
                "error": "Carousel system not available"
            }), 503
        
        data = request.get_json()
        items_order = data.get('items', [])
        
        for idx, item_data in enumerate(items_order):
            item = CarouselBanner.query.get(item_data['id'])
            if item:
                item.sort_order = idx + 1
        
        db.session.commit()
        
        logger.info(f"[v0] Reordered carousel items")
        
        return jsonify({
            "success": True,
            "message": "Carousel items reordered successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error reordering carousel items: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@carousel_routes.route('/admin/bulk-update', methods=['POST'])
@jwt_required()
@invalidate_on_change(["carousel_items", "carousel_item"]) if CACHE_AVAILABLE else lambda f: f
def bulk_update_carousel_items():
    """Bulk update carousel items. Invalidates carousel cache."""
    try:
        if not CAROUSEL_AVAILABLE or CarouselBanner is None:
            return jsonify({
                "success": False,
                "error": "Carousel system not available"
            }), 503
        
        data = request.get_json()
        item_ids = data.get('item_ids', [])
        updates = data.get('updates', {})
        
        for item_id in item_ids:
            item = CarouselBanner.query.get(item_id)
            if item:
                for key, value in updates.items():
                    if hasattr(item, key):
                        setattr(item, key, value)
        
        db.session.commit()
        
        logger.info(f"[v0] Bulk updated {len(item_ids)} carousel items")
        
        return jsonify({
            "success": True,
            "message": f"Updated {len(item_ids)} carousel items successfully",
            "updated_count": len(item_ids)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error bulk updating carousel items: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@carousel_routes.route('/admin/stats', methods=['GET'])
@jwt_required()
def get_carousel_stats():
    """Get carousel statistics."""
    try:
        if not CAROUSEL_AVAILABLE or CarouselBanner is None:
            return jsonify({
                "success": False,
                "error": "Carousel system not available",
                "stats": {}
            }), 503
        
        total_items = CarouselBanner.query.count()
        active_items = CarouselBanner.query.filter_by(is_active=True).count()
        
        # Count by position
        positions = {}
        for position in ['homepage', 'category_page', 'flash_sales', 'luxury_deals']:
            positions[position] = CarouselBanner.query.filter_by(position=position).count()
        
        return jsonify({
            "success": True,
            "stats": {
                "total_items": total_items,
                "active_items": active_items,
                "inactive_items": total_items - active_items,
                "by_position": positions
            }
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching carousel stats: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "stats": {}
        }), 500


@carousel_routes.route('/health', methods=['GET'])
def carousel_health():
    """Health check for carousel system."""
    cache_status = {
        "connected": product_cache.is_connected if CACHE_AVAILABLE else False,
        "type": "upstash" if (CACHE_AVAILABLE and product_cache.is_connected) else "none"
    }
    
    return jsonify({
        "status": "ok",
        "service": "carousel",
        "database_available": CAROUSEL_AVAILABLE,
        "cache": cache_status,
        "endpoints": [
            "GET /api/carousel/items",
            "GET /api/carousel/item/<id>",
            "GET /api/carousel/admin/all",
            "POST /api/carousel/admin",
            "PUT /api/carousel/admin/<id>",
            "DELETE /api/carousel/admin/<id>",
            "POST /api/carousel/admin/reorder",
            "POST /api/carousel/admin/bulk-update",
            "GET /api/carousel/admin/stats"
        ]
    }), 200
