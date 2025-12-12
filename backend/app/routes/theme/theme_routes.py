"""
Theme Management Routes
Handles theme settings, presets, and customization
OPTIMIZED with Upstash Redis caching for fast frontend responses.
"""
from flask import Blueprint, request, jsonify, g, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from ...configuration.extensions import db
from ...models.models import User, UserRole
from ...models.theme_settings import ThemeSettings, ThemePreset
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

theme_routes = Blueprint('theme', __name__)

try:
    from ...utils.redis_cache import (
        product_cache,
        cached_response,
        fast_cached_response,
        invalidate_on_change,
        fast_json_dumps
    )
    CACHE_AVAILABLE = True
    logger.info("✅ Redis cache available for theme routes")
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


# ============================================================================
# PUBLIC ROUTES - Theme data for frontend (OPTIMIZED with Redis)
# ============================================================================

@theme_routes.route('/active', methods=['GET'])
@cross_origin()
@cached_response("theme_active", ttl=300, key_params=[])
def get_active_theme():
    """
    Get currently active theme settings
    PUBLIC ROUTE - No authentication required
    OPTIMIZED: Redis cached with 5 minute TTL for instant loading.
    """
    try:
        active_theme = ThemeSettings.get_active_theme()
        
        if not active_theme:
            # Return default theme if none is active
            return {
                'success': True,
                'theme': None,
                'message': 'No active theme found, using default'
            }, 200
        
        return {
            'success': True,
            'theme': active_theme.to_dict(),
            'cached_at': datetime.utcnow().isoformat()
        }, 200
        
    except Exception as e:
        logger.error(f"Error fetching active theme: {str(e)}")
        return {
            'success': False,
            'message': 'Failed to fetch active theme'
        }, 500

@theme_routes.route('/css', methods=['GET'])
@cross_origin()
@fast_cached_response("theme_css", ttl=300, key_params=[]) if CACHE_AVAILABLE else lambda f: f
def get_theme_css():
    """
    Get active theme as CSS variables
    PUBLIC ROUTE - Returns CSS that can be injected into the page
    OPTIMIZED: Redis cached with 5 minute TTL.
    """
    try:
        active_theme = ThemeSettings.get_active_theme()
        
        if not active_theme:
            return '', 200
        
        css = active_theme.to_css_variables()
        
        return css, 200
        
    except Exception as e:
        logger.error(f"Error generating theme CSS: {str(e)}")
        return '', 500

# ============================================
# ADMIN ROUTES - Theme Management
# ============================================

def admin_required():
    """Decorator to check if user is admin"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != UserRole.ADMIN:
        return jsonify({
            'success': False,
            'message': 'Admin access required'
        }), 403
    
    return None

@theme_routes.route('/admin/themes', methods=['GET'])
@jwt_required()
@cross_origin()
def get_all_themes():
    """Get all theme configurations (Admin only)"""
    # Check admin access
    admin_check = admin_required()
    if admin_check:
        return admin_check
    
    try:
        themes = ThemeSettings.query.order_by(ThemeSettings.updated_at.desc()).all()
        
        return jsonify({
            'success': True,
            'themes': [theme.to_dict() for theme in themes],
            'count': len(themes)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching themes: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch themes'
        }), 500

@theme_routes.route('/admin/themes/<int:theme_id>', methods=['GET'])
@jwt_required()
@cross_origin()
def get_theme_by_id(theme_id):
    """Get specific theme by ID (Admin only)"""
    admin_check = admin_required()
    if admin_check:
        return admin_check
    
    try:
        theme = ThemeSettings.query.get(theme_id)
        
        if not theme:
            return jsonify({
                'success': False,
                'message': 'Theme not found'
            }), 404
        
        return jsonify({
            'success': True,
            'theme': theme.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching theme: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch theme'
        }), 500

@theme_routes.route('/admin/themes', methods=['POST'])
@jwt_required()
@cross_origin()
@invalidate_on_change(["theme_active", "theme_css"]) if CACHE_AVAILABLE else lambda f: f
def create_theme():
    """Create new theme configuration (Admin only). Invalidates theme cache."""
    admin_check = admin_required()
    if admin_check:
        return admin_check
    
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        from ...validations.color_validator import ColorValidator
        
        colors = data.get('colors', {})
        color_validator = ColorValidator(colors)
        
        if not color_validator.is_valid():
            return jsonify({
                'success': False,
                'message': 'Invalid color values',
                'errors': color_validator.get_errors()
            }), 400
        
        # Create new theme
        new_theme = ThemeSettings(
            name=data.get('name', 'Custom Theme'),
            is_active=data.get('is_active', False),
            created_by=user_id,
            updated_by=user_id
        )
        
        # Set colors if provided (same as original)
        if 'primary' in colors:
            new_theme.primary_color = colors['primary'].get('main', '#7C2D12')
            new_theme.primary_light = colors['primary'].get('light', '#991B1B')
            new_theme.primary_dark = colors['primary'].get('dark', '#450A0A')
        
        # ... existing color assignment code ...
        
        if 'secondary' in colors:
            new_theme.secondary_color = colors['secondary'].get('main', '#DC2626')
            new_theme.accent_color = colors['secondary'].get('accent', '#EF4444')
        
        if 'background' in colors:
            new_theme.background_color = colors['background'].get('main', '#450A0A')
            new_theme.card_background = colors['background'].get('card', '#FFFFFF')
            new_theme.surface_color = colors['background'].get('surface', '#F5F5F5')
        
        if 'text' in colors:
            new_theme.text_primary = colors['text'].get('primary', '#1F2937')
            new_theme.text_secondary = colors['text'].get('secondary', '#6B7280')
            new_theme.text_on_primary = colors['text'].get('onPrimary', '#FFFFFF')
        
        if 'border' in colors:
            new_theme.border_color = colors['border'].get('main', '#E5E7EB')
            new_theme.divider_color = colors['border'].get('divider', '#D1D5DB')
        
        if 'button' in colors and 'primary' in colors['button']:
            new_theme.button_primary_bg = colors['button']['primary'].get('background', '#7C2D12')
            new_theme.button_primary_text = colors['button']['primary'].get('text', '#FFFFFF')
            new_theme.button_primary_hover = colors['button']['primary'].get('hover', '#991B1B')
        
        if 'button' in colors and 'secondary' in colors['button']:
            new_theme.button_secondary_bg = colors['button']['secondary'].get('background', '#F3F4F6')
            new_theme.button_secondary_text = colors['button']['secondary'].get('text', '#1F2937')
        
        if 'status' in colors:
            new_theme.success_color = colors['status'].get('success', '#10B981')
            new_theme.warning_color = colors['status'].get('warning', '#F59E0B')
            new_theme.error_color = colors['status'].get('error', '#EF4444')
            new_theme.info_color = colors['status'].get('info', '#3B82F6')
        
        if 'header' in colors:
            new_theme.header_background = colors['header'].get('background', '#FFFFFF')
            new_theme.header_text = colors['header'].get('text', '#1F2937')
        
        if 'footer' in colors:
            new_theme.footer_background = colors['footer'].get('background', '#1F2937')
            new_theme.footer_text = colors['footer'].get('text', '#FFFFFF')
        
        if 'link' in colors:
            new_theme.link_color = colors['link'].get('main', '#7C2D12')
            new_theme.link_hover_color = colors['link'].get('hover', '#991B1B')
        
        if 'badge' in colors:
            new_theme.badge_color = colors['badge'].get('background', '#DC2626')
            new_theme.badge_text = colors['badge'].get('text', '#FFFFFF')
        
        if 'navigation' in colors:
            new_theme.nav_background = colors['navigation'].get('background', '#FFFFFF')
            new_theme.nav_text = colors['navigation'].get('text', '#1F2937')
            new_theme.nav_active = colors['navigation'].get('active', '#7C2D12')
        
        if 'carousel' in colors:
            if 'background' in colors['carousel']:
                new_theme.carousel_background = colors['carousel']['background']
            if 'overlayDark' in colors['carousel']:
                new_theme.carousel_overlay_dark = colors['carousel']['overlayDark']
            if 'overlayLight' in colors['carousel']:
                new_theme.carousel_overlay_light = colors['carousel']['overlayLight']
            if 'badgeBg' in colors['carousel']:
                new_theme.carousel_badge_bg = colors['carousel']['badgeBg']
            if 'badgeText' in colors['carousel']:
                new_theme.carousel_badge_text = colors['carousel']['badgeText']
        
        # If this is set to active, deactivate others
        if new_theme.is_active:
            ThemeSettings.deactivate_all()
        
        db.session.add(new_theme)
        db.session.commit()
        
        logger.info(f"Theme created: {new_theme.name} by user {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'Theme created successfully',
            'theme': new_theme.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating theme: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create theme'
        }), 500

@theme_routes.route('/admin/themes/<int:theme_id>', methods=['PUT'])
@jwt_required()
@cross_origin()
@invalidate_on_change(["theme_active", "theme_css"]) if CACHE_AVAILABLE else lambda f: f
def update_theme(theme_id):
    """Update existing theme (Admin only). Invalidates theme cache."""
    admin_check = admin_required()
    if admin_check:
        return admin_check
    
    try:
        theme = ThemeSettings.query.get(theme_id)
        
        if not theme:
            return jsonify({
                'success': False,
                'message': 'Theme not found'
            }), 404
        
        data = request.get_json()
        user_id = get_jwt_identity()
        
        from ...validations.color_validator import ColorValidator
        
        colors = data.get('colors', {})
        color_validator = ColorValidator(colors)
        
        if not color_validator.is_valid():
            return jsonify({
                'success': False,
                'message': 'Invalid color values',
                'errors': color_validator.get_errors()
            }), 400
        
        # Update basic info
        if 'name' in data:
            theme.name = data['name']
        
        if 'is_active' in data:
            if data['is_active']:
                ThemeSettings.deactivate_all()
            theme.is_active = data['is_active']
        
        # ... existing color update code ...
        
        if 'primary' in colors:
            if 'main' in colors['primary']:
                theme.primary_color = colors['primary']['main']
            if 'light' in colors['primary']:
                theme.primary_light = colors['primary']['light']
            if 'dark' in colors['primary']:
                theme.primary_dark = colors['primary']['dark']
        
        if 'secondary' in colors:
            if 'main' in colors['secondary']:
                theme.secondary_color = colors['secondary']['main']
            if 'accent' in colors['secondary']:
                theme.accent_color = colors['secondary']['accent']
        
        if 'background' in colors:
            if 'main' in colors['background']:
                theme.background_color = colors['background']['main']
            if 'card' in colors['background']:
                theme.card_background = colors['background']['card']
            if 'surface' in colors['background']:
                theme.surface_color = colors['background']['surface']
        
        if 'text' in colors:
            if 'primary' in colors['text']:
                theme.text_primary = colors['text']['primary']
            if 'secondary' in colors['text']:
                theme.text_secondary = colors['text']['secondary']
            if 'onPrimary' in colors['text']:
                theme.text_on_primary = colors['text']['onPrimary']
        
        if 'border' in colors:
            if 'main' in colors['border']:
                theme.border_color = colors['border']['main']
            if 'divider' in colors['border']:
                theme.divider_color = colors['border']['divider']
        
        if 'button' in colors:
            if 'primary' in colors['button']:
                if 'background' in colors['button']['primary']:
                    theme.button_primary_bg = colors['button']['primary']['background']
                if 'text' in colors['button']['primary']:
                    theme.button_primary_text = colors['button']['primary']['text']
                if 'hover' in colors['button']['primary']:
                    theme.button_primary_hover = colors['button']['primary']['hover']
            
            if 'secondary' in colors['button']:
                if 'background' in colors['button']['secondary']:
                    theme.button_secondary_bg = colors['button']['secondary']['background']
                if 'text' in colors['button']['secondary']:
                    theme.button_secondary_text = colors['button']['secondary']['text']
        
        if 'status' in colors:
            if 'success' in colors['status']:
                theme.success_color = colors['status']['success']
            if 'warning' in colors['status']:
                theme.warning_color = colors['status']['warning']
            if 'error' in colors['status']:
                theme.error_color = colors['status']['error']
            if 'info' in colors['status']:
                theme.info_color = colors['status']['info']
        
        if 'header' in colors:
            if 'background' in colors['header']:
                theme.header_background = colors['header']['background']
            if 'text' in colors['header']:
                theme.header_text = colors['header']['text']
        
        if 'footer' in colors:
            if 'background' in colors['footer']:
                theme.footer_background = colors['footer']['background']
            if 'text' in colors['footer']:
                theme.footer_text = colors['footer']['text']
        
        if 'link' in colors:
            if 'main' in colors['link']:
                theme.link_color = colors['link']['main']
            if 'hover' in colors['link']:
                theme.link_hover_color = colors['link']['hover']
        
        if 'badge' in colors:
            if 'background' in colors['badge']:
                theme.badge_color = colors['badge']['background']
            if 'text' in colors['badge']:
                theme.badge_text = colors['badge']['text']
        
        if 'navigation' in colors:
            if 'background' in colors['navigation']:
                theme.nav_background = colors['navigation']['background']
            if 'text' in colors['navigation']:
                theme.nav_text = colors['navigation']['text']
            if 'active' in colors['navigation']:
                theme.nav_active = colors['navigation']['active']
        
        if 'carousel' in colors:
            if 'background' in colors['carousel']:
                theme.carousel_background = colors['carousel']['background']
            if 'overlayDark' in colors['carousel']:
                theme.carousel_overlay_dark = colors['carousel']['overlayDark']
            if 'overlayLight' in colors['carousel']:
                theme.carousel_overlay_light = colors['carousel']['overlayLight']
            if 'badgeBg' in colors['carousel']:
                theme.carousel_badge_bg = colors['carousel']['badgeBg']
            if 'badgeText' in colors['carousel']:
                theme.carousel_badge_text = colors['carousel']['badgeText']
        
        theme.updated_by = user_id
        theme.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        logger.info(f"Theme updated: {theme.name} by user {user_id}")
        
        from ...websocket import broadcast_to_all
        broadcast_to_all('theme_updated', {
            'success': True,
            'theme': theme.to_dict(),
            'message': 'Theme updated in real-time',
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
        return jsonify({
            'success': True,
            'message': 'Theme updated successfully',
            'theme': theme.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating theme: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update theme'
        }), 500

@theme_routes.route('/admin/themes/<int:theme_id>/activate', methods=['POST'])
@jwt_required()
@cross_origin()
@invalidate_on_change(["theme_active", "theme_css"]) if CACHE_AVAILABLE else lambda f: f
def activate_theme(theme_id):
    """Activate a specific theme (Admin only). Invalidates theme cache."""
    admin_check = admin_required()
    if admin_check:
        return admin_check
    
    try:
        theme = ThemeSettings.query.get(theme_id)
        
        if not theme:
            return jsonify({
                'success': False,
                'message': 'Theme not found'
            }), 404
        
        theme.activate()
        
        logger.info(f"Theme activated: {theme.name}")
        
        return jsonify({
            'success': True,
            'message': f'Theme "{theme.name}" activated successfully',
            'theme': theme.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error activating theme: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to activate theme'
        }), 500

@theme_routes.route('/admin/themes/<int:theme_id>', methods=['DELETE'])
@jwt_required()
@cross_origin()
@invalidate_on_change(["theme_active", "theme_css"]) if CACHE_AVAILABLE else lambda f: f
def delete_theme(theme_id):
    """Delete a theme (Admin only). Invalidates theme cache."""
    admin_check = admin_required()
    if admin_check:
        return admin_check
    
    try:
        theme = ThemeSettings.query.get(theme_id)
        
        if not theme:
            return jsonify({
                'success': False,
                'message': 'Theme not found'
            }), 404
        
        # Don't allow deleting active theme
        if theme.is_active:
            return jsonify({
                'success': False,
                'message': 'Cannot delete active theme. Please activate another theme first.'
            }), 400
        
        theme_name = theme.name
        db.session.delete(theme)
        db.session.commit()
        
        logger.info(f"Theme deleted: {theme_name}")
        
        return jsonify({
            'success': True,
            'message': f'Theme "{theme_name}" deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting theme: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete theme'
        }), 500

# ============================================
# THEME PRESETS (OPTIMIZED with Redis)
# ============================================

@theme_routes.route('/presets', methods=['GET'])
@cross_origin()
@cached_response("theme_presets", ttl=600, key_params=[])
def get_theme_presets():
    """Get all available theme presets. OPTIMIZED: Redis cached."""
    try:
        presets = ThemePreset.query.filter_by(is_active=True).all()
        
        return {
            'success': True,
            'presets': [preset.to_dict() for preset in presets],
            'count': len(presets)
        }, 200
        
    except Exception as e:
        logger.error(f"Error fetching theme presets: {str(e)}")
        return {
            'success': False,
            'message': 'Failed to fetch theme presets'
        }, 500

@theme_routes.route('/cache/status', methods=['GET'])
@cross_origin()
def theme_cache_status():
    """Get cache status for theme."""
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

# Register blueprint with prefix
def init_theme_routes(app):
    """Initialize theme routes"""
    app.register_blueprint(theme_routes, url_prefix='/api/theme')
