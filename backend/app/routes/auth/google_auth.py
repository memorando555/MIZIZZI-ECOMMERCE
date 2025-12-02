"""
Google OAuth Authentication Routes
Handles Google login, token refresh, linking, and unlinking
"""

import os
import logging
from functools import wraps
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, g
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import random
import string

from ...configuration.extensions import db, limiter
from ...models.models import User
from .auth_email_templates import send_welcome_email  # Import send_welcome_email

# Setup logging
logger = logging.getLogger(__name__)

# Create Blueprint
google_auth_routes = Blueprint('google_auth_routes', __name__)


def get_csrf_token():
    """Generate CSRF token"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=32))


def set_access_cookies(response, access_token):
    """Set access token cookie"""
    response.set_cookie(
        'access_token_cookie',
        access_token,
        max_age=3600,
        secure=False,  # False for local development, True for production
        httponly=True,
        samesite='Lax'
    )


def set_refresh_cookies(response, refresh_token):
    """Set refresh token cookie"""
    response.set_cookie(
        'refresh_token_cookie',
        refresh_token,
        max_age=2592000,  # 30 days
        secure=False,  # False for local development, True for production
        httponly=True,
        samesite='Lax'
    )


# ============================================
# GOOGLE LOGIN ENDPOINT
# ============================================
@google_auth_routes.route('/google-login', methods=['POST', 'OPTIONS'])
@limiter.limit("5 per minute")
def google_login():
    """
    Google OAuth Login/Register Endpoint
    
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
        "is_new_user": true/false
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'msg': 'Request body is required'}), 400

        token = data.get('token')
        if not token:
            return jsonify({'msg': 'Google token is required'}), 400

        # Verify the Google token
        try:
            client_id = current_app.config.get('GOOGLE_CLIENT_ID')
            
            if not client_id:
                logger.error("GOOGLE_CLIENT_ID not configured")
                return jsonify({'msg': 'Server configuration error: Google Client ID not set'}), 500

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
                return jsonify({'msg': 'Invalid Google token: missing required fields'}), 400

            # Check if email is verified by Google
            if not idinfo.get('email_verified', False):
                return jsonify({'msg': 'Google email is not verified'}), 400

        except ValueError as e:
            logger.warning(f"Invalid Google token: {str(e)}")
            return jsonify({'msg': 'Invalid Google token'}), 400
        except Exception as e:
            logger.error(f"Error verifying Google token: {str(e)}")
            return jsonify({'msg': 'Error verifying Google token'}), 500

        # Check if user exists
        user = User.query.filter_by(email=email).first()
        is_new_user = False

        if user:
            # Existing user - update Google information
            logger.info(f"Google login for existing user: {user.id}")
            
            user.is_google_user = True
            user.email_verified = True
            user.last_login = datetime.utcnow()
            
            # Update profile picture if available
            if picture and not user.avatar_url:
                user.avatar_url = picture
            
            db.session.commit()
        else:
            # New user - create account
            logger.info(f"Google login creating new user with email: {email}")
            is_new_user = True
            
            user = User(
                name=name,
                email=email,
                is_google_user=True,
                email_verified=True,
                is_active=True,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow(),
                avatar_url=picture if picture else None
            )

            # Generate random password for Google users (not used for login)
            random_password = ''.join(
                random.choices(string.ascii_letters + string.digits + '!@#$%^&*', k=16)
            )
            user.set_password(random_password)

            db.session.add(user)
            db.session.commit()

            # Send welcome email for new users
            send_welcome_email(user.email, user.name, auth_method='google')
            logger.info(f"Welcome email sent for new Google user: {user.id}")

        # Create JWT tokens
        additional_claims = {"role": user.role.value if hasattr(user, 'role') else 'customer'}
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims
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
                'is_google_user': user.is_google_user,
                'email_verified': user.email_verified,
                'is_new_user': is_new_user
            }
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
            # Continue even if cookie setting fails

        logger.info(f"Successful Google login/registration for user: {user.id}")
        return resp, 200

    except Exception as e:
        logger.error(f"Error in google_login: {str(e)}", exc_info=True)
        return jsonify({'msg': 'Internal server error during Google authentication'}), 500


# ============================================
# GOOGLE LOGOUT ENDPOINT
# ============================================
@google_auth_routes.route('/google-logout', methods=['POST', 'OPTIONS'])
@jwt_required()
def google_logout():
    """
    Google Logout Endpoint
    Clears authentication cookies and logs out user
    
    Returns:
    {
        "msg": "Logged out successfully"
    }
    """
    try:
        user_id = get_jwt_identity()
        logger.info(f"Google logout for user: {user_id}")

        response = jsonify({'msg': 'Logged out successfully'})

        # Clear authentication cookies
        response.set_cookie('access_token_cookie', '', max_age=0)
        response.set_cookie('refresh_token_cookie', '', max_age=0)
        response.set_cookie('csrf_access_token', '', max_age=0)

        return response, 200

    except Exception as e:
        logger.error(f"Error in google_logout: {str(e)}")
        return jsonify({'msg': 'Error logging out'}), 500


# ============================================
# GOOGLE LINK ACCOUNT ENDPOINT
# ============================================
@google_auth_routes.route('/link-google', methods=['POST', 'OPTIONS'])
@jwt_required()
@limiter.limit("5 per minute")
def link_google_account():
    """
    Link Google Account to Existing User
    
    Required: JWT Token (existing user must be logged in)
    
    Expected JSON:
    {
        "token": "google_id_token"
    }
    
    Returns:
    {
        "msg": "Google account linked successfully",
        "user": {...}
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'msg': 'User not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'msg': 'Request body is required'}), 400

        token = data.get('token')
        if not token:
            return jsonify({'msg': 'Google token is required'}), 400

        # Verify Google token
        try:
            client_id = current_app.config.get('GOOGLE_CLIENT_ID')
            if not client_id:
                return jsonify({'msg': 'Server configuration error'}), 500

            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id
            )

            google_id = idinfo.get('sub')
            email = idinfo.get('email')

            if not google_id or not email:
                return jsonify({'msg': 'Invalid Google token'}), 400

            if not idinfo.get('email_verified', False):
                return jsonify({'msg': 'Google email is not verified'}), 400

        except ValueError:
            return jsonify({'msg': 'Invalid Google token'}), 400

        # Check if this Google account is already linked to another user
        existing_user = User.query.filter_by(email=email).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({'msg': 'This Google account is already linked to another user'}), 409

        # Link Google account to current user
        user.is_google_user = True
        user.email_verified = True
        db.session.commit()

        logger.info(f"Google account linked for user: {user_id}")
        return jsonify({
            'msg': 'Google account linked successfully',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'is_google_user': user.is_google_user
            }
        }), 200

    except Exception as e:
        logger.error(f"Error in link_google_account: {str(e)}")
        return jsonify({'msg': 'Error linking Google account'}), 500


# ============================================
# GOOGLE UNLINK ACCOUNT ENDPOINT
# ============================================
@google_auth_routes.route('/unlink-google', methods=['POST', 'OPTIONS'])
@jwt_required()
@limiter.limit("5 per minute")
def unlink_google_account():
    """
    Unlink Google Account from User
    User must have a password set before unlinking
    
    Returns:
    {
        "msg": "Google account unlinked successfully"
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'msg': 'User not found'}), 404

        if not user.is_google_user:
            return jsonify({'msg': 'This account is not linked to Google'}), 400

        # Check if user has a password (required for unlinking)
        if not user.password_hash:
            return jsonify({
                'msg': 'Cannot unlink Google account without a password',
                'error_code': 'NO_PASSWORD_SET'
            }), 400

        # Unlink Google account
        user.is_google_user = False
        db.session.commit()

        logger.info(f"Google account unlinked for user: {user_id}")
        return jsonify({'msg': 'Google account unlinked successfully'}), 200

    except Exception as e:
        logger.error(f"Error in unlink_google_account: {str(e)}")
        return jsonify({'msg': 'Error unlinking Google account'}), 500


# ============================================
# GET GOOGLE ACCOUNT STATUS ENDPOINT
# ============================================
@google_auth_routes.route('/google-status', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_google_status():
    """
    Get Google Account Linking Status
    
    Returns:
    {
        "is_google_user": true/false,
        "email_verified": true/false,
        "can_unlink": true/false
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'msg': 'User not found'}), 404

        can_unlink = user.is_google_user and bool(user.password_hash)

        return jsonify({
            'is_google_user': user.is_google_user,
            'email_verified': user.email_verified,
            'can_unlink': can_unlink
        }), 200

    except Exception as e:
        logger.error(f"Error in get_google_status: {str(e)}")
        return jsonify({'msg': 'Error retrieving Google status'}), 500


# ============================================
# GOOGLE TOKEN REFRESH ENDPOINT
# ============================================
@google_auth_routes.route('/google-refresh-token', methods=['POST', 'OPTIONS'])
@jwt_required(refresh=True)
def refresh_google_token():
    """
    Refresh JWT Token for Google Users
    
    Returns:
    {
        "access_token": "new_access_token"
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'msg': 'User not found'}), 404

        if not user.is_google_user:
            return jsonify({'msg': 'This endpoint is for Google users only'}), 400

        # Create new access token
        additional_claims = {"role": user.role.value if hasattr(user, 'role') else 'customer'}
        new_access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )

        response = jsonify({'access_token': new_access_token})
        set_access_cookies(response, new_access_token)

        logger.info(f"Token refreshed for Google user: {user_id}")
        return response, 200

    except Exception as e:
        logger.error(f"Error in refresh_google_token: {str(e)}")
        return jsonify({'msg': 'Error refreshing token'}), 500


# ============================================
# VALIDATE GOOGLE TOKEN ENDPOINT
# ============================================
@google_auth_routes.route('/validate-google-token', methods=['POST', 'OPTIONS'])
@limiter.limit("10 per minute")
def validate_google_token():
    """
    Validate Google Token
    Check if a Google token is valid before processing
    
    Expected JSON:
    {
        "token": "google_id_token"
    }
    
    Returns:
    {
        "valid": true/false,
        "email": "user@example.com",
        "name": "User Name"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'msg': 'Request body is required'}), 400

        token = data.get('token')
        if not token:
            return jsonify({'msg': 'Google token is required'}), 400

        # Verify token
        try:
            client_id = current_app.config.get('GOOGLE_CLIENT_ID')
            if not client_id:
                return jsonify({'msg': 'Server configuration error'}), 500

            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id
            )

            return jsonify({
                'valid': True,
                'email': idinfo.get('email'),
                'name': idinfo.get('name'),
                'picture': idinfo.get('picture'),
                'email_verified': idinfo.get('email_verified')
            }), 200

        except ValueError:
            return jsonify({'valid': False}), 200

    except Exception as e:
        logger.error(f"Error in validate_google_token: {str(e)}")
        return jsonify({'msg': 'Error validating token'}), 500


# ============================================
# GOOGLE OAUTH CONFIG ENDPOINT
# ============================================
@google_auth_routes.route('/google-config', methods=['GET', 'OPTIONS'])
def get_google_config():
    """
    Get Google OAuth Configuration
    Client-side needs this to initialize Google Sign-In
    
    Returns:
    {
        "client_id": "google_client_id",
        "configured": true/false
    }
    """
    try:
        client_id = current_app.config.get('GOOGLE_CLIENT_ID')
        
        if not client_id:
            logger.warning("GOOGLE_CLIENT_ID is not configured")
            return jsonify({
                'configured': False,
                'message': 'Google OAuth is not configured on the server'
            }), 500

        return jsonify({
            'configured': True,
            'client_id': client_id
        }), 200

    except Exception as e:
        logger.error(f"Error in get_google_config: {str(e)}")
        return jsonify({'msg': 'Error retrieving Google configuration'}), 500


# ============================================
# GOOGLE OAUTH ERROR HANDLER
# ============================================
@google_auth_routes.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit errors"""
    return jsonify({'msg': 'Rate limit exceeded. Please try again later'}), 429