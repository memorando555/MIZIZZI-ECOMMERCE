"""
TopBar Management Routes
Handles topbar slide CRUD operations and display
OPTIMIZED with Upstash Redis caching for fast frontend responses.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import logging
from ...utils.auth_utils import admin_required

logger = logging.getLogger(__name__)

topbar_routes = Blueprint('topbar_routes', __name__)

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
    from ...models.topbar_model import TopBarSlide
    from ...configuration.extensions import db
    logger.info("✅ Imported TopBarSlide from models.topbar_model")
    TOPBAR_AVAILABLE = True
except ImportError as e:
    logger.error(f"❌ Failed to import TopBarSlide: {str(e)}")
    TOPBAR_AVAILABLE = False
    db = None
    TopBarSlide = None


def init_topbar_tables():
    """Initialize topbar tables if they don't exist."""
    if db is None:
        logger.warning("Database not available for topbar table initialization")
        return
    
    try:
        db.create_all()
        logger.info("✅ TopBar tables initialized successfully")
    except Exception as e:
        logger.error(f"❌ Error initializing topbar tables: {str(e)}")


# ============================================================================
# PUBLIC ROUTES - Get topbar slides for display (OPTIMIZED with Redis)
# ============================================================================

@topbar_routes.route('/slides', methods=['GET'])
@cached_response("topbar_slides", ttl=120, key_params=[]) if CACHE_AVAILABLE else lambda f: f
def get_topbar_slides():
    """
    Get active topbar slides for display.
    OPTIMIZED: Redis cached with 2 minute TTL for instant loading.
    """
    try:
        if not TOPBAR_AVAILABLE or TopBarSlide is None:
            logger.warning(f"TopBar system not available, returning empty slides")
            return {
                "success": False,
                "error": "TopBar system not available",
                "slides": []
            }, 503
        
        # Get active slides, ordered by sort_order
        slides = TopBarSlide.query.filter_by(is_active=True).order_by(
            TopBarSlide.sort_order
        ).all()
        
        logger.info(f"[v0] Retrieved {len(slides)} active topbar slides")
        
        slides_data = [slide.to_dict() for slide in slides]
        
        return {
            "success": True,
            "slides": slides_data,
            "count": len(slides_data),
            "cached_at": datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching topbar slides: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "slides": []
        }, 500


@topbar_routes.route('/slide/<int:slide_id>', methods=['GET'])
@cached_response("topbar_slide", ttl=120, key_params=[]) if CACHE_AVAILABLE else lambda f: f
def get_topbar_slide(slide_id):
    """Get a specific topbar slide by ID. OPTIMIZED: Redis cached."""
    try:
        if not TOPBAR_AVAILABLE or TopBarSlide is None:
            return {
                "success": False,
                "error": "TopBar system not available"
            }, 503
        
        slide = TopBarSlide.query.get(slide_id)
        if not slide:
            return {
                "success": False,
                "error": "Slide not found"
            }, 404
        
        return {
            "success": True,
            "slide": slide.to_dict()
        }, 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching topbar slide: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }, 500


# ============================================================================
# ADMIN ROUTES - Manage topbar slides (with cache invalidation)
# ============================================================================

@topbar_routes.route('/admin/all', methods=['GET'])
@jwt_required()
@admin_required
def get_all_topbar_slides():
    """Get all topbar slides for admin."""
    try:
        if not TOPBAR_AVAILABLE or TopBarSlide is None:
            logger.error("TopBarSlide model is not available")
            return jsonify({
                "success": False,
                "error": "TopBar system not available",
                "slides": []
            }), 503
        
        slides = TopBarSlide.query.order_by(TopBarSlide.sort_order).all()
        
        logger.info(f"[v0] Admin retrieved {len(slides)} topbar slides")
        
        slides_data = [slide.to_dict() for slide in slides]
        
        return jsonify({
            "success": True,
            "slides": slides_data,
            "count": len(slides_data)
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching topbar slides: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e),
            "slides": []
        }), 500


@topbar_routes.route('/admin', methods=['POST'])
@jwt_required()
@admin_required
@invalidate_on_change(["topbar_slides", "topbar_slide"]) if CACHE_AVAILABLE else lambda f: f
def create_topbar_slide():
    """Create a new topbar slide. Invalidates topbar cache."""
    try:
        if not TOPBAR_AVAILABLE or TopBarSlide is None:
            return jsonify({
                "success": False,
                "error": "TopBar system not available"
            }), 503
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['campaign', 'productImageUrl']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Get the highest sort_order
        max_sort = db.session.query(db.func.max(TopBarSlide.sort_order)).scalar() or 0
        
        # Create new slide
        new_slide = TopBarSlide(
            campaign=data['campaign'],
            subtext=data.get('subtext', ''),
            bg_color=data.get('bgColor', '#000000'),
            product_image_url=data['productImageUrl'],
            product_alt=data.get('productAlt', 'Product'),
            center_content_type=data.get('centerContentType', 'text'),
            center_content_data=data.get('centerContentData', {}),
            button_text=data.get('buttonText', 'Shop Now'),
            button_link=data.get('buttonLink', '/products'),
            is_active=data.get('isActive', True),
            sort_order=max_sort + 1
        )
        
        db.session.add(new_slide)
        db.session.commit()
        
        logger.info(f"[v0] Created topbar slide: {new_slide.id}")
        
        return jsonify({
            "success": True,
            "message": "TopBar slide created successfully",
            "slide": new_slide.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error creating topbar slide: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@topbar_routes.route('/admin/<int:slide_id>', methods=['PUT'])
@jwt_required()
@admin_required
@invalidate_on_change(["topbar_slides", "topbar_slide"]) if CACHE_AVAILABLE else lambda f: f
def update_topbar_slide(slide_id):
    """Update a topbar slide. Invalidates topbar cache."""
    try:
        if not TOPBAR_AVAILABLE or TopBarSlide is None:
            return jsonify({
                "success": False,
                "error": "TopBar system not available"
            }), 503
        
        slide = TopBarSlide.query.get(slide_id)
        if not slide:
            return jsonify({
                "success": False,
                "error": "Slide not found"
            }), 404
        
        data = request.get_json()
        
        # Update fields
        if 'campaign' in data:
            slide.campaign = data['campaign']
        if 'subtext' in data:
            slide.subtext = data['subtext']
        if 'bgColor' in data:
            slide.bg_color = data['bgColor']
        if 'productImageUrl' in data:
            slide.product_image_url = data['productImageUrl']
        if 'productAlt' in data:
            slide.product_alt = data['productAlt']
        if 'centerContentType' in data:
            slide.center_content_type = data['centerContentType']
        if 'centerContentData' in data:
            slide.center_content_data = data['centerContentData']
        if 'buttonText' in data:
            slide.button_text = data['buttonText']
        if 'buttonLink' in data:
            slide.button_link = data['buttonLink']
        if 'isActive' in data:
            slide.is_active = data['isActive']
        if 'sortOrder' in data:
            slide.sort_order = data['sortOrder']
        
        slide.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        logger.info(f"[v0] Updated topbar slide: {slide_id}")
        
        return jsonify({
            "success": True,
            "message": "TopBar slide updated successfully",
            "slide": slide.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error updating topbar slide: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@topbar_routes.route('/admin/<int:slide_id>', methods=['DELETE'])
@jwt_required()
@admin_required
@invalidate_on_change(["topbar_slides", "topbar_slide"]) if CACHE_AVAILABLE else lambda f: f
def delete_topbar_slide(slide_id):
    """Delete a topbar slide. Invalidates topbar cache."""
    try:
        if not TOPBAR_AVAILABLE or TopBarSlide is None:
            return jsonify({
                "success": False,
                "error": "TopBar system not available"
            }), 503
        
        slide = TopBarSlide.query.get(slide_id)
        if not slide:
            return jsonify({
                "success": False,
                "error": "Slide not found"
            }), 404
        
        db.session.delete(slide)
        db.session.commit()
        
        logger.info(f"[v0] Deleted topbar slide: {slide_id}")
        
        return jsonify({
            "success": True,
            "message": "TopBar slide deleted successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error deleting topbar slide: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@topbar_routes.route('/admin/reorder', methods=['POST'])
@jwt_required()
@admin_required
@invalidate_on_change(["topbar_slides"]) if CACHE_AVAILABLE else lambda f: f
def reorder_topbar_slides():
    """Reorder topbar slides. Invalidates topbar cache."""
    try:
        if not TOPBAR_AVAILABLE or TopBarSlide is None:
            return jsonify({
                "success": False,
                "error": "TopBar system not available"
            }), 503
        
        data = request.get_json()
        slides_order = data.get('slides', [])
        
        for idx, slide_data in enumerate(slides_order):
            slide = TopBarSlide.query.get(slide_data['id'])
            if slide:
                slide.sort_order = idx + 1
        
        db.session.commit()
        
        logger.info(f"[v0] Reordered topbar slides")
        
        return jsonify({
            "success": True,
            "message": "TopBar slides reordered successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error reordering topbar slides: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@topbar_routes.route('/admin/bulk-update', methods=['POST'])
@jwt_required()
@admin_required
@invalidate_on_change(["topbar_slides", "topbar_slide"]) if CACHE_AVAILABLE else lambda f: f
def bulk_update_topbar_slides():
    """Bulk update topbar slides. Invalidates topbar cache."""
    try:
        if not TOPBAR_AVAILABLE or TopBarSlide is None:
            return jsonify({
                "success": False,
                "error": "TopBar system not available"
            }), 503
        
        data = request.get_json()
        slide_ids = data.get('slide_ids', [])
        updates = data.get('updates', {})
        
        for slide_id in slide_ids:
            slide = TopBarSlide.query.get(slide_id)
            if slide:
                for key, value in updates.items():
                    # Convert camelCase to snake_case for database fields
                    db_key = key
                    if key == 'isActive':
                        db_key = 'is_active'
                    elif key == 'sortOrder':
                        db_key = 'sort_order'
                    elif key == 'bgColor':
                        db_key = 'bg_color'
                    elif key == 'productImageUrl':
                        db_key = 'product_image_url'
                    elif key == 'productAlt':
                        db_key = 'product_alt'
                    elif key == 'centerContentType':
                        db_key = 'center_content_type'
                    elif key == 'centerContentData':
                        db_key = 'center_content_data'
                    elif key == 'buttonText':
                        db_key = 'button_text'
                    elif key == 'buttonLink':
                        db_key = 'button_link'
                    
                    if hasattr(slide, db_key):
                        setattr(slide, db_key, value)
        
        db.session.commit()
        
        logger.info(f"[v0] Bulk updated {len(slide_ids)} topbar slides")
        
        return jsonify({
            "success": True,
            "message": f"Updated {len(slide_ids)} topbar slides successfully",
            "updated_count": len(slide_ids)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error bulk updating topbar slides: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@topbar_routes.route('/admin/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_topbar_stats():
    """Get topbar statistics."""
    try:
        if not TOPBAR_AVAILABLE or TopBarSlide is None:
            return jsonify({
                "success": False,
                "error": "TopBar system not available",
                "stats": {}
            }), 503
        
        total_slides = TopBarSlide.query.count()
        active_slides = TopBarSlide.query.filter_by(is_active=True).count()
        
        return jsonify({
            "success": True,
            "stats": {
                "total_slides": total_slides,
                "active_slides": active_slides,
                "inactive_slides": total_slides - active_slides
            }
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching topbar stats: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "stats": {}
        }), 500


@topbar_routes.route('/health', methods=['GET'])
def topbar_health():
    """Health check for topbar system."""
    cache_status = {
        "connected": product_cache.is_connected if CACHE_AVAILABLE else False,
        "type": "upstash" if (CACHE_AVAILABLE and product_cache.is_connected) else "none"
    }
    
    return jsonify({
        "status": "ok",
        "service": "topbar",
        "database_available": TOPBAR_AVAILABLE,
        "cache": cache_status,
        "endpoints": [
            "GET /api/topbar/slides",
            "GET /api/topbar/slide/<id>",
            "GET /api/topbar/admin/all",
            "POST /api/topbar/admin",
            "PUT /api/topbar/admin/<id>",
            "DELETE /api/topbar/admin/<id>",
            "POST /api/topbar/admin/reorder",
            "POST /api/topbar/admin/bulk-update",
            "GET /api/topbar/admin/stats"
        ]
    }), 200
