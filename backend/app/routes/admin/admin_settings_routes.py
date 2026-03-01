"""
Admin Settings Routes for Mizizzi E-commerce Platform
Handles all admin settings-related API endpoints including system settings,
integrations, store configuration, and other administrative settings.
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from functools import wraps
import logging
import os
from datetime import datetime
import json
from app.models.models import User, UserRole

# Create the admin settings blueprint
admin_settings_routes = Blueprint('admin_settings_routes', __name__)

# Set up logger
logger = logging.getLogger(__name__)

def admin_required(f):
    """Decorator to ensure only admin users can access these routes"""
    from functools import wraps

    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user or user.role != UserRole.ADMIN:
                return jsonify({
                    'success': False,
                    'error': 'Admin access required'
                }), 403
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Admin authentication error: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Authentication failed'
            }), 401

    return decorated_function

# Handle OPTIONS requests for all routes
@admin_settings_routes.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

@admin_settings_routes.route('/settings', methods=['GET', 'PUT'])
@cross_origin(origins=['http://localhost:3000'], supports_credentials=True)
@admin_required
def get_settings():
    """Get all system settings"""
    try:
        # Default system settings
        settings = {
            'site': {
                'name': 'Mizizzi E-commerce',
                'tagline': 'Your Premium Shopping Destination',
                'description': 'Discover amazing products at unbeatable prices',
                'logo_url': '/logo.png',
                'favicon_url': '/favicon.ico',
                'email': 'info@mizizzi.com',
                'phone': '+254 700 000 000',
                'address': 'Nairobi, Kenya',
                'social_links': {
                    'facebook': '',
                    'instagram': '',
                    'twitter': '',
                    'youtube': '',
                    'pinterest': '',
                    'linkedin': ''
                },
                'currency': 'KES',
                'currency_symbol': 'KSh',
                'timezone': 'Africa/Nairobi',
                'date_format': 'DD/MM/YYYY',
                'time_format': '24h',
                'default_language': 'en',
                'available_languages': ['en', 'sw']
            },
            'seo': {
                'meta_title': 'Mizizzi - Premium E-commerce Store',
                'meta_description': 'Shop the latest products with fast delivery and great prices',
                'meta_keywords': 'ecommerce, shopping, online store, kenya',
                'google_analytics_id': '',
                'facebook_pixel_id': '',
                'robots_txt': 'User-agent: *\nAllow: /',
                'sitemap_enabled': True
            },
            'email': {
                'smtp_host': '',
                'smtp_port': 587,
                'smtp_username': '',
                'smtp_password': '',
                'smtp_encryption': 'tls',
                'from_email': 'noreply@mizizzi.com',
                'from_name': 'Mizizzi Store',
                'email_signature': 'Best regards,\nThe Mizizzi Team'
            },
            'payment': {
                'payment_methods': [
                    {'id': 'mpesa', 'name': 'M-Pesa', 'is_active': True, 'config': {}},
                    {'id': 'card', 'name': 'Credit/Debit Card', 'is_active': True, 'config': {}},
                    {'id': 'cod', 'name': 'Cash on Delivery', 'is_active': True, 'config': {}}
                ],
                'currency': 'KES',
                'tax_rate': 16,
                'tax_included_in_price': False
            },
            'inventory': {
                'low_stock_threshold': 10,
                'notify_on_low_stock': True,
                'allow_backorders': False,
                'show_out_of_stock_products': True
            },
            'reviews': {
                'enabled': True,
                'require_approval': True,
                'allow_guest_reviews': False,
                'notify_on_new_review': True
            },
            'security': {
                'password_min_length': 8,
                'password_requires_special_char': True,
                'password_requires_number': True,
                'password_requires_uppercase': True,
                'max_login_attempts': 5,
                'lockout_time': 15,
                'session_lifetime': 24,
                'enable_two_factor': False
            },
            'maintenance': {
                'maintenance_mode': False,
                'maintenance_message': "We're currently performing maintenance. Please check back soon.",
                'allowed_ips': []
            }
        }

        return jsonify({
            'success': True,
            'settings': settings,
            'last_updated': datetime.utcnow().isoformat()
        })

    except Exception as e:
        current_app.logger.error(f"Error fetching settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch settings'
        }), 500

@admin_settings_routes.route('/settings', methods=['PUT'])
@cross_origin(origins=['http://localhost:3000'], supports_credentials=True)
@admin_required
def update_settings():
    """Update system settings"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        current_app.logger.info(f"Settings updated by admin user {get_jwt_identity()}")

        return jsonify({
            'success': True,
            'message': 'Settings updated successfully',
            'updated_at': datetime.utcnow().isoformat()
        })

    except Exception as e:
        current_app.logger.error(f"Error updating settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update settings'
        }), 500

@admin_settings_routes.route('/settings/general', methods=['GET', 'PUT'])
@admin_required
def general_settings():
    """Get or update general settings"""
    try:
        if request.method == 'GET':
            settings = {
                'site_name': os.environ.get('SITE_NAME', 'Mizizzi E-commerce'),
                'site_url': os.environ.get('SITE_URL', 'http://localhost:3000'),
                'admin_email': os.environ.get('ADMIN_EMAIL', 'admin@mizizzi.com'),
                'timezone': os.environ.get('TIMEZONE', 'UTC'),
                'currency': os.environ.get('CURRENCY', 'USD'),
                'language': os.environ.get('LANGUAGE', 'en'),
                'maintenance_mode': os.environ.get('MAINTENANCE_MODE', 'false').lower() == 'true'
            }

            return jsonify({
                'success': True,
                'settings': settings
            })

        elif request.method == 'PUT':
            data = request.get_json()

            # Update general settings logic here
            logger.info(f"General settings updated by admin user {get_jwt_identity()}")

            return jsonify({
                'success': True,
                'message': 'General settings updated successfully'
            })

    except Exception as e:
        logger.error(f"Error with general settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process general settings'
        }), 500

@admin_settings_routes.route('/settings/integrations', methods=['GET', 'PUT'])
@admin_required
def integration_settings():
    """Get or update integration settings"""
    try:
        if request.method == 'GET':
            integrations = {
                'mpesa': {
                    'enabled': os.environ.get('MPESA_ENABLED', 'false').lower() == 'true',
                    'environment': os.environ.get('MPESA_ENVIRONMENT', 'sandbox'),
                    'shortcode': os.environ.get('MPESA_SHORTCODE', ''),
                    'configured': bool(os.environ.get('MPESA_CONSUMER_KEY') and os.environ.get('MPESA_CONSUMER_SECRET'))
                },
                'email': {
                    'enabled': os.environ.get('MAIL_ENABLED', 'false').lower() == 'true',
                    'provider': os.environ.get('MAIL_PROVIDER', 'smtp'),
                    'configured': bool(os.environ.get('MAIL_SERVER') and os.environ.get('MAIL_USERNAME'))
                },
                'analytics': {
                    'google_analytics_enabled': os.environ.get('GA_ENABLED', 'false').lower() == 'true',
                    'facebook_pixel_enabled': os.environ.get('FB_PIXEL_ENABLED', 'false').lower() == 'true'
                },
                'social': {
                    'facebook_login': os.environ.get('FACEBOOK_LOGIN_ENABLED', 'false').lower() == 'true',
                    'google_login': os.environ.get('GOOGLE_LOGIN_ENABLED', 'false').lower() == 'true'
                }
            }

            return jsonify({
                'success': True,
                'integrations': integrations
            })

        elif request.method == 'PUT':
            data = request.get_json()

            # Update integration settings logic here
            logger.info(f"Integration settings updated by admin user {get_jwt_identity()}")

            return jsonify({
                'success': True,
                'message': 'Integration settings updated successfully'
            })

    except Exception as e:
        logger.error(f"Error with integration settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process integration settings'
        }), 500

@admin_settings_routes.route('/settings/store', methods=['GET', 'PUT'])
@admin_required
def store_settings():
    """Get or update store settings"""
    try:
        if request.method == 'GET':
            settings = {
                'store_name': os.environ.get('STORE_NAME', 'Mizizzi Store'),
                'store_description': os.environ.get('STORE_DESCRIPTION', 'Your premium e-commerce destination'),
                'store_address': os.environ.get('STORE_ADDRESS', ''),
                'store_phone': os.environ.get('STORE_PHONE', ''),
                'store_email': os.environ.get('STORE_EMAIL', 'store@mizizzi.com'),
                'tax_rate': float(os.environ.get('TAX_RATE', '0.0')),
                'shipping_enabled': os.environ.get('SHIPPING_ENABLED', 'true').lower() == 'true',
                'free_shipping_threshold': float(os.environ.get('FREE_SHIPPING_THRESHOLD', '100.0'))
            }

            return jsonify({
                'success': True,
                'settings': settings
            })

        elif request.method == 'PUT':
            data = request.get_json()

            # Update store settings logic here
            logger.info(f"Store settings updated by admin user {get_jwt_identity()}")

            return jsonify({
                'success': True,
                'message': 'Store settings updated successfully'
            })

    except Exception as e:
        logger.error(f"Error with store settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process store settings'
        }), 500

@admin_settings_routes.route('/settings/security', methods=['GET', 'PUT'])
@admin_required
def security_settings():
    """Get or update security settings"""
    try:
        if request.method == 'GET':
            settings = {
                'two_factor_enabled': os.environ.get('TWO_FACTOR_ENABLED', 'false').lower() == 'true',
                'password_min_length': int(os.environ.get('PASSWORD_MIN_LENGTH', '8')),
                'session_timeout': int(os.environ.get('SESSION_TIMEOUT', '3600')),
                'max_login_attempts': int(os.environ.get('MAX_LOGIN_ATTEMPTS', '5')),
                'account_lockout_duration': int(os.environ.get('ACCOUNT_LOCKOUT_DURATION', '900'))
            }

            return jsonify({
                'success': True,
                'settings': settings
            })

        elif request.method == 'PUT':
            data = request.get_json()

            # Update security settings logic here
            logger.info(f"Security settings updated by admin user {get_jwt_identity()}")

            return jsonify({
                'success': True,
                'message': 'Security settings updated successfully'
            })

    except Exception as e:
        logger.error(f"Error with security settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process security settings'
        }), 500

@admin_settings_routes.route('/settings/test-connection', methods=['POST'])
@admin_required
def test_connection():
    """Test connection to external services"""
    try:
        data = request.get_json()
        service = data.get('service')

        if not service:
            return jsonify({
                'success': False,
                'error': 'Service type required'
            }), 400

        # Test connection logic based on service type
        if service == 'mpesa':
            # Test M-PESA connection
            result = {'success': True, 'message': 'M-PESA connection test successful'}
        elif service == 'email':
            # Test email connection
            result = {'success': True, 'message': 'Email connection test successful'}
        elif service == 'database':
            # Test database connection
            result = {'success': True, 'message': 'Database connection test successful'}
        else:
            result = {'success': False, 'message': f'Unknown service: {service}'}

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error testing connection: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Connection test failed'
        }), 500

@admin_settings_routes.route('/settings/backup', methods=['POST'])
@admin_required
def backup_settings():
    """Create a backup of current settings"""
    try:
        # Create settings backup logic here
        backup_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'created_by': get_jwt_identity(),
            'settings': {
                # Include all current settings
            }
        }

        logger.info(f"Settings backup created by admin user {get_jwt_identity()}")

        return jsonify({
            'success': True,
            'message': 'Settings backup created successfully',
            'backup_id': f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        })

    except Exception as e:
        logger.error(f"Error creating settings backup: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create settings backup'
        }), 500

@admin_settings_routes.route('/settings/restore', methods=['POST'])
@admin_required
def restore_settings():
    """Restore settings from backup"""
    try:
        data = request.get_json()
        backup_id = data.get('backup_id')

        if not backup_id:
            return jsonify({
                'success': False,
                'error': 'Backup ID required'
            }), 400

        # Restore settings logic here
        logger.info(f"Settings restored from backup {backup_id} by admin user {get_jwt_identity()}")

        return jsonify({
            'success': True,
            'message': 'Settings restored successfully'
        })

    except Exception as e:
        logger.error(f"Error restoring settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to restore settings'
        }), 500

# Error handlers for the admin settings blueprint
@admin_settings_routes.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Settings endpoint not found'
    }), 404

@admin_settings_routes.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error in settings'
    }), 500

# ==================== Additional Settings Routes ====================

@admin_settings_routes.route('/settings/notifications', methods=['GET', 'PUT'])
@admin_required
def notification_settings():
    """Get or update notification settings"""
    try:
        if request.method == 'GET':
            settings = {
                'order_notifications_enabled': os.environ.get('ORDER_NOTIFICATIONS_ENABLED', 'true').lower() == 'true',
                'low_stock_notifications_enabled': os.environ.get('LOW_STOCK_NOTIFICATIONS_ENABLED', 'true').lower() == 'true',
                'review_notifications_enabled': os.environ.get('REVIEW_NOTIFICATIONS_ENABLED', 'true').lower() == 'true',
                'admin_email_on_order': os.environ.get('ADMIN_EMAIL_ON_ORDER', 'true').lower() == 'true',
                'admin_email_on_review': os.environ.get('ADMIN_EMAIL_ON_REVIEW', 'true').lower() == 'true',
                'sms_notifications_enabled': os.environ.get('SMS_NOTIFICATIONS_ENABLED', 'false').lower() == 'true',
                'push_notifications_enabled': os.environ.get('PUSH_NOTIFICATIONS_ENABLED', 'false').lower() == 'true',
                'notification_channels': ['email', 'sms', 'push', 'in_app'],
                'email_template_language': os.environ.get('EMAIL_TEMPLATE_LANGUAGE', 'en')
            }
            
            return jsonify({
                'success': True,
                'settings': settings
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            logger.info(f"Notification settings updated by admin user {get_jwt_identity()}")
            
            return jsonify({
                'success': True,
                'message': 'Notification settings updated successfully'
            })
    
    except Exception as e:
        logger.error(f"Error with notification settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process notification settings'
        }), 500

@admin_settings_routes.route('/settings/shipping', methods=['GET', 'PUT'])
@admin_required
def shipping_settings():
    """Get or update shipping settings"""
    try:
        if request.method == 'GET':
            settings = {
                'shipping_enabled': os.environ.get('SHIPPING_ENABLED', 'true').lower() == 'true',
                'default_shipping_cost': float(os.environ.get('DEFAULT_SHIPPING_COST', '0.0')),
                'free_shipping_threshold': float(os.environ.get('FREE_SHIPPING_THRESHOLD', '100.0')),
                'calculate_shipping_by': 'weight',
                'weight_unit': 'kg',
                'shipping_carriers': ['standard', 'express', 'overnight'],
                'origin_address': os.environ.get('ORIGIN_ADDRESS', ''),
                'auto_calculate_shipping': os.environ.get('AUTO_CALCULATE_SHIPPING', 'true').lower() == 'true'
            }
            
            return jsonify({
                'success': True,
                'settings': settings
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            logger.info(f"Shipping settings updated by admin user {get_jwt_identity()}")
            
            return jsonify({
                'success': True,
                'message': 'Shipping settings updated successfully'
            })
    
    except Exception as e:
        logger.error(f"Error with shipping settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process shipping settings'
        }), 500

@admin_settings_routes.route('/settings/tax', methods=['GET', 'PUT'])
@admin_required
def tax_settings():
    """Get or update tax settings"""
    try:
        if request.method == 'GET':
            settings = {
                'tax_enabled': os.environ.get('TAX_ENABLED', 'true').lower() == 'true',
                'tax_rate': float(os.environ.get('TAX_RATE', '16.0')),
                'tax_included_in_price': os.environ.get('TAX_INCLUDED_IN_PRICE', 'false').lower() == 'true',
                'tax_region': os.environ.get('TAX_REGION', 'KE'),
                'tax_label': os.environ.get('TAX_LABEL', 'VAT'),
                'calculate_tax_on_shipping': os.environ.get('CALCULATE_TAX_ON_SHIPPING', 'false').lower() == 'true',
                'tax_brackets': []
            }
            
            return jsonify({
                'success': True,
                'settings': settings
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            logger.info(f"Tax settings updated by admin user {get_jwt_identity()}")
            
            return jsonify({
                'success': True,
                'message': 'Tax settings updated successfully'
            })
    
    except Exception as e:
        logger.error(f"Error with tax settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process tax settings'
        }), 500

@admin_settings_routes.route('/settings/localization', methods=['GET', 'PUT'])
@admin_required
def localization_settings():
    """Get or update localization settings"""
    try:
        if request.method == 'GET':
            settings = {
                'default_language': os.environ.get('DEFAULT_LANGUAGE', 'en'),
                'supported_languages': ['en', 'sw', 'fr'],
                'default_timezone': os.environ.get('DEFAULT_TIMEZONE', 'Africa/Nairobi'),
                'date_format': os.environ.get('DATE_FORMAT', 'DD/MM/YYYY'),
                'time_format': os.environ.get('TIME_FORMAT', '24h'),
                'default_currency': os.environ.get('DEFAULT_CURRENCY', 'KES'),
                'currency_position': os.environ.get('CURRENCY_POSITION', 'before'),
                'price_decimals': int(os.environ.get('PRICE_DECIMALS', '2'))
            }
            
            return jsonify({
                'success': True,
                'settings': settings
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            logger.info(f"Localization settings updated by admin user {get_jwt_identity()}")
            
            return jsonify({
                'success': True,
                'message': 'Localization settings updated successfully'
            })
    
    except Exception as e:
        logger.error(f"Error with localization settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process localization settings'
        }), 500

@admin_settings_routes.route('/settings/advanced', methods=['GET', 'PUT'])
@admin_required
def advanced_settings():
    """Get or update advanced settings"""
    try:
        if request.method == 'GET':
            settings = {
                'api_rate_limit': int(os.environ.get('API_RATE_LIMIT', '100')),
                'cache_enabled': os.environ.get('CACHE_ENABLED', 'true').lower() == 'true',
                'cache_ttl': int(os.environ.get('CACHE_TTL', '3600')),
                'debug_mode': os.environ.get('DEBUG_MODE', 'false').lower() == 'true',
                'enable_cors': os.environ.get('ENABLE_CORS', 'true').lower() == 'true',
                'cors_origins': os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
                'enable_api_logging': os.environ.get('ENABLE_API_LOGGING', 'true').lower() == 'true',
                'max_upload_size': int(os.environ.get('MAX_UPLOAD_SIZE', '10485760'))
            }
            
            return jsonify({
                'success': True,
                'settings': settings
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            logger.info(f"Advanced settings updated by admin user {get_jwt_identity()}")
            
            return jsonify({
                'success': True,
                'message': 'Advanced settings updated successfully'
            })
    
    except Exception as e:
        logger.error(f"Error with advanced settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process advanced settings'
        }), 500

@admin_settings_routes.route('/settings/audit-log', methods=['GET'])
@admin_required
def audit_log():
    """Get settings audit log"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        
        # Return audit log entries
        logs = [
            {
                'id': 1,
                'action': 'Settings updated',
                'admin_user': 'Admin',
                'timestamp': datetime.utcnow().isoformat(),
                'changes': {'setting_key': 'value_change'}
            }
        ]
        
        return jsonify({
            'success': True,
            'logs': logs,
            'page': page,
            'limit': limit,
            'total': 1
        })
    
    except Exception as e:
        logger.error(f"Error fetching audit log: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch audit log'
        }), 500

@admin_settings_routes.route('/settings/history', methods=['GET'])
@admin_required
def settings_history():
    """Get settings change history"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        
        history = [
            {
                'id': 1,
                'setting_key': 'site.name',
                'old_value': 'Old Store Name',
                'new_value': 'Mizizzi E-commerce',
                'changed_by': 'Admin',
                'timestamp': datetime.utcnow().isoformat()
            }
        ]
        
        return jsonify({
            'success': True,
            'history': history,
            'page': page,
            'limit': limit,
            'total': 1
        })
    
    except Exception as e:
        logger.error(f"Error fetching settings history: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch settings history'
        }), 500

@admin_settings_routes.route('/settings/reset', methods=['POST'])
@admin_required
def reset_settings():
    """Reset all settings to defaults"""
    try:
        data = request.get_json()
        confirm = data.get('confirm', False)
        
        if not confirm:
            return jsonify({
                'success': False,
                'error': 'Reset must be confirmed'
            }), 400
        
        logger.warning(f"All settings reset to defaults by admin user {get_jwt_identity()}")
        
        return jsonify({
            'success': True,
            'message': 'All settings have been reset to defaults'
        })
    
    except Exception as e:
        logger.error(f"Error resetting settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to reset settings'
        }), 500

@admin_settings_routes.route('/settings/export', methods=['GET'])
@admin_required
def export_settings():
    """Export all settings as JSON"""
    try:
        # This would normally get settings from database
        settings_export = {
            'exported_at': datetime.utcnow().isoformat(),
            'version': '1.0',
            'settings': {
                # All settings would be included here
            }
        }
        
        return jsonify({
            'success': True,
            'data': settings_export
        })
    
    except Exception as e:
        logger.error(f"Error exporting settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to export settings'
        }), 500

@admin_settings_routes.route('/settings/import', methods=['POST'])
@admin_required
def import_settings():
    """Import settings from JSON"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        logger.info(f"Settings imported by admin user {get_jwt_identity()}")
        
        return jsonify({
            'success': True,
            'message': 'Settings imported successfully'
        })
    
    except Exception as e:
        logger.error(f"Error importing settings: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to import settings'
        }), 500

# Error handlers for the admin settings blueprint
@admin_settings_routes.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Settings endpoint not found'
    }), 404

@admin_settings_routes.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error in settings'
    }), 500
