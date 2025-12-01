"""
Contact CTA Routes
Handles contact CTA slides CRUD operations
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

contact_cta_routes = Blueprint('contact_cta_routes', __name__)

db = None
ContactCTA = None
CONTACT_CTA_AVAILABLE = False

def _init_db():
    """Lazy initialize database connection."""
    global db, ContactCTA, CONTACT_CTA_AVAILABLE
    if db is not None:
        return CONTACT_CTA_AVAILABLE
    
    try:
        from app.configuration.extensions import db as _db
        from app.models.contact_cta_model import ContactCTA as _ContactCTA
        db = _db
        ContactCTA = _ContactCTA
        CONTACT_CTA_AVAILABLE = True
    except ImportError as e:
        logger.error(f"❌ Failed to import ContactCTA: {str(e)}")
        CONTACT_CTA_AVAILABLE = False
    
    return CONTACT_CTA_AVAILABLE

def init_contact_cta_tables(app=None):
    """Initialize contact CTA tables if they don't exist."""
    if not _init_db():
        logger.warning("Database not available for contact CTA table initialization")
        return
    
    _app = app or current_app._get_current_object()
    
    try:
        with _app.app_context():
            db.create_all()
            
            # Seed default data if empty
            if ContactCTA and ContactCTA.query.count() == 0:
                default_slides = [
                    {
                        "subtitle": "Hii ni yako",
                        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
                        "gradient": "from-slate-900 via-slate-800 to-black",
                        "accent_color": "text-white",
                        "sort_order": 1
                    },
                    {
                        "subtitle": "Unbeatable Quality",
                        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
                        "gradient": "from-slate-900 via-neutral-800 to-black",
                        "accent_color": "text-white",
                        "sort_order": 2
                    },
                    {
                        "subtitle": "Exclusive Deals",
                        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",
                        "gradient": "from-zinc-900 via-zinc-800 to-black",
                        "accent_color": "text-blue-400",
                        "sort_order": 3
                    },
                ]
                
                for slide_data in default_slides:
                    slide = ContactCTA(**slide_data)
                    db.session.add(slide)
                
                db.session.commit()
                logger.info("✅ Seeded default contact CTA slides")
                
            logger.info("✅ Contact CTA tables initialized successfully")
    except Exception as e:
        logger.error(f"❌ Error initializing contact CTA tables: {str(e)}")
        logger.warning("Contact CTA tables initialization failed, but continuing app startup")

# ============================================================================
# PUBLIC ROUTES
# ============================================================================

@contact_cta_routes.route('/slides', methods=['GET'])
def get_slides():
    """Get active contact CTA slides."""
    _init_db()
    try:
        if not CONTACT_CTA_AVAILABLE or ContactCTA is None:
            return jsonify({
                "success": False,
                "error": "Contact CTA system not available",
                "slides": []
            }), 503
        
        slides = ContactCTA.query.filter_by(is_active=True).order_by(ContactCTA.sort_order).all()
        
        return jsonify({
            "success": True,
            "slides": [slide.to_dict() for slide in slides]
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching contact CTA slides: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "slides": []
        }), 500

# ============================================================================
# ADMIN ROUTES
# ============================================================================

@contact_cta_routes.route('/admin/all', methods=['GET'])
@jwt_required()
def get_all_slides():
    """Get all contact CTA slides (admin)."""
    _init_db()
    try:
        if not CONTACT_CTA_AVAILABLE or ContactCTA is None:
            return jsonify({
                "success": False,
                "error": "Contact CTA system not available",
                "slides": []
            }), 503
        
        slides = ContactCTA.query.order_by(ContactCTA.sort_order).all()
        
        return jsonify({
            "success": True,
            "slides": [slide.to_dict() for slide in slides]
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching all contact CTA slides: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "slides": []
        }), 500

@contact_cta_routes.route('/admin', methods=['POST'])
@jwt_required()
def create_slide():
    """Create a new contact CTA slide."""
    _init_db()
    try:
        if not CONTACT_CTA_AVAILABLE or ContactCTA is None:
            return jsonify({
                "success": False,
                "error": "Contact CTA system not available"
            }), 503
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['subtitle', 'image']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Get max sort order
        max_sort = db.session.query(db.func.max(ContactCTA.sort_order)).scalar() or 0
        
        new_slide = ContactCTA(
            subtitle=data['subtitle'],
            image=data['image'],
            gradient=data.get('gradient', 'from-slate-900 via-slate-800 to-black'),
            accent_color=data.get('accent_color', 'text-white'),
            is_active=data.get('is_active', True),
            sort_order=max_sort + 1
        )
        
        db.session.add(new_slide)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Slide created successfully",
            "slide": new_slide.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error creating contact CTA slide: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@contact_cta_routes.route('/admin/<int:slide_id>', methods=['PUT'])
@jwt_required()
def update_slide(slide_id):
    """Update a contact CTA slide."""
    _init_db()
    try:
        if not CONTACT_CTA_AVAILABLE or ContactCTA is None:
            return jsonify({
                "success": False,
                "error": "Contact CTA system not available"
            }), 503
        
        slide = ContactCTA.query.get(slide_id)
        if not slide:
            return jsonify({
                "success": False,
                "error": "Slide not found"
            }), 404
        
        data = request.get_json()
        
        if 'subtitle' in data:
            slide.subtitle = data['subtitle']
        if 'image' in data:
            slide.image = data['image']
        if 'gradient' in data:
            slide.gradient = data['gradient']
        if 'accent_color' in data:
            slide.accent_color = data['accent_color']
        if 'is_active' in data:
            slide.is_active = data['is_active']
        if 'sort_order' in data:
            slide.sort_order = data['sort_order']
            
        slide.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Slide updated successfully",
            "slide": slide.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error updating contact CTA slide: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@contact_cta_routes.route('/admin/<int:slide_id>', methods=['DELETE'])
@jwt_required()
def delete_slide(slide_id):
    """Delete a contact CTA slide."""
    _init_db()
    try:
        if not CONTACT_CTA_AVAILABLE or ContactCTA is None:
            return jsonify({
                "success": False,
                "error": "Contact CTA system not available"
            }), 503
        
        slide = ContactCTA.query.get(slide_id)
        if not slide:
            return jsonify({
                "success": False,
                "error": "Slide not found"
            }), 404
        
        db.session.delete(slide)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Slide deleted successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error deleting contact CTA slide: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@contact_cta_routes.route('/health', methods=['GET'])
def health_check():
    """Health check for contact CTA system."""
    _init_db()
    return jsonify({
        "status": "ok",
        "service": "contact_cta",
        "database_available": CONTACT_CTA_AVAILABLE
    }), 200
