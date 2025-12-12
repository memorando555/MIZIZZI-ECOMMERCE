"""
Footer Management Routes
Handles footer content, styling, and configuration
OPTIMIZED with Upstash Redis caching for fast frontend responses.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.configuration.extensions import db
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger(__name__)

footer_routes = Blueprint('footer_routes', __name__)

try:
    from app.utils.redis_cache import (
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

# Import FooterSettings model
try:
    from app.models.footer_settings import FooterSettings
    FOOTER_AVAILABLE = True
except ImportError as e:
    logger.warning(f"FooterSettings not available: {e}")
    FOOTER_AVAILABLE = False
    FooterSettings = None

# ============================================================================
# PUBLIC ROUTES - Get footer settings (OPTIMIZED with Redis)
# ============================================================================

@footer_routes.route('/settings', methods=['GET'])
@cached_response("footer_settings", ttl=300, key_params=[]) if CACHE_AVAILABLE else lambda f: f
def get_footer_settings_public():
    """
    Get current footer settings - Public endpoint
    OPTIMIZED: Redis cached with 5 minute TTL for instant loading.
    """
    try:
        logger.info('[Footer] GET /api/footer/settings - Fetching settings')
        
        if not FOOTER_AVAILABLE or FooterSettings is None:
            return {
                'success': False,
                'message': 'Footer system not available'
            }, 503
        
        settings = FooterSettings.get_or_create_default()
        data = settings.to_dict()
        
        return {
            'success': True,
            'data': data,
            'cached_at': datetime.utcnow().isoformat()
        }, 200
    except Exception as e:
        logger.error(f'[Footer] Error fetching settings: {str(e)}')
        return {
            'success': False,
            'message': f'Error fetching footer settings: {str(e)}'
        }, 500

# ============================================================================
# ADMIN ROUTES - Manage footer settings (require JWT authentication)
# ============================================================================

@footer_routes.route('/admin/settings', methods=['GET'])
@jwt_required()
def get_footer_settings_admin():
    """Get current footer settings - Admin endpoint with auth"""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f'[Footer] Admin GET - User: {current_user_id}')
        
        if not FOOTER_AVAILABLE or FooterSettings is None:
            return jsonify({
                'success': False,
                'message': 'Footer system not available'
            }), 503
        
        settings = FooterSettings.get_or_create_default()
        data = settings.to_dict()
        
        return jsonify({
            'success': True,
            'data': data
        }), 200
    except Exception as e:
        logger.error(f'[Footer] Admin GET error: {str(e)}')
        return jsonify({
            'success': False,
            'message': f'Error fetching footer settings: {str(e)}'
        }), 500

@footer_routes.route('/admin/settings', methods=['PUT'])
@jwt_required()
@invalidate_on_change(["footer_settings"]) if CACHE_AVAILABLE else lambda f: f
def update_footer_settings():
    """Update footer settings - Admin only. Invalidates footer cache."""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f'[Footer] Admin PUT - User: {current_user_id}')
        
        if not FOOTER_AVAILABLE or FooterSettings is None:
            return jsonify({
                'success': False,
                'message': 'Footer system not available'
            }), 503
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        settings = FooterSettings.get_or_create_default()
        
        # Update colors
        if 'colors' in data:
            colors = data['colors']
            if 'background' in colors: settings.background_color = colors['background']
            if 'newsletterBg' in colors: settings.newsletter_bg_color = colors['newsletterBg']
            if 'text' in colors: settings.text_color = colors['text']
            if 'secondaryText' in colors: settings.secondary_text_color = colors['secondaryText']
            if 'accent' in colors: settings.accent_color = colors['accent']
            if 'link' in colors: settings.link_color = colors['link']
            if 'linkHover' in colors: settings.link_hover_color = colors['linkHover']

        # Update company info
        if 'company' in data:
            company = data['company']
            if 'name' in company: settings.company_name = company['name']
            if 'description' in company: settings.company_description = company['description']
            if 'tagline' in company: settings.tagline = company['tagline']

        # Update contact info
        if 'contact' in data:
            contact = data['contact']
            if 'address' in contact: settings.address = contact['address']
            if 'phone' in contact: settings.phone = contact['phone']
            if 'email' in contact: settings.email = contact['email']
            if 'businessHours' in contact: settings.business_hours = contact['businessHours']

        # Update social links
        if 'social' in data:
            social = data['social']
            if 'facebook' in social: settings.facebook_url = social['facebook']
            if 'instagram' in social: settings.instagram_url = social['instagram']
            if 'twitter' in social: settings.twitter_url = social['twitter']
            if 'youtube' in social: settings.youtube_url = social['youtube']
            if 'tiktok' in social: settings.tiktok_url = social['tiktok']
            if 'linkedin' in social: settings.linkedin_url = social['linkedin']

        # Update sections
        if 'sections' in data:
            sections = data['sections']
            if 'needHelp' in sections: settings.need_help_links = sections['needHelp']
            if 'about' in sections: settings.about_links = sections['about']
            if 'categories' in sections: settings.categories = sections['categories']
            if 'usefulLinks' in sections: settings.useful_links = sections['usefulLinks']
            if 'resources' in sections: settings.resources_links = sections['resources']

        # Update payment methods
        if 'paymentMethods' in data:
            settings.payment_methods = data['paymentMethods']

        # Update newsletter
        if 'newsletter' in data:
            newsletter = data['newsletter']
            if 'title' in newsletter: settings.newsletter_title = newsletter['title']
            if 'description' in newsletter: settings.newsletter_description = newsletter['description']

        # Update copyright
        if 'copyright' in data:
            settings.copyright_text = data['copyright']
        
        db.session.commit()
        logger.info(f'[Footer] Settings updated successfully by user {current_user_id}')
        
        return jsonify({
            'success': True,
            'message': 'Footer settings updated successfully',
            'data': settings.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f'[Footer] Update error: {str(e)}')
        return jsonify({
            'success': False,
            'message': f'Error updating footer settings: {str(e)}'
        }), 500

@footer_routes.route('/admin/settings/reset', methods=['POST'])
@jwt_required()
@invalidate_on_change(["footer_settings"]) if CACHE_AVAILABLE else lambda f: f
def reset_footer_settings():
    """Reset footer settings to defaults - Admin only. Invalidates footer cache."""
    try:
        current_user_id = get_jwt_identity()
        logger.info(f'[Footer] Admin RESET - User: {current_user_id}')
        
        if not FOOTER_AVAILABLE or FooterSettings is None:
            return jsonify({
                'success': False,
                'message': 'Footer system not available'
            }), 503
        
        settings = FooterSettings.get_or_create_default()
        
        # Reset to default values
        settings.background_color = '#2D2D2D'
        settings.newsletter_bg_color = '#1F1F1F'
        settings.text_color = '#FFFFFF'
        settings.secondary_text_color = '#9CA3AF'
        settings.accent_color = '#F97316'
        settings.link_color = '#E5E7EB'
        settings.link_hover_color = '#F97316'
        
        settings.company_name = 'Mizizzi'
        settings.company_description = 'Discover our curated collection of fashion and jewelry pieces. Where style meets elegance.'
        settings.tagline = 'Show via Mizizzi - Become a vendor today!'
        
        settings.address = '123 Fashion Street, Nairobi, Kenya'
        settings.phone = '+254 700 000 000'
        settings.email = 'support@mizizzi.com'
        settings.business_hours = 'Mon - Fri: 9AM - 6PM'
        
        settings.facebook_url = 'https://facebook.com'
        settings.instagram_url = 'https://instagram.com'
        settings.twitter_url = 'https://twitter.com'
        settings.youtube_url = 'https://youtube.com'
        settings.tiktok_url = ''
        settings.linkedin_url = ''
        
        settings.need_help_links = ['Chat with us', 'Help Center', 'Contact Us']
        settings.about_links = ['About us', 'Returns and Refunds Policy', 'Mizizzi Careers', 'Mizizzi Express', 'Terms and Conditions', 'Privacy Notice', 'Cookies Notice', 'Flash Sales']
        settings.categories = ['Accessories', 'Activewear', 'Baby Backpacks & Carriers', 'Bags', 'Beauty & Personal Care', 'Clothing', 'Electronics', 'Jewelry']
        settings.useful_links = ['Track Your Order', 'Shipping and delivery', 'Report a Product', 'Return Policy', 'How to Order', 'Corporate and Bulk Purchase']
        settings.resources_links = ['Size Guide', 'Shipping Info', 'Gift Cards', 'FAQ', 'Store Locator']
        
        settings.payment_methods = ['Pesapal', 'M-Pesa', 'Card Payment', 'Airtel Money', 'Cash on Delivery']
        settings.copyright_text = '© 2025 Mizizzi. All rights reserved.'
        
        db.session.commit()
        logger.info(f'[Footer] Settings reset to defaults by user {current_user_id}')
        
        return jsonify({
            'success': True,
            'message': 'Footer settings reset to defaults',
            'data': settings.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f'[Footer] Reset error: {str(e)}')
        return jsonify({
            'success': False,
            'message': f'Error resetting footer settings: {str(e)}'
        }), 500

@footer_routes.route('/cache/status', methods=['GET'])
def footer_cache_status():
    """Get cache status for footer."""
    if CACHE_AVAILABLE:
        return jsonify({
            'connected': product_cache.is_connected,
            'type': 'upstash' if product_cache.is_connected else 'memory',
            'stats': product_cache.stats,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    return jsonify({
        'connected': False,
        'type': 'none',
        'message': 'Cache not available'
    }), 200

def init_footer_tables(app):
    """Initialize footer tables in the database"""
    if not hasattr(db, 'app') and not db.get_app():
        logger.warning('Database not initialized with app, skipping footer table init')
        return
        
    with app.app_context():
        try:
            logger.info('Initializing footer tables...')
            from app.models.footer_settings import FooterSettings
            db.create_all()
            
            # Create default footer settings if none exist
            FooterSettings.get_or_create_default()
            
            logger.info('✅ Footer tables initialized successfully')
        except Exception as e:
            logger.error(f'❌ Error initializing footer tables: {str(e)}')
            logger.warning('Footer tables initialization failed, but continuing app startup')
