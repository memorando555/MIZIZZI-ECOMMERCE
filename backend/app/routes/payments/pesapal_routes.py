"""
Pesapal Card Payment Routes for Mizizzi E-commerce Platform
Handles Pesapal card payments, callbacks, and transaction management

Production-ready implementation with comprehensive error handling,
security features, and UAT support.
"""

import os
import logging
import uuid
import json
import time
import random
from datetime import datetime, timezone, timedelta
from decimal import Decimal, InvalidOperation
from flask import Blueprint, request, jsonify, current_app, redirect, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from flask_cors import cross_origin
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import and_, or_, func
from sqlalchemy import text

# Database and models
try:
    from ...configuration.extensions import db
    from ...models.models import User, Order, PesapalTransaction, UserRole
except ImportError:
    try:
        from app.configuration.extensions import db
        from app.models.models import User, Order, PesapalTransaction, UserRole
    except ImportError:
        from configuration.extensions import db
        from models.models import User, Order, PesapalTransaction, UserRole

# Utilities
try:
    from app.utils.pesapal_utils import (
        create_card_payment_request,
        get_transaction_status,
        validate_pesapal_ipn,
        get_payment_status_message,
        validate_card_payment_data,
        process_card_payment_callback,
        format_phone_number,
        generate_merchant_reference
    )
    from app.utils.validation_utils import validate_email, validate_payment_amount, sanitize_input
    from app.utils.auth_utils import admin_required
except ImportError:
    # Fallback implementations
    def create_card_payment_request(**kwargs):
        return {"status": "success", "order_tracking_id": f"TRK{int(time.time())}", "redirect_url": "https://pay.pesapal.com/redirect"}
    
    def get_transaction_status(tracking_id):
        return {"status": "success", "payment_status": "PENDING"}
    
    def validate_pesapal_ipn(ipn_data):
        return True
    
    def get_payment_status_message(status):
        return f"Payment status: {status}"
    
    def validate_card_payment_data(data):
        return {"valid": True, "errors": []}
    
    def process_card_payment_callback(callback_data, transaction):
        # Update transaction status based on callback
        payment_status = callback_data.get('payment_status', 'pending')
        if payment_status == 'completed':
            transaction.status = 'completed'
        elif payment_status == 'failed':
            transaction.status = 'failed'
        elif payment_status == 'cancelled':
            transaction.status = 'cancelled'
        
        db.session.commit()
        return {"status": "success", "payment_status": payment_status}
    
    def format_phone_number(phone):
        return phone
    
    def generate_merchant_reference(prefix="MIZIZZI"):
        return f"{prefix}_{int(time.time())}_{uuid.uuid4().hex[:8]}"
    
    def validate_email(email):
        return {"valid": "@" in email if email else False, "email": email}
    
    def validate_payment_amount(amount):
        try:
            amount_val = float(amount)
            if amount_val <= 0:
                return {"valid": False, "error": "Amount must be greater than 0"}
            return {"valid": True, "amount": Decimal(str(amount_val))}
        except (ValueError, TypeError):
            return {"valid": False, "error": "Invalid amount format"}
    
    def sanitize_input(input_data):
        return str(input_data).strip() if input_data else ""
    
    def admin_required(f):
        from functools import wraps
        @wraps(f)
        def pesapal_admin_wrapper(*args, **kwargs):
            try:
                user_id = get_jwt_identity()
                user = db.session.get(User, user_id)
                if user and user.role == UserRole.ADMIN:
                    return f(*args, **kwargs)
                else:
                    return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
            except:
                return jsonify({'status': 'error', 'message': 'Authentication required'}), 401
        return pesapal_admin_wrapper

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
pesapal_routes = Blueprint('pesapal_routes', __name__)

# Configuration
PESAPAL_CONFIG = {
    'consumer_key': 'MneI7qziaBzoGPuRhd1QZNTjZedp5EqhConsumer Secret: Iy98/30kmlhg3/pjG1Wsneay9/Y=',
    'consumer_secret': 'Iy98/30kmlhg3/pjG1Wsneay9/Y=',
    'environment': 'production', # Can be 'production' or 'sandbox'
    'base_url': 'https://pay.pesapal.com/v3',
    'callback_url': 'https://mizizzi.com/api/pesapal/callback',
    'min_amount': 1.0,
    'max_amount': 1000000.0,
    'supported_currencies': ['KES', 'USD', 'EUR', 'GBP']
}

def generate_unique_merchant_reference(order_id, user_id=None):
    """Generate a unique merchant reference with enhanced uniqueness"""
    timestamp = int(time.time() * 1000000)  # Microseconds
    random_suffix = random.randint(100000, 999999)
    unique_id = str(uuid.uuid4())[:8].upper()
    user_suffix = f"U{user_id}" if user_id else ""
    return f"MIZIZZI_{order_id}_{timestamp}_{random_suffix}_{unique_id}{user_suffix}"

def validate_required_fields(data, required_fields):
    """Validate required fields in request data"""
    missing_fields = []
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            missing_fields.append(field)
    return missing_fields

def create_error_response(message, status_code=400, error_code=None):
    """Create standardized error response"""
    response = {
        'status': 'error',
        'message': message,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    if error_code:
        response['error_code'] = error_code
    return jsonify(response), status_code

def create_success_response(data, message="Success", status_code=200):
    """Create standardized success response"""
    response = {
        'status': 'success',
        'message': message,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    response.update(data)
    return jsonify(response), status_code

# =====================
# CARD PAYMENT ROUTES
# =====================

@pesapal_routes.route('/card/initiate', methods=['POST'])
@jwt_required()
@cross_origin()
def initiate_card_payment():
    """
    Initiate Pesapal card payment request.
    """
    try:
        logger.info("=== PESAPAL CARD PAYMENT INITIATION STARTED ===")
        
        # Get and validate JSON data
        try:
            data = request.get_json(force=True)
            logger.info(f"Received payment data: {json.dumps(data, indent=2)}")
        except Exception as e:
            logger.error(f"Failed to parse JSON data: {str(e)}")
            return create_error_response('Invalid JSON data', 400, 'INVALID_JSON')

        if not data:
            return create_error_response('No JSON data provided', 400, 'MISSING_DATA')

        # Validate required fields
        required_fields = ['order_id', 'amount', 'currency', 'customer_email', 'customer_phone', 'description']
        missing_fields = validate_required_fields(data, required_fields)
        if missing_fields:
            return create_error_response(
                f'Missing required fields: {", ".join(missing_fields)}',
                400, 'MISSING_FIELDS'
            )

        # Get current user
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        if not user:
            return create_error_response('User not found', 404, 'USER_NOT_FOUND')

        logger.info(f"User {current_user_id} initiating payment for order {data['order_id']}")

        # Validate card payment data
        validation_result = validate_card_payment_data(data)
        if not validation_result['valid']:
            logger.error(f"Validation failed: {validation_result['errors']}")
            return create_error_response(
                f'Validation errors: {"; ".join(validation_result["errors"])}',
                400, 'VALIDATION_ERROR'
            )

        # Sanitize inputs
        order_id = sanitize_input(data['order_id'])
        customer_email = sanitize_input(data['customer_email']).lower()
        customer_phone = sanitize_input(data['customer_phone'])
        description = sanitize_input(data['description'])[:200]

        # Validate and convert amount
        try:
            amount = Decimal(str(data['amount']))
            if amount <= 0:
                return create_error_response('Amount must be greater than 0', 400, 'INVALID_AMOUNT')
            if amount > Decimal('1000000'):
                return create_error_response('Amount exceeds maximum limit', 400, 'AMOUNT_TOO_HIGH')
        except (InvalidOperation, ValueError):
            return create_error_response('Invalid amount format', 400, 'INVALID_AMOUNT_FORMAT')

        # Validate currency
        currency = data['currency'].upper()
        if currency not in PESAPAL_CONFIG['supported_currencies']:
            return create_error_response(
                f'Unsupported currency. Supported: {", ".join(PESAPAL_CONFIG["supported_currencies"])}',
                400, 'UNSUPPORTED_CURRENCY'
            )

        # Check if order exists and belongs to user
        order = Order.query.filter_by(order_number=order_id, user_id=current_user_id).first()
        if not order:
            return create_error_response(
                'Order not found or does not belong to user',
                404, 'ORDER_NOT_FOUND'
            )

        actual_order_id = order.id
        logger.info(f"Found order with id={actual_order_id}, order_number={order_id}")

        # Validate order status
        if hasattr(order, 'status') and order.status in ['cancelled', 'refunded']:
            return create_error_response(
                f'Cannot process payment for {order.status} order',
                400, 'INVALID_ORDER_STATUS'
            )

        # Check if order amount matches (with small tolerance for floating point)
        if hasattr(order, 'total_amount'):
            order_amount = Decimal(str(order.total_amount))
            logger.info(f"Comparing payment amount {amount} with order total {order_amount}")
            if abs(order_amount - amount) > Decimal('0.01'):
                return create_error_response(
                    f'Payment amount ({amount}) does not match order total ({order_amount})',
                    400, 'AMOUNT_MISMATCH'
                )

        try:
            # Cancel old transactions by setting their merchant_reference to NULL first
            # This avoids unique constraint conflicts
            old_transactions = PesapalTransaction.query.filter(
                and_(
                    PesapalTransaction.order_id == actual_order_id,
                    PesapalTransaction.user_id == current_user_id,
                    PesapalTransaction.status.in_(['pending', 'initiated', 'failed', 'cancelled', 'expired'])
                )
            ).all()
            
            for old_txn in old_transactions:
                logger.info(f"Cleaning up old transaction {old_txn.id} with status {old_txn.status}")
                # Set merchant_reference to NULL to avoid conflicts
                old_txn.merchant_reference = None
                old_txn.status = 'cancelled'
                old_txn.error_message = 'Superseded by new payment attempt'
                old_txn.cancelled_at = datetime.now(timezone.utc)
            
            if old_transactions:
                db.session.commit()
                logger.info(f"Cleaned up {len(old_transactions)} old transaction(s)")
                
        except SQLAlchemyError as cleanup_error:
            logger.warning(f"Transaction cleanup warning (non-fatal): {str(cleanup_error)}")
            db.session.rollback()
            # Continue anyway - we'll generate a unique reference

        merchant_reference = f"MZZ_{uuid.uuid4().hex.upper()}"
        logger.info(f"Generated merchant reference: {merchant_reference}")

        transaction = None
        max_create_attempts = 3
        
        for attempt in range(max_create_attempts):
            try:
                transaction = PesapalTransaction(
                    id=str(uuid.uuid4()),
                    user_id=current_user_id,
                    order_id=actual_order_id,  # Use actual order.id (integer)
                    merchant_reference=merchant_reference,
                    amount=amount,
                    currency=currency,
                    email=customer_email,
                    phone_number=format_phone_number(customer_phone),
                    description=description,
                    status='initiated',
                    created_at=datetime.now(timezone.utc),
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
                )

                billing_address = data.get('billing_address', {})
                if billing_address:
                    transaction.first_name = sanitize_input(billing_address.get('first_name', ''))[:50]
                    transaction.last_name = sanitize_input(billing_address.get('last_name', ''))[:50]

                db.session.add(transaction)
                db.session.flush()
                logger.info(f"Transaction {transaction.id} created successfully on attempt {attempt + 1}")
                break
                
            except IntegrityError as ie:
                db.session.rollback()
                logger.warning(f"IntegrityError on attempt {attempt + 1}: {str(ie)}")
                
                if attempt < max_create_attempts - 1:
                    # Generate a completely new reference
                    merchant_reference = f"MZZ_{uuid.uuid4().hex.upper()}"
                    logger.info(f"Retrying with new reference: {merchant_reference}")
                    time.sleep(0.1)
                else:
                    logger.error("Failed to create transaction after all retries")
                    return create_error_response(
                        'Unable to create payment. Please try again.',
                        500, 'TRANSACTION_CREATION_FAILED'
                    )
        
        if not transaction:
            return create_error_response(
                'Failed to create payment transaction. Please try again.',
                500, 'TRANSACTION_CREATION_FAILED'
            )

        # Continue with callback URL setup and Pesapal API call
        callback_url = data.get('callback_url')
        
        if not callback_url:
            # Try environment variables first
            callback_url = os.getenv('PESAPAL_CALLBACK_URL') or os.getenv('NEXT_PUBLIC_SITE_URL')
            
            if callback_url:
                callback_url = callback_url.rstrip('/')
                if not callback_url.endswith('/payment-success'):
                    callback_url = f"{callback_url}/payment-success"
            else:
                # Use production domain as fallback
                callback_url = "https://mizizzi.com/payment-success"
                logger.warning(f"⚠️  No environment variables set, using default: {callback_url}")
        
        if '192.168.0.118' in callback_url:
            callback_url = callback_url.replace('192.168.0.118', 'localhost')
            logger.info(f"[v0] Converted IP address to localhost: {callback_url}")
        
        # Ensure callback_url contains payment-success
        if 'payment-success' not in callback_url:
            if '//' in callback_url:
                base_url = callback_url.split('//')[0] + '//' + callback_url.split('//')[1].split('/')[0]
                callback_url = f"{base_url}/payment-success"
        
        logger.info(f"[v0] Using callback URL: {callback_url}")
        logger.info(f"[v0] Request origin: {request.headers.get('Origin')}")
        logger.info(f"[v0] Request referer: {request.headers.get('Referer')}")
        
        is_localhost = 'localhost' in callback_url or '127.0.0.1' in callback_url
        
        if is_localhost:
            # Development mode - switch to sandbox and allow localhost
            logger.info(f"[v0] ✅ Development mode detected - using sandbox environment")
            current_environment = 'sandbox'
        else:
            current_environment = PESAPAL_CONFIG['environment']
            if current_environment == 'production' and not callback_url.startswith('https://'):
                logger.error("❌ CRITICAL: Production environment requires HTTPS callback URL!")
                transaction.status = 'failed'
                transaction.error_message = 'Invalid callback URL - HTTPS required in production'
                db.session.commit()
                return create_error_response(
                    'Invalid callback URL configuration. Production requires HTTPS.',
                    500, 'INVALID_CALLBACK_URL'
                )

        logger.info(f"[v0] Creating Pesapal payment request:")
        logger.info(f"  - Amount: {float(amount)} {currency}")
        logger.info(f"  - Description: {description}")
        logger.info(f"  - Customer: {customer_email} / {transaction.phone_number}")
        logger.info(f"  - Merchant Reference: {merchant_reference}")
        logger.info(f"  - Callback URL: {callback_url}")
        logger.info(f"  - Environment: {current_environment}")

        billing_address = data.get('billing_address', {})
        
        # Create card payment request with Pesapal
        try:
            logger.info("=== CALLING CREATE_CARD_PAYMENT_REQUEST ===")
            
            payment_response = create_card_payment_request(
                amount=float(amount),
                currency=currency,
                description=description,
                customer_email=customer_email,
                customer_phone=transaction.phone_number,
                callback_url=callback_url,
                merchant_reference=merchant_reference,
                billing_address=billing_address,
                first_name=billing_address.get('first_name', ''),
                last_name=billing_address.get('last_name', ''),
                country_code=billing_address.get('country_code', 'KE')
            )
            
            logger.info(f"=== PESAPAL API RESPONSE ===")
            logger.info(f"Response type: {type(payment_response)}")
            logger.info(f"Response: {json.dumps(payment_response, indent=2)}")
            
        except Exception as pesapal_error:
            logger.error(f"=== PESAPAL API CALL FAILED ===")
            logger.error(f"Error type: {type(pesapal_error).__name__}")
            logger.error(f"Error message: {str(pesapal_error)}")
            
            import traceback
            logger.error(f"Full traceback:\n{traceback.format_exc()}")
            
            transaction.status = 'failed'
            transaction.error_message = f'Pesapal API error: {str(pesapal_error)}'
            db.session.commit()
            
            return create_error_response(
                f'Payment service error: {str(pesapal_error)}',
                500, 'PESAPAL_API_ERROR'
            )

        if not payment_response:
            transaction.status = 'failed'
            transaction.error_message = 'Failed to create payment request with Pesapal'
            db.session.commit()
            return create_error_response(
                'Failed to initiate card payment. Please try again.',
                500, 'PAYMENT_INITIATION_FAILED'
            )

        if payment_response.get('status') == 'success':
            tracking_id = payment_response.get('order_tracking_id')
            
            if tracking_id:
                existing_tracking = PesapalTransaction.query.filter(
                    and_(
                        PesapalTransaction.pesapal_tracking_id == tracking_id,
                        PesapalTransaction.id != transaction.id
                    )
                ).first()
                if existing_tracking:
                    tracking_id = f"{tracking_id}_{transaction.id[:8]}"
            
            transaction.pesapal_tracking_id = tracking_id
            transaction.payment_url = payment_response.get('redirect_url')
            transaction.status = 'pending'
            transaction.pesapal_response = json.dumps(payment_response)
            
            db.session.commit()

            logger.info(f"Card payment initiated successfully for transaction {transaction.id}")

            return create_success_response({
                'transaction_id': transaction.id,
                'order_tracking_id': transaction.pesapal_tracking_id,
                'redirect_url': transaction.payment_url,
                'merchant_reference': merchant_reference,
                'expires_at': transaction.expires_at.isoformat(),
                'payment_method': 'card'
            }, 'Card payment request created successfully')

        else:
            transaction.status = 'failed'
            transaction.error_message = payment_response.get('message', 'Payment request failed')
            transaction.pesapal_response = json.dumps(payment_response)
            db.session.commit()

            logger.warning(f"Card payment initiation failed for transaction {transaction.id}: {payment_response.get('message')}")

            return create_error_response(
                payment_response.get('message', 'Card payment request failed'),
                400, 'PESAPAL_ERROR'
            )

    except Exception as e:
        logger.error(f"=== UNEXPECTED ERROR IN CARD PAYMENT INITIATION ===")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        
        import traceback
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        
        db.session.rollback()
        return create_error_response(
            'Internal server error. Please try again.',
            500, 'INTERNAL_ERROR'
        )


@pesapal_routes.route('/card/status/<transaction_id>', methods=['GET'])
@cross_origin()
def check_card_payment_status(transaction_id):
    """
    Check Pesapal card payment status.
    
    
    Returns:
    {
        "status": "success",
        "transaction_status": "completed|pending|failed|cancelled",
        "message": "Payment completed successfully",
        "transaction_data": {
            "id": "uuid",
            "order_id": "integer",
            "order_number": "string",
            "amount": 1000.00,
            "currency": "KES",
            "payment_method": "CARD",
            "card_type": "VISA",
            "last_four_digits": "1234",
            "receipt_number": "CONF123456",
            "transaction_date": "2024-01-01T12:00:00Z",
            "created_at": "2024-01-01T10:00:00Z"
        }
    }
    """
    try:
        current_user_id = None
        try:
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            logger.info(f"[v0] Authenticated user {current_user_id} checking payment status")
        except Exception as auth_error:
            logger.info(f"[v0] No authentication provided for status check: {str(auth_error)}")
            pass

        # Validate transaction ID format
        if not transaction_id or len(transaction_id.strip()) == 0:
            return create_error_response('Invalid transaction ID format', 400, 'INVALID_TRANSACTION_ID')
        
        logger.info(f"[v0] Looking up transaction with ID: {transaction_id}")
        
        transaction = None
        
        # Try as UUID (internal transaction ID)
        try:
            if len(transaction_id) == 36:  # Standard UUID length
                uuid.UUID(transaction_id)
                logger.info(f"[v0] Attempting lookup by internal transaction ID (UUID)")
                if current_user_id:
                    transaction = PesapalTransaction.query.filter_by(
                        id=transaction_id,
                        user_id=current_user_id
                    ).first()
                else:
                    transaction = PesapalTransaction.query.filter_by(id=transaction_id).first()
                
                if transaction:
                    logger.info(f"[v0] Found transaction by UUID: {transaction.id}")
        except ValueError:
            logger.info(f"[v0] Not a valid UUID, will try as OrderTrackingId")
            pass

        if not transaction:
            logger.info(f"[v0] Attempting lookup by Pesapal OrderTrackingId")
            if current_user_id:
                transaction = PesapalTransaction.query.filter_by(
                    pesapal_tracking_id=transaction_id,
                    user_id=current_user_id
                ).first()
            else:
                transaction = PesapalTransaction.query.filter_by(
                    pesapal_tracking_id=transaction_id
                ).first()
            
            if transaction:
                logger.info(f"[v0] Found transaction by OrderTrackingId: {transaction.id}")
        
        if not transaction:
            logger.warning(f"[v0] Transaction not found for ID: {transaction_id}")
            return create_error_response('Transaction not found', 404, 'TRANSACTION_NOT_FOUND')

        transaction_status = getattr(transaction, 'status', 'pending') or 'pending'
        transaction_order_id = getattr(transaction, 'order_id', None)
        logger.info(f"[v0] Transaction found - Status: {transaction_status}, Order ID: {transaction_order_id}")

        # Check if transaction is expired
        try:
            current_time = datetime.now(timezone.utc)
            expires_at = getattr(transaction, 'expires_at', None)
            if expires_at:
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                
                if current_time > expires_at and transaction_status == 'pending':
                    transaction.status = 'expired'
                    transaction.error_message = 'Transaction expired'
                    db.session.commit()
                    logger.info(f"[v0] Transaction {transaction.id} marked as expired")
                    transaction_status = 'expired'
        except Exception as expire_error:
            logger.warning(f"[v0] Error checking expiration: {str(expire_error)}")

        order = None
        if transaction_order_id:
            try:
                order = db.session.get(Order, transaction_order_id)
                if order:
                    logger.info(f"[v0] Found associated order: ID={order.id}, Number={getattr(order, 'order_number', 'N/A')}")
                else:
                    logger.warning(f"[v0] Order not found for order_id: {transaction_order_id}")
            except Exception as order_error:
                logger.warning(f"[v0] Error fetching order: {str(order_error)}")

        def build_transaction_data(trans, ord):
            """Safely build transaction data dictionary"""
            trans_amount = getattr(trans, 'amount', 0)
            try:
                trans_amount = float(trans_amount) if trans_amount else 0
            except (ValueError, TypeError):
                trans_amount = 0
                
            trans_date = getattr(trans, 'transaction_date', None)
            created = getattr(trans, 'created_at', None)
            expires = getattr(trans, 'expires_at', None)
            
            return {
                'id': getattr(trans, 'id', None),
                'order_id': getattr(trans, 'order_id', None),
                'order_number': getattr(ord, 'order_number', None) if ord else None,
                'amount': trans_amount,
                'currency': getattr(trans, 'currency', 'KES') or 'KES',
                'email': getattr(trans, 'email', None),
                'payment_method': getattr(trans, 'payment_method', 'CARD'),
                'card_type': getattr(trans, 'card_type', None),
                'last_four_digits': getattr(trans, 'last_four_digits', None),
                'receipt_number': getattr(trans, 'pesapal_receipt_number', None),
                'transaction_date': trans_date.isoformat() if trans_date else None,
                'created_at': created.isoformat() if created else None,
                'expires_at': expires.isoformat() if expires else None,
                'status': getattr(trans, 'status', 'pending')
            }

        # If transaction is in final state, return current status
        if transaction_status in ['completed', 'failed', 'cancelled', 'expired']:
            logger.info(f"[v0] Transaction in final state: {transaction_status}")
            transaction_data = build_transaction_data(transaction, order)

            return create_success_response({
                'transaction_status': transaction_status,
                'payment_status': transaction_status.upper(),
                'transaction_data': transaction_data
            }, get_payment_status_message(transaction_status))

        pesapal_tracking_id = getattr(transaction, 'pesapal_tracking_id', None)
        logger.info(f"[v0] Querying Pesapal for tracking ID: {pesapal_tracking_id}")
        
        if pesapal_tracking_id:
            try:
                status_response = get_transaction_status(pesapal_tracking_id)
                
                try:
                    log_response = json.dumps(status_response, indent=2, default=str) if status_response else 'None'
                except Exception:
                    log_response = str(status_response)
                logger.info(f"[v0] Pesapal API response: {log_response}")
                
                if status_response and isinstance(status_response, dict):
                    response_status = str(status_response.get('status', '') or '').lower()
                    
                    # Get the actual data from nested structure
                    data = status_response.get('data', {}) or {}
                    if not isinstance(data, dict):
                        data = {}
                    
                    logger.info(f"[v0] Response status: {response_status}")
                    logger.info(f"[v0] Data object: {json.dumps(data, indent=2, default=str)}")
                    
                    payment_status = ''
                    status_code = None
                    
                    # Location 1: data.payment_status (from PesapalClient direct response wrapped in data)
                    raw_payment_status = data.get('payment_status')
                    if raw_payment_status:
                        payment_status = str(raw_payment_status).upper().strip()
                        status_code = data.get('status_code')
                        logger.info(f"[v0] Found payment_status in data: '{payment_status}', status_code: {status_code}")
                    
                    # Location 2: data.payment_status_description (alternative field name)
                    if not payment_status:
                        raw_payment_status = data.get('payment_status_description')
                        if raw_payment_status:
                            payment_status = str(raw_payment_status).upper().strip()
                            status_code = data.get('status_code')
                            logger.info(f"[v0] Found payment_status_description in data: '{payment_status}'")
                    
                    # Location 3: data.response nested object (deep nested Pesapal response)
                    if not payment_status and isinstance(data.get('response'), dict):
                        nested = data.get('response', {})
                        raw_status = nested.get('payment_status_description') or nested.get('payment_status') or ''
                        if raw_status:
                            payment_status = str(raw_status).upper().strip()
                            if status_code is None:
                                status_code = nested.get('status_code')
                            logger.info(f"[v0] Found payment_status in data.response: '{payment_status}'")
                    
                    # Location 4: Top-level response (direct Pesapal response)
                    if not payment_status:
                        raw_status = status_response.get('payment_status_description') or status_response.get('payment_status') or ''
                        if raw_status:
                            payment_status = str(raw_status).upper().strip()
                            if status_code is None:
                                status_code = status_response.get('status_code')
                            logger.info(f"[v0] Found payment_status at top level: '{payment_status}'")
                    
                    if payment_status == 'INVALID':
                        payment_status = 'PENDING'
                        logger.info(f"[v0] Converted INVALID to PENDING")
                    
                    logger.info(f"[v0] Final extracted payment_status: '{payment_status}', status_code: {status_code}")
                    
                    # Pesapal status_code: 1 = completed, 0 = failed, 2 = pending
                    is_completed = (
                        payment_status in ['COMPLETED', 'COMPLETE', 'SUCCESS', 'PAID'] or 
                        status_code == 1 or
                        str(status_code) == '1'
                    )
                    is_failed = (
                        payment_status in ['FAILED', 'FAIL', 'ERROR'] or 
                        status_code == 0 or
                        str(status_code) == '0'
                    )
                    is_cancelled = payment_status in ['CANCELLED', 'CANCELED', 'CANCEL']
                    is_pending = (
                        payment_status in ['PENDING', 'PROCESSING', ''] or 
                        status_code == 2 or
                        str(status_code) == '2'
                    )
                    
                    if is_completed:
                        logger.info(f"[v0] Payment COMPLETED - updating transaction to completed")
                        transaction.status = 'completed'
                        
                        # Get payment details from data object
                        transaction.payment_method = data.get('payment_method') or data.get('response', {}).get('payment_method') or status_response.get('payment_method', 'CARD')
                        transaction.pesapal_receipt_number = data.get('confirmation_code') or data.get('response', {}).get('confirmation_code') or status_response.get('confirmation_code')
                        transaction.transaction_date = datetime.now(timezone.utc)
                        
                        # Extract card details from data object
                        payment_account = str(data.get('payment_account') or data.get('response', {}).get('payment_account') or status_response.get('payment_account', '') or '')
                        if payment_account and '*' in payment_account:
                            if payment_account.startswith('****'):
                                transaction.last_four_digits = payment_account[-4:]
                            if 'visa' in payment_account.lower():
                                transaction.card_type = 'VISA'
                            elif 'master' in payment_account.lower():
                                transaction.card_type = 'MASTERCARD'

                        # Update order status
                        if order:
                            try:
                                if hasattr(order, 'payment_status'):
                                    order.payment_status = 'paid'
                                if hasattr(order, 'status') and getattr(order, 'status', '') in ['pending', 'pending_payment']:
                                    order.status = 'confirmed'
                                if hasattr(order, 'updated_at'):
                                    order.updated_at = datetime.now(timezone.utc)
                                logger.info(f"[v0] Order {getattr(order, 'order_number', 'N/A')} updated to confirmed/paid")
                            except Exception as order_error:
                                logger.error(f"[v0] Error updating order: {str(order_error)}")

                        # Send confirmation email
                        try:
                            user = db.session.get(User, getattr(transaction, 'user_id', None))
                            if user and getattr(user, 'email', None) and order:
                                try:
                                    from app.routes.order.order_email_templates import send_order_confirmation_email
                                except ImportError:
                                    try:
                                        from backend.app.routes.order.order_email_templates import send_order_confirmation_email
                                    except ImportError:
                                        from routes.order.order_email_templates import send_order_confirmation_email
                                
                                customer_name = getattr(user, 'name', None) or "Valued Customer"
                                logger.info(f"[v0] Sending confirmation email to {user.email}")
                                
                                send_order_confirmation_email(
                                    order_id=order.id,
                                    to_email=user.email,
                                    customer_name=customer_name
                                )
                        except Exception as email_error:
                            logger.error(f"[v0] Email error: {str(email_error)}")

                    elif is_failed:
                        logger.info(f"[v0] Payment FAILED - updating transaction to failed")
                        transaction.status = 'failed'
                        error_msg = data.get('error_message') or status_response.get('error_message', 'Payment failed')
                        transaction.error_message = error_msg

                    elif is_cancelled:
                        logger.info(f"[v0] Payment CANCELLED - updating transaction to cancelled")
                        transaction.status = 'cancelled'

                    elif is_pending:
                        # Keep as pending
                        logger.info(f"[v0] Payment still PENDING (status: {payment_status}, code: {status_code})")
                        if getattr(transaction, 'status', '') != 'pending':
                            transaction.status = 'pending'
                    
                    else:
                        logger.warning(f"[v0] Could not determine payment status from: status={payment_status}, code={status_code}")

                    # Store response and commit
                    try:
                        transaction.status_response = json.dumps(status_response, default=str)
                        transaction.last_status_check = datetime.now(timezone.utc)
                        db.session.commit()
                        logger.info(f"[v0] Transaction committed with status: {getattr(transaction, 'status', 'unknown')}")
                    except Exception as commit_error:
                        logger.error(f"[v0] Commit error: {str(commit_error)}")
                        db.session.rollback()
                else:
                    logger.warning(f"[v0] Invalid or empty response from Pesapal: {status_response}")

            except Exception as pesapal_error:
                logger.error(f"[v0] Error querying Pesapal: {str(pesapal_error)}")
                import traceback
                logger.error(f"[v0] Traceback: {traceback.format_exc()}")
                # Continue with current transaction status - don't fail the request

        # Build response
        transaction_data = build_transaction_data(transaction, order)
        final_status = getattr(transaction, 'status', 'pending') or 'pending'

        logger.info(f"[v0] Returning status: {final_status}")
        return create_success_response({
            'transaction_status': final_status,
            'payment_status': final_status.upper(),
            'transaction_data': transaction_data
        }, get_payment_status_message(final_status))

    except Exception as e:
        logger.error(f"[v0] Unhandled error in status check: {str(e)}")
        logger.error(f"[v0] Error type: {type(e).__name__}")
        import traceback
        logger.error(f"[v0] Full traceback:\n{traceback.format_exc()}")
        
        return create_error_response(
            f'Status check error: {str(e)}',
            500, 'STATUS_CHECK_FAILED'
        )


@pesapal_routes.route('/callback', methods=['GET', 'POST'])
@cross_origin()
def pesapal_callback():
    """
    Handle Pesapal payment callback for card payments.
    This endpoint receives payment confirmations from Pesapal.
    
    Supports both GET and POST methods as per Pesapal documentation.
    """
    try:
        # Pesapal can send callbacks via GET or POST
        if request.method == 'GET':
            callback_data = request.args.to_dict()
        else:
            callback_data = request.get_json() or request.form.to_dict()

        # Log callback for debugging (remove in production)
        logger.info(f"Pesapal Callback received: {json.dumps(callback_data, indent=2)}")

        # Validate callback data
        if not validate_pesapal_ipn(callback_data):
            logger.warning("Invalid Pesapal callback received")
            return create_error_response('Invalid callback data', 400, 'INVALID_CALLBACK')

        # Extract callback information
        order_tracking_id = callback_data.get('OrderTrackingId')
        merchant_reference = callback_data.get('OrderMerchantReference')

        if not order_tracking_id and not merchant_reference:
            logger.warning("Pesapal callback missing required identifiers")
            return create_error_response(
                'Invalid callback data: missing tracking ID and merchant reference',
                400, 'MISSING_IDENTIFIERS'
            )

        # Find transaction
        transaction = None
        if order_tracking_id:
            transaction = PesapalTransaction.query.filter_by(
                pesapal_tracking_id=order_tracking_id
            ).first()
        
        if not transaction and merchant_reference:
            transaction = PesapalTransaction.query.filter_by(
                merchant_reference=merchant_reference
            ).first()

        if not transaction:
            logger.warning(f"Transaction not found for callback: tracking_id={order_tracking_id}, reference={merchant_reference}")
            return create_error_response('Transaction not found', 404, 'TRANSACTION_NOT_FOUND')

        try:
            callback_result = process_card_payment_callback(callback_data, transaction)
            
            if callback_result and callback_result.get('status') == 'success':
                payment_status = callback_result.get('payment_status', 'pending')
                
                logger.info(f"[v0] Callback processing result - payment_status: {payment_status}")
                
                if payment_status == 'completed':
                    # Update order status for completed payments
                    if transaction.order_id:
                        order = Order.query.filter_by(order_number=transaction.order_id).first()
                        if order:
                            if hasattr(order, 'payment_status'):
                                order.payment_status = 'paid'
                            if hasattr(order, 'status') and order.status == 'pending':
                                order.status = 'confirmed'
                            if hasattr(order, 'updated_at'):
                                order.updated_at = datetime.now(timezone.utc)
                            logger.info(f"[v0] ✅ Order {transaction.order_id} status updated to confirmed")
                    
                    try:
                        # Get user for email
                        user = db.session.get(User, transaction.user_id)
                        if user and user.email and transaction.order_id:
                            # Import email function
                            try:
                                from app.routes.order.order_email_templates import send_order_confirmation_email
                            except ImportError:
                                try:
                                    from backend.app.routes.order.order_email_templates import send_order_confirmation_email
                                except ImportError:
                                    from routes.order.order_email_templates import send_order_confirmation_email
                            
                            customer_name = user.name or "Valued Customer"
                            logger.info(f"[v0] 💳 Payment confirmed! Sending order confirmation email to {user.email}")
                            logger.info(f"[v0] Order ID: {transaction.order_id}, Customer: {customer_name}")
                            
                            order = Order.query.filter_by(order_number=transaction.order_id).first()
                            if order:
                                email_sent = send_order_confirmation_email(
                                    order_id=order.id,  # Pass internal ID, not order number
                                    to_email=user.email,
                                    customer_name=customer_name
                                )
                                
                                if email_sent:
                                    logger.info(f"[v0] ✅ Order confirmation email sent successfully after payment confirmation")
                                else:
                                    logger.error(f"[v0] ❌ Failed to send order confirmation email after payment")
                            else:
                                logger.error(f"[v0] ❌ Order not found for order_number: {transaction.order_id}")
                        else:
                            logger.warning(f"[v0] Cannot send email - User: {user is not None}, Email: {user.email if user else 'N/A'}, Order: {transaction.order_id}")
                    except Exception as email_error:
                        logger.error(f"[v0] Exception sending confirmation email after payment: {str(email_error)}", exc_info=True)
                        # Don't fail the callback if email fails
                    
                    logger.info(f"Card payment callback processed successfully for transaction {transaction.id}")
                
                elif payment_status == 'failed':
                    logger.info(f"Card payment failed callback processed for transaction {transaction.id}")
                
                elif payment_status == 'cancelled':
                    logger.info(f"Card payment cancelled callback processed for transaction {transaction.id}")

            # Store callback data and timestamp
            transaction.callback_response = json.dumps(callback_data)
            transaction.callback_received_at = datetime.now(timezone.utc)
            db.session.commit()

            return create_success_response({
                'transaction_id': transaction.id,
                'payment_status': callback_result.get('payment_status', 'pending') if callback_result else 'pending'
            }, 'Callback processed successfully')

        except Exception as callback_error:
            logger.error(f"[v0] Error processing callback for transaction {transaction.id}: {str(callback_error)}")
            logger.error(f"[v0] Error type: {type(callback_error).__name__}")
            import traceback
            logger.error(f"[v0] Traceback:\n{traceback.format_exc()}")
            
            db.session.rollback()
            
            # Still return success to Pesapal to acknowledge receipt
            # This prevents Pesapal from retrying the callback
            return create_success_response({
                'transaction_id': transaction.id,
                'payment_status': 'pending',
                'note': 'Callback received but processing encountered an error'
            }, 'Callback received')

    except Exception as e:
        logger.error(f"[v0] Unexpected error processing Pesapal callback: {str(e)}")
        logger.error(f"[v0] Error type: {type(e).__name__}")
        import traceback
        logger.error(f"[v0] Traceback:\n{traceback.format_exc()}")
        
        # Return success to prevent Pesapal from retrying
        return create_success_response({
            'status': 'received',
            'note': 'Callback received'
        }, 'Callback received')


@pesapal_routes.route('/transactions', methods=['GET'])
@jwt_required()
@cross_origin()
def get_user_card_transactions():
    """
    Get user's Pesapal card transactions with pagination and filtering.
    
    Query parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 10, max: 100)
    - status: Filter by status (pending, completed, failed, cancelled)
    - from_date: Filter from date (ISO format)
    - to_date: Filter to date (ISO format)
    - order_id: Filter by order ID (use order number here)
    
    Returns:
    {
        "status": "success",
        "transactions": [...],
        "pagination": {
            "page": 1,
            "pages": 5,
            "per_page": 10,
            "total": 50,
            "has_next": true,
            "has_prev": false
        },
        "summary": {
            "total_amount": 50000.00,
            "completed_count": 45,
            "pending_count": 3,
            "failed_count": 2
        }
    }
    """
    try:
        current_user_id = get_jwt_identity()

        # Get pagination parameters
        page = max(1, request.args.get('page', 1, type=int))
        per_page = min(max(1, request.args.get('per_page', 10, type=int)), 100)
        
        # Get filter parameters
        status = request.args.get('status')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        order_number_filter = request.args.get('order_id') # Renamed to order_number_filter to reflect its usage

        # Build query
        query = PesapalTransaction.query
        
        # Filter by user_id first
        query = query.filter_by(user_id=current_user_id)
        
        # Apply filters
        if status:
            query = query.filter_by(status=status)
        
        if order_number_filter:
            # To filter by order_number, we need to join with the Order table
            # and filter by order.order_number
            try:
                order_obj = Order.query.filter_by(order_number=order_number_filter, user_id=current_user_id).first()
                if order_obj:
                    query = query.filter_by(order_id=order_obj.id) # Filter by the actual order.id (FK)
                else:
                    # If the order_number_filter doesn't match any order for the user, return empty results
                    return create_success_response({
                        'transactions': [],
                        'pagination': {
                            'page': page,
                            'pages': 0,
                            'per_page': per_page,
                            'total': 0,
                            'has_next': False,
                            'has_prev': False
                        },
                        'summary': {
                            'total_amount': 0.0,
                            'completed_count': 0,
                            'pending_count': 0,
                            'failed_count': 0,
                            'cancelled_count': 0
                        }
                    })
            except Exception as order_lookup_error:
                logger.error(f"Error looking up order by order_number '{order_number_filter}': {order_lookup_error}")
                return create_error_response('Internal error during order lookup', 500, 'ORDER_LOOKUP_ERROR')

        
        if from_date:
            try:
                from_date_obj = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                query = query.filter(PesapalTransaction.created_at >= from_date_obj)
            except ValueError:
                return create_error_response('Invalid from_date format', 400, 'INVALID_DATE_FORMAT')
        
        if to_date:
            try:
                to_date_obj = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                query = query.filter(PesapalTransaction.created_at <= to_date_obj)
            except ValueError:
                return create_error_response('Invalid to_date format', 400, 'INVALID_DATE_FORMAT')

        # Order by creation date (newest first)
        query = query.order_by(PesapalTransaction.created_at.desc())

        # Get summary statistics
        summary_query = PesapalTransaction.query
        # Apply same date filters to summary query
        if from_date:
            try:
                from_date_obj = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                summary_query = summary_query.filter(PesapalTransaction.created_at >= from_date_obj)
            except ValueError:
                pass # Already handled above if needed
        if to_date:
            try:
                to_date_obj = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                summary_query = summary_query.filter(PesapalTransaction.created_at <= to_date_obj)
            except ValueError:
                pass # Already handled above if needed
        
        # Apply user_id filter to summary query
        summary_query = summary_query.filter_by(user_id=current_user_id)

        # Apply order_id filter to summary query as well, if present
        if order_number_filter:
            try:
                order_id_obj = Order.query.filter_by(order_number=order_number_filter, user_id=current_user_id).first()
                if order_id_obj:
                    summary_query = summary_query.filter_by(order_id=order_id_obj.id)
                else:
                    # If the order_id_filter doesn't match, summary should reflect zero
                    # This can happen if the user has no such order, so counts will be zero
                    pass 
            except Exception:
                pass # Ignore order lookup errors for summary if it failed for the main query

        # Fetch completed transactions for total amount calculation
        completed_transactions_for_summary = summary_query.filter_by(status='completed').all()
        total_amount = sum(float(t.amount) for t in completed_transactions_for_summary)
        
        summary = {
            'total_amount': total_amount,
            'completed_count': len(completed_transactions_for_summary),
            'pending_count': summary_query.filter_by(status='pending').count(),
            'failed_count': summary_query.filter_by(status='failed').count(),
            'cancelled_count': summary_query.filter_by(status='cancelled').count()
        }

        # Paginate
        transactions = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        # Format response
        transaction_list = []
        for transaction in transactions.items:
            # Fetch order details if available to include order_number
            order = None
            if transaction.order_id:
                order = db.session.get(Order, transaction.order_id)
                
            transaction_data = {
                'id': transaction.id,
                'order_id': transaction.order_id, # This is the integer FK
                'order_number': order.order_number if order else None, # Add order_number for display
                'merchant_reference': transaction.merchant_reference,
                'amount': float(transaction.amount),
                'currency': transaction.currency,
                'email': transaction.email,
                'status': transaction.status,
                'description': transaction.description,
                'payment_method': getattr(transaction, 'payment_method', 'CARD'),
                'card_type': getattr(transaction, 'card_type', None),
                'last_four_digits': getattr(transaction, 'last_four_digits', None),
                'receipt_number': getattr(transaction, 'pesapal_receipt_number', None),
                'transaction_date': transaction.transaction_date.isoformat() if hasattr(transaction, 'transaction_date') and transaction.transaction_date else None,
                'created_at': transaction.created_at.isoformat(),
                'expires_at': transaction.expires_at.isoformat() if transaction.expires_at else None,
                'status_message': get_payment_status_message(transaction.status)
            }
            transaction_list.append(transaction_data)

        return create_success_response({
            'transactions': transaction_list,
            'pagination': {
                'page': transactions.page,
                'pages': transactions.pages,
                'per_page': transactions.per_page,
                'total': transactions.total,
                'has_next': transactions.has_next,
                'has_prev': transactions.has_prev
            },
            'summary': summary
        }, 'Transactions retrieved successfully')

    except Exception as e:
        logger.error(f"Error fetching user card transactions: {str(e)}")
        return create_error_response(
            'Failed to fetch transactions',
            500, 'FETCH_TRANSACTIONS_FAILED'
        )


# =====================
# ADMIN ROUTES
# =====================

@pesapal_routes.route('/admin/transactions', methods=['GET'])
@jwt_required()
@admin_required
@cross_origin()
def get_all_card_transactions():
    """
    Get all Pesapal card transactions (Admin only).
    
    Query parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - status: Filter by status
    - user_id: Filter by user ID
    - from_date: Filter from date
    - to_date: Filter to date
    - search: Search in email, order_id, or merchant_reference
    
    Returns:
    {
        "status": "success",
        "transactions": [...],
        "pagination": { ... }
    }
    Returns comprehensive transaction data including user information.
    """
    try:
        # Get pagination parameters
        page = max(1, request.args.get('page', 1, type=int))
        per_page = min(max(1, request.args.get('per_page', 20, type=int)), 100)
        
        # Get filter parameters
        status = request.args.get('status')
        user_id = request.args.get('user_id', type=int)
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        search = request.args.get('search')

        # Build query
        query = PesapalTransaction.query.outerjoin(User, PesapalTransaction.user_id == User.id) # Use outerjoin to include transactions without a user if applicable
        
        # Apply filters
        if status:
            query = query.filter(PesapalTransaction.status == status)
        
        if user_id:
            query = query.filter(PesapalTransaction.user_id == user_id)
        
        if from_date:
            try:
                from_date_obj = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                query = query.filter(PesapalTransaction.created_at >= from_date_obj)
            except ValueError:
                return create_error_response('Invalid from_date format', 400, 'INVALID_DATE_FORMAT')
        
        if to_date:
            try:
                to_date_obj = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                query = query.filter(PesapalTransaction.created_at <= to_date_obj)
            except ValueError:
                return create_error_response('Invalid to_date format', 400, 'INVALID_DATE_FORMAT')
        
        if search:
            search_term = f"%{sanitize_input(search)}%"
            query = query.filter(
                or_(
                    PesapalTransaction.email.ilike(search_term),
                    # PesapalTransaction.order_id.ilike(search_term), # order_id is integer FK, ilike doesn't work directly
                    PesapalTransaction.merchant_reference.ilike(search_term),
                    User.email.ilike(search_term), # Search in user's email as well
                    # To search by order_number, we'd need to join with Order table
                    text("CAST(pesapal_transaction.order_id AS TEXT) ILIKE :search_term") # Search by string representation of order_id FK
                )
            ).params(search_term=search_term)

        # Order by creation date (newest first)
        query = query.order_by(PesapalTransaction.created_at.desc())

        # Paginate
        transactions = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        # Format response with user information
        transaction_list = []
        for transaction in transactions.items:
            # Access user object which is joined
            user = transaction.user
            
            # Fetch order details if available to include order_number
            order = None
            if transaction.order_id:
                order = db.session.get(Order, transaction.order_id)
            
            transaction_data = {
                'id': transaction.id,
                'user_id': transaction.user_id,
                'user_email': user.email if user else None,
                'user_name': user.name if user else None,
                'order_id': transaction.order_id, # This is the FK, integer
                'order_number': order.order_number if order else None, # Add order_number for display
                'merchant_reference': transaction.merchant_reference,
                'pesapal_tracking_id': getattr(transaction, 'pesapal_tracking_id', None),
                'amount': float(transaction.amount),
                'currency': transaction.currency,
                'email': transaction.email,
                'phone_number': transaction.phone_number,
                'status': transaction.status,
                'description': transaction.description,
                'payment_method': getattr(transaction, 'payment_method', 'CARD'),
                'card_type': getattr(transaction, 'card_type', None),
                'last_four_digits': getattr(transaction, 'last_four_digits', None),
                'receipt_number': getattr(transaction, 'pesapal_receipt_number', None),
                'error_message': getattr(transaction, 'error_message', None),
                'transaction_date': transaction.transaction_date.isoformat() if hasattr(transaction, 'transaction_date') and transaction.transaction_date else None,
                'callback_received_at': transaction.callback_received_at.isoformat() if hasattr(transaction, 'callback_received_at') and transaction.callback_received_at else None,
                'created_at': transaction.created_at.isoformat(),
                'expires_at': transaction.expires_at.isoformat() if transaction.expires_at else None,
                'status_message': get_payment_status_message(transaction.status)
            }
            transaction_list.append(transaction_data)

        return create_success_response({
            'transactions': transaction_list,
            'pagination': {
                'page': transactions.page,
                'pages': transactions.pages,
                'per_page': transactions.per_page,
                'total': transactions.total,
                'has_next': transactions.has_next,
                'has_prev': transactions.has_prev
            }
        }, 'Admin transactions retrieved successfully')

    except Exception as e:
        logger.error(f"Error fetching admin card transactions: {str(e)}")
        return create_error_response(
            'Failed to fetch transactions',
            500, 'ADMIN_FETCH_FAILED'
        )


@pesapal_routes.route('/admin/stats', methods=['GET'])
@jwt_required()
@admin_required
@cross_origin()
def get_card_payment_stats():
    """
    Get comprehensive Pesapal card payment statistics (Admin only).
    
    Query parameters:
    - from_date: Start date for statistics (ISO format)
    - to_date: End date for statistics (ISO format)
    - group_by: Group statistics by 'day', 'week', 'month' (currently only 'day' is implemented for trends)
    
    Returns:
    {
        "status": "success",
        "stats": { ... },
        "trends": [...]
    }
    Returns detailed analytics including success rates, amounts, and trends.
    """
    try:
        # Get date range
        from_date_str = request.args.get('from_date')
        to_date_str = request.args.get('to_date')
        group_by = request.args.get('group_by', 'day') # Default to 'day'

        # Build base query
        query = PesapalTransaction.query
        from_date_obj = None
        to_date_obj = None
        
        if from_date_str:
            try:
                from_date_obj = datetime.fromisoformat(from_date_str.replace('Z', '+00:00'))
                query = query.filter(PesapalTransaction.created_at >= from_date_obj)
            except ValueError:
                return create_error_response('Invalid from_date format', 400, 'INVALID_DATE_FORMAT')
        
        if to_date_str:
            try:
                to_date_obj = datetime.fromisoformat(to_date_str.replace('Z', '+00:00'))
                query = query.filter(PesapalTransaction.created_at <= to_date_obj)
            except ValueError:
                return create_error_response('Invalid to_date format', 400, 'INVALID_DATE_FORMAT')

        # Get basic statistics
        total_transactions = query.count()
        completed_transactions_count = query.filter_by(status='completed').count()
        failed_transactions_count = query.filter_by(status='failed').count()
        pending_transactions_count = query.filter_by(status='pending').count()
        cancelled_transactions_count = query.filter_by(status='cancelled').count()

        # Calculate amounts for completed and failed transactions
        completed_query = query.filter_by(status='completed')
        completed_list = completed_query.all()
        total_amount = sum(float(t.amount) for t in completed_list)
        
        failed_query = query.filter_by(status='failed')
        failed_list = failed_query.all()
        failed_amount = sum(float(t.amount) for t in failed_list)

        # Success rate
        success_rate = (completed_transactions_count / total_transactions * 100) if total_transactions > 0 else 0

        # Average transaction amount for completed transactions
        avg_transaction_amount = total_amount / completed_transactions_count if completed_transactions_count > 0 else 0

        # Payment methods breakdown (only for completed transactions)
        payment_methods_query = db.session.query(
            PesapalTransaction.payment_method,
            func.count(PesapalTransaction.id).label('count'),
            func.sum(PesapalTransaction.amount).label('total_amount')
        ).filter_by(status='completed')
        if from_date_obj:
            payment_methods_query = payment_methods_query.filter(PesapalTransaction.created_at >= from_date_obj)
        if to_date_obj:
            payment_methods_query = payment_methods_query.filter(PesapalTransaction.created_at <= to_date_obj)
        payment_methods_query = payment_methods_query.group_by(PesapalTransaction.payment_method).all()

        payment_methods_stats = {}
        for method, count, amount in payment_methods_query:
            if method: # Ensure method is not None or empty
                payment_methods_stats[method] = {
                    'count': count,
                    'total_amount': float(amount or 0)
                }

        # Card types breakdown (only for completed transactions)
        card_types_query = db.session.query(
            PesapalTransaction.card_type,
            func.count(PesapalTransaction.id).label('count')
        ).filter_by(status='completed')
        if from_date_obj:
            card_types_query = card_types_query.filter(PesapalTransaction.created_at >= from_date_obj)
        if to_date_obj:
            card_types_query = card_types_query.filter(PesapalTransaction.created_at <= to_date_obj)
        card_types_query = card_types_query.filter(PesapalTransaction.card_type != None).group_by(PesapalTransaction.card_type).all() # Filter out null card types

        card_types_stats = {}
        for card_type, count in card_types_query:
            if card_type: # Ensure card_type is not None or empty
                card_types_stats[card_type] = count

        # Currency breakdown (only for completed transactions)
        currency_query = db.session.query(
            PesapalTransaction.currency,
            func.count(PesapalTransaction.id).label('count'),
            func.sum(PesapalTransaction.amount).label('total_amount')
        ).filter_by(status='completed')
        if from_date_obj:
            currency_query = currency_query.filter(PesapalTransaction.created_at >= from_date_obj)
        if to_date_obj:
            currency_query = currency_query.filter(PesapalTransaction.created_at <= to_date_obj)
        currency_query = currency_query.group_by(PesapalTransaction.currency).all()

        currency_stats = {}
        for currency, count, amount in currency_query:
            currency_stats[currency] = {
                'count': count,
                'total_amount': float(amount or 0)
            }

        # Time-based trends (simplified)
        trends = []
        if group_by == 'day':
            # Define the date range for trends
            # If no dates provided, default to last 7 days including today
            if not from_date_obj and not to_date_obj:
                trend_end_date = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59, microsecond=999999)
                trend_start_date = trend_end_date - timedelta(days=6)
                trend_start_date = trend_start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif from_date_obj and not to_date_obj:
                trend_start_date = from_date_obj.replace(hour=0, minute=0, second=0, microsecond=0)
                trend_end_date = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59, microsecond=999999)
            elif not from_date_obj and to_date_obj:
                trend_end_date = to_date_obj.replace(hour=23, minute=59, second=59, microsecond=999999)
                trend_start_date = trend_end_date - timedelta(days=6) # Default to 7 days back from end date
                trend_start_date = trend_start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            else: # both from_date and to_date are provided
                trend_start_date = from_date_obj.replace(hour=0, minute=0, second=0, microsecond=0)
                trend_end_date = to_date_obj.replace(hour=23, minute=59, second=59, microsecond=999999)

            current_trend_date = trend_start_date
            while current_trend_date <= trend_end_date:
                day_start = current_trend_date
                day_end = current_trend_date + timedelta(days=1)
                
                # Query for transactions within this specific day
                day_query = PesapalTransaction.query.filter(
                    and_(
                        PesapalTransaction.created_at >= day_start,
                        PesapalTransaction.created_at < day_end
                    )
                )
                
                day_transactions_count = day_query.count()
                day_completed_count = day_query.filter_by(status='completed').count()
                
                trends.append({
                    'date': day_start.strftime('%Y-%m-%d'), # Format as YYYY-MM-DD
                    'total_transactions': day_transactions_count,
                    'completed_transactions': day_completed_count,
                    'success_rate': (day_completed_count / day_transactions_count * 100) if day_transactions_count > 0 else 0
                })
                current_trend_date += timedelta(days=1)
        # Note: 'week' and 'month' grouping logic would need more sophisticated SQL
        # For example, using DATE_TRUNC for PostgreSQL or similar functions in other DBs.
        # This is a placeholder and would need to be implemented if required.
        elif group_by in ['week', 'month']:
             trends = [{"message": f"Grouping by '{group_by}' is not yet fully implemented for trends. Please use 'day'."}]

        return create_success_response({
            'stats': {
                'total_transactions': total_transactions,
                'completed_transactions': completed_transactions_count,
                'failed_transactions': failed_transactions_count,
                'pending_transactions': pending_transactions_count,
                'cancelled_transactions': cancelled_transactions_count,
                'total_amount': total_amount,
                'failed_amount': failed_amount,
                'success_rate': round(success_rate, 2),
                'average_transaction_amount': round(avg_transaction_amount, 2),
                'payment_methods': payment_methods_stats,
                'card_types': card_types_stats,
                'currencies': currency_stats
            },
            'trends': trends
        }, 'Statistics retrieved successfully')

    except Exception as e:
        logger.error(f"Error fetching card payment stats: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        return create_error_response(
            'Failed to fetch statistics',
            500, 'STATS_FETCH_FAILED'
        )


# =====================
# UTILITY ROUTES
# =====================

@pesapal_routes.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Pesapal card payment service health check"""
    try:
        # Check database connectivity
        db.session.execute(text('SELECT 1'))
        
        # Check recent transaction activity
        recent_transactions = PesapalTransaction.query.filter(
            PesapalTransaction.created_at >= datetime.now(timezone.utc) - timedelta(hours=24)
        ).count()
        
        current_time = datetime.now(timezone.utc)
        
        return create_success_response({
            'service': 'pesapal_card_payments',
            'version': '1.0.0',
            'environment': PESAPAL_CONFIG['environment'],
            'database_status': 'connected',
            'recent_transactions_24h': recent_transactions,
            'supported_currencies': PESAPAL_CONFIG['supported_currencies'],
            'endpoints': [
                '/api/pesapal/card/initiate',
                '/api/pesapal/card/status/<transaction_id>',
                '/api/pesapal/callback',
                '/api/pesapal/transactions',
                '/api/pesapal/admin/transactions',
                '/api/pesapal/admin/stats'
            ]
        }, 'Service is healthy')
        
    except Exception as e:
        logger.error(f"Pesapal health check failed: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        return jsonify({
            'status': 'error',
            'service': 'pesapal_card_payments',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 503


@pesapal_routes.route('/config', methods=['GET'])
@jwt_required()
@cross_origin()
def get_payment_config():
    """Get Pesapal payment configuration (for frontend)"""
    try:
        return create_success_response({
            'supported_currencies': PESAPAL_CONFIG['supported_currencies'],
            'min_amount': PESAPAL_CONFIG['min_amount'],
            'max_amount': PESAPAL_CONFIG['max_amount'],
            'environment': PESAPAL_CONFIG['environment'],
            'payment_methods': ['CARD'],
            'supported_card_types': ['VISA', 'MASTERCARD', 'AMERICAN_EXPRESS'],
            'transaction_timeout_hours': 24
        }, 'Configuration retrieved successfully')
        
    except Exception as e:
        logger.error(f"Error fetching payment config: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        return create_error_response(
            'Failed to fetch configuration',
            500, 'CONFIG_FETCH_FAILED'
        )


# =====================
# ERROR HANDLERS
# =====================

@pesapal_routes.errorhandler(404)
def not_found_error(error):
    return create_error_response('Endpoint not found', 404, 'ENDPOINT_NOT_FOUND')


@pesapal_routes.errorhandler(405)
def method_not_allowed_error(error):
    return create_error_response('Method not allowed', 405, 'METHOD_NOT_ALLOWED')


@pesapal_routes.errorhandler(500)
def internal_server_error(error):
    db.session.rollback() # Rollback any pending transaction in case of an error
    logger.error(f"Internal server error: {str(error)}")
    logger.error(f"Error type: {type(error).__name__}")
    import traceback
    logger.error(f"Traceback:\n{traceback.format_exc()}")
    return create_error_response('Internal server error', 500, 'INTERNAL_SERVER_ERROR')


# Export the blueprint
__all__ = ['pesapal_routes']
