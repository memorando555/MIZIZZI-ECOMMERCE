"""
Admin Google OAuth Authentication Routes
Handles admin login via Google OAuth with role validation
"""

import os
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.configuration.extensions import db, limiter
from app.models.models import User, UserRole
from .admin_auth import log_admin_activity

# Setup logging
logger = logging.getLogger(__name__)

# Create Blueprint
admin_google_auth_routes = Blueprint('admin_google_auth_routes', __name__)

# Allowed admin emails for Google OAuth
ALLOWED_ADMIN_EMAILS = [
    "info.contactgilbertdev@gmail.com",
]


def get_csrf_token():
    """Generate CSRF token"""
    import random
    import string
    return ''.join(random.choices(string.ascii_letters + string.digits, k=32))


def set_access_cookies(response, access_token):
    """Set access token cookie"""
    response.set_cookie(
        'access_token_cookie',
        access_token,
        max_age=3600,
        secure=False,
        httponly=True,
        samesite='Lax'
    )


def set_refresh_cookies(response, refresh_token):
    """Set refresh token cookie"""
    response.set_cookie(
        'refresh_token_cookie',
        refresh_token,
        max_age=2592000,  # 30 days
        secure=False,
        httponly=True,
        samesite='Lax'
    )


# ============================================
# ADMIN GOOGLE LOGIN ENDPOINT
# ============================================
@admin_google_auth_routes.route('/google-login', methods=['POST', 'OPTIONS'])
@limiter.limit("5 per minute")
def admin_google_login():
    """
    Admin Google OAuth Login Endpoint
    
    Expected JSON:
    {
        "token": "google_id_token"
    }
    
    Returns:
    {
        "access_token": "jwt_access_token",
        "refresh_token": "jwt_refresh_token",
        "csrf_token": "csrf_token",
        "user": {...},
        "is_new_user": false
    }
    """
    try:
        data = request.get_json()
        if not data:
            log_admin_activity(None, 'FAILED_GOOGLE_LOGIN', 'Missing request body', 400)
            return jsonify({'error': 'Request body is required'}), 400

        token = data.get('token')
        if not token:
            log_admin_activity(None, 'FAILED_GOOGLE_LOGIN', 'Missing Google token', 400)
            return jsonify({'error': 'Google token is required'}), 400

        # Verify the Google token
        try:
            client_id = current_app.config.get('GOOGLE_CLIENT_ID')
            
            if not client_id:
                logger.error("GOOGLE_CLIENT_ID not configured")
                return jsonify({'error': 'Server configuration error: Google Client ID not set'}), 500

            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id
            )

            # Extract user information from token
            google_id = idinfo.get('sub')
            email = idinfo.get('email')
            name = idinfo.get('name', '')
            picture = idinfo.get('picture', '')

            # Validate required fields
            if not google_id or not email:
                log_admin_activity(None, 'FAILED_GOOGLE_LOGIN', 'Invalid Google token: missing fields', 400)
                return jsonify({'error': 'Invalid Google token: missing required fields'}), 400

            # Check if email is verified by Google
            if not idinfo.get('email_verified', False):
                log_admin_activity(None, 'FAILED_GOOGLE_LOGIN', f'Unverified email: {email}', 403)
                return jsonify({'error': 'Google email is not verified'}), 403

        except ValueError as e:
            logger.warning(f"Invalid Google token: {str(e)}")
            log_admin_activity(None, 'FAILED_GOOGLE_LOGIN', f'Invalid token: {str(e)}', 400)
            return jsonify({'error': 'Invalid Google token'}), 400
        except Exception as e:
            logger.error(f"Error verifying Google token: {str(e)}")
            log_admin_activity(None, 'FAILED_GOOGLE_LOGIN', f'Token verification error: {str(e)}', 500)
            return jsonify({'error': 'Error verifying Google token'}), 500

        # Check if email is in allowed admin list
        if email.lower() not in [admin_email.lower() for admin_email in ALLOWED_ADMIN_EMAILS]:
            logger.warning(f"Unauthorized admin email attempt: {email}")
            log_admin_activity(None, 'FAILED_GOOGLE_LOGIN', f'Unauthorized email: {email}', 403)
            return jsonify({'error': 'This email is not authorized for admin access'}), 403

        # Check if user exists
        user = User.query.filter_by(email=email).first()

        if not user:
            logger.warning(f"Admin user not found for Google login: {email}")
            log_admin_activity(None, 'FAILED_GOOGLE_LOGIN', f'User not found: {email}', 404)
            return jsonify({'error': 'Admin account not found. Please contact an administrator.'}), 404

        # Check if user is admin
        if user.role != UserRole.ADMIN:
            logger.warning(f"Non-admin user attempted Google login: {user.id}")
            log_admin_activity(user.id, 'FAILED_GOOGLE_LOGIN', 'Non-admin user attempted login', 403)
            return jsonify({'error': 'You do not have admin privileges'}), 403

        # Check if user account is active
        if not user.is_active:
            logger.warning(f"Inactive admin user attempted Google login: {user.id}")
            log_admin_activity(user.id, 'FAILED_GOOGLE_LOGIN', 'Account is deactivated', 403)
            return jsonify({'error': 'Your admin account has been deactivated'}), 403

        # Update user info and last login
        user.last_login = datetime.utcnow()
        user.is_google_user = True
        
        # Update profile picture if available
        if picture and not user.avatar_url:
            user.avatar_url = picture
        
        db.session.commit()

        logger.info(f"Successful Google login for admin: {user.id}")
        log_admin_activity(user.id, 'SUCCESSFUL_GOOGLE_LOGIN', 'Admin logged in via Google OAuth', 200)

        # Create JWT tokens with admin role
        additional_claims = {"role": user.role.value}
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims,
            expires_delta=False  # Use default 15 min expiry
        )
        refresh_token = create_refresh_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )

        # Generate CSRF token
        csrf_token = get_csrf_token()

        # Build response
        response_data = {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'csrf_token': csrf_token,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'name': user.name,
                'role': user.role.value,
                'is_google_user': True,
                'email_verified': user.email_verified,
            },
            'is_new_user': False
        }

        resp = jsonify(response_data)

        # Set authentication cookies
        try:
            set_access_cookies(resp, access_token)
            set_refresh_cookies(resp, refresh_token)
            resp.set_cookie("csrf_access_token", csrf_token, httponly=False, secure=False, samesite="Lax")
            logger.debug("Authentication cookies set successfully")
        except Exception as e:
            logger.warning(f"Could not set cookies: {str(e)}")

        return resp, 200

    except Exception as e:
        logger.error(f"Error in admin_google_login: {str(e)}", exc_info=True)
        log_admin_activity(None, 'FAILED_GOOGLE_LOGIN', f'Server error: {str(e)}', 500)
        return jsonify({'error': 'Internal server error during Google authentication'}), 500
