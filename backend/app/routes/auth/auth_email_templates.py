"""Email templates and functions for authentication-related communications.
Handles welcome emails, account verification, password resets, and more."""

import os
import json
import logging
from datetime import datetime
from flask import current_app
import requests

# Setup logger
logger = logging.getLogger(__name__)

def send_email(to, subject, template):
    """Send email using Brevo API directly."""
    try:
        logger.info(f"[v0] Starting email send process to: {to}")
        logger.info(f"[v0] Email subject: {subject}")

        # Get the Brevo API key from configuration
        brevo_api_key = current_app.config.get('BREVO_API_KEY', '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')

        if not brevo_api_key:
            logger.error("[v0] BREVO_API_KEY not configured")
            return False

        logger.info(f"[v0] Using Brevo API key: {brevo_api_key[:10]}...")

        url = "https://api.brevo.com/v3/smtp/email"

        sender_email = "info.contactgilbertdev@gmail.com"
        
        # Prepare the payload for Brevo API with anti-spam headers
        payload = {
            "sender": {
                "name": "MIZIZZI",
                "email": sender_email
            },
            "to": [{"email": to}],
            "subject": subject,
            "htmlContent": template,
            "headers": {
                "X-Mailer": "MIZIZZI/1.0",
                "List-Unsubscribe": f"<mailto:unsubscribe@mizizzi.com?subject=unsubscribe>",
                "Precedence": "bulk",
                "Content-Type": "text/html; charset=UTF-8"
            },
            "tags": ["transactional", "authentication"]
        }

        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": brevo_api_key
        }

        logger.info(f"[v0] Sending email via Brevo API to {to}")
        logger.info(f"[v0] Payload prepared with sender: {sender_email}")

        response = requests.post(url, json=payload, headers=headers, timeout=30)

        logger.info(f"[v0] Brevo API response status: {response.status_code}")

        if response.status_code >= 200 and response.status_code < 300:
            logger.info(f"[v0] ✅ Email sent successfully via Brevo API to {to}. Status: {response.status_code}")
            try:
                response_data = response.json()
                logger.info(f"[v0] Brevo response data: {response_data}")
                if 'messageId' in response_data:
                    logger.info(f"[v0] Brevo Message ID: {response_data['messageId']}")
            except:
                logger.info(f"[v0] Brevo response text: {response.text}")
            return True
        else:
            logger.error(f"[v0] ❌ Failed to send email via Brevo API to {to}. Status: {response.status_code}")
            logger.error(f"[v0] Error response: {response.text}")
            
            try:
                error_data = response.json()
                logger.error(f"[v0] Brevo error details: {error_data}")
                
                if 'message' in error_data:
                    error_msg = error_data['message'].lower()
                    if 'sender' in error_msg or 'verify' in error_msg:
                        logger.error(f"[v0] ⚠️ SENDER VERIFICATION ISSUE: The sender email '{sender_email}' may not be verified in Brevo")
                    elif 'recipient' in error_msg or 'invalid' in error_msg:
                        logger.error(f"[v0] ⚠️ RECIPIENT ISSUE: The recipient email '{to}' may be invalid")
                    elif 'rate' in error_msg or 'limit' in error_msg:
                        logger.error(f"[v0] ⚠️ RATE LIMIT: You may have hit Brevo's rate limit")
            except:
                logger.error(f"[v0] Could not parse error response as JSON")
            return False

    except requests.exceptions.Timeout:
        logger.error(f"[v0] ❌ Timeout sending email to {to}")
        return False
    except requests.exceptions.RequestException as e:
        logger.error(f"[v0] ❌ Request exception sending email: {str(e)}", exc_info=True)
        return False
    except Exception as e:
        logger.error(f"[v0] Exception in send_email function: {str(e)}", exc_info=True)
        return False


def send_welcome_email(to_email, customer_name, auth_method='email'):
    """Send a welcome email to new users (Google OAuth or Email/Password)."""
    try:
        logger.info(f"[v0] 🚀 Starting welcome email process for: {to_email}")
        logger.info(f"[v0] Authentication method: {auth_method}")

        account_created_date = datetime.utcnow().strftime('%B %d, %Y at %I:%M %p')
        
        # Different messages based on auth method
        if auth_method == 'google':
            intro_message = "We're thrilled to welcome you to MIZIZZI! Your account has been successfully created using Google Sign-In."
            auth_details = """
            <div style="background-color: #f9f9f9; border-left: 4px solid #4285f4; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0;"><strong>Sign-In Method:</strong> Google Account</p>
                <p style="margin: 5px 0 0;"><small>You can now sign in to MIZIZZI using your Google account.</small></p>
            </div>
            """
            next_steps = "Your profile has been automatically set up with your Google account information. You can now start shopping on MIZIZZI!"
        else:
            intro_message = "Welcome to MIZIZZI! Your account has been successfully created. We're excited to have you join our luxury shopping community."
            auth_details = """
            <div style="background-color: #f9f9f9; border-left: 4px solid #D4AF37; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0;"><strong>Sign-In Method:</strong> Email & Password</p>
                <p style="margin: 5px 0 0;"><small>You can sign in using your email and password.</small></p>
            </div>
            """
            next_steps = "Your profile is now ready to use. Start exploring our curated collection of luxury products and enhance your shopping experience!"

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to MIZIZZI - Your Account is Ready</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;500;600&display=swap');
        body, html {{
            margin: 0;
            padding: 0;
            font-family: 'Montserrat', sans-serif;
            color: #333333;
            background-color: #f9f9f9;
        }}
        .email-container {{
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }}
        .email-header {{
            background: linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%);
            color: #D4AF37;
            padding: 40px 20px;
            text-align: center;
            border-bottom: 3px solid #D4AF37;
        }}
        .email-header h1 {{
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            font-size: 32px;
            margin: 0;
            letter-spacing: 2px;
        }}
        .email-header p {{
            margin: 10px 0 0;
            font-size: 14px;
            letter-spacing: 1px;
            color: #f0f0f0;
        }}
        .email-body {{
            padding: 40px 30px;
            color: #333;
        }}
        .greeting {{
            font-size: 20px;
            margin-bottom: 20px;
            color: #1A1A1A;
            font-weight: 600;
        }}
        .intro-message {{
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #333;
        }}
        .account-details {{
            background-color: #f9f9f9;
            border-left: 4px solid #D4AF37;
            padding: 25px;
            margin: 30px 0;
            border-radius: 4px;
        }}
        .account-details h3 {{
            font-family: 'Playfair Display', serif;
            margin-top: 0;
            margin-bottom: 15px;
            color: #1A1A1A;
            font-size: 18px;
        }}
        .account-details p {{
            margin: 8px 0;
            font-size: 15px;
        }}
        .account-details strong {{
            color: #1A1A1A;
            font-weight: 600;
        }}
        .btn {{
            display: inline-block;
            background-color: #D4AF37;
            color: #1A1A1A;
            text-decoration: none;
            padding: 14px 30px;
            border-radius: 4px;
            font-weight: 600;
            margin: 30px 0;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 14px;
            transition: background-color 0.3s;
        }}
        .btn:hover {{
            background-color: #C4A32F;
        }}
        .features {{
            margin: 30px 0;
            text-align: center;
        }}
        .feature-item {{
            display: inline-block;
            margin: 10px 15px;
            font-size: 14px;
            color: #666;
        }}
        .feature-icon {{
            font-size: 20px;
            margin-right: 5px;
        }}
        .email-footer {{
            background-color: #1A1A1A;
            padding: 30px 20px;
            text-align: center;
            font-size: 13px;
            color: #f0f0f0;
        }}
        .footer-links {{
            margin: 15px 0;
        }}
        .footer-links a {{
            color: #D4AF37;
            text-decoration: none;
            margin: 0 10px;
        }}
        .social-links {{
            margin: 20px 0;
        }}
        .social-links a {{
            display: inline-block;
            margin: 0 10px;
            color: #D4AF37;
            text-decoration: none;
        }}
        .divider {{
            height: 1px;
            background-color: #D4AF37;
            opacity: 0.3;
            margin: 15px 0;
        }}
        @media only screen and (max-width: 650px) {{
            .email-container {{
                width: 100% !important;
            }}
            .email-body {{
                padding: 25px 15px;
            }}
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Welcome to MIZIZZI</h1>
            <p>LUXURY SHOPPING EXPERIENCE</p>
        </div>
        <div class="email-body">
            <div class="greeting">Hello {customer_name},</div>
            <div class="intro-message">
                {intro_message}
            </div>
            
            <div class="account-details">
                <h3>Account Information</h3>
                <p><strong>Email:</strong> {to_email}</p>
                <p><strong>Account Created:</strong> {account_created_date}</p>
            </div>

            {auth_details}

            <p style="font-size: 16px; line-height: 1.6; margin: 30px 0;">
                {next_steps}
            </p>

            <div class="features">
                <div class="feature-item">
                    <span class="feature-icon">✨</span>
                    <strong>Exclusive Deals</strong><br>
                    <small>Access member-only promotions</small>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">⚡</span>
                    <strong>Fast Checkout</strong><br>
                    <small>Save your preferences</small>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🎁</span>
                    <strong>Rewards Program</strong><br>
                    <small>Earn points on every purchase</small>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="https://www.mizizzi.com/shop" class="btn">Start Shopping Now</a>
            </div>

            <p style="margin-top: 40px; line-height: 1.6; color: #666; font-size: 14px;">
                If you have any questions or need assistance, please don't hesitate to reach out to our customer support team at <a href="mailto:support@mizizzi.com" style="color: #D4AF37; text-decoration: none;">support@mizizzi.com</a> or call us at <strong>+254 700 123 456</strong>.
            </p>

            <p style="margin-top: 30px; font-weight: 500;">
                Warm regards,<br>
                <span style="font-family: 'Playfair Display', serif; font-size: 18px; color: #D4AF37;">The MIZIZZI Team</span>
            </p>
        </div>

        <div class="email-footer">
            <div class="social-links">
                <a href="https://www.facebook.com/mizizzi">Facebook</a>
                <a href="https://www.instagram.com/mizizzi">Instagram</a>
                <a href="https://www.twitter.com/mizizzi">Twitter</a>
            </div>
            <div class="divider"></div>
            <div class="footer-links">
                <a href="https://www.mizizzi.com/terms">Terms & Conditions</a>
                <a href="https://www.mizizzi.com/privacy">Privacy Policy</a>
                <a href="https://www.mizizzi.com/returns">Returns Policy</a>
            </div>
            <p style="margin-top: 20px;">
                &copy; {datetime.utcnow().year} MIZIZZI. All rights reserved.
            </p>
            <p style="font-size: 12px; margin-top: 15px; color: #999;">
                This email was sent to {to_email} after account creation.<br>
                Please do not reply to this email as it is automatically generated.
            </p>
        </div>
    </div>
</body>
</html>
        """

        logger.info(f"[v0] ✅ Welcome email HTML template generated successfully")
        
        subject_line = f"Welcome to MIZIZZI, {customer_name}! Your Account is Ready"
        email_result = send_email(to_email, subject_line, html_content)

        if email_result:
            logger.info(f"[v0] ✅ Welcome email sent successfully to {to_email}")
        else:
            logger.error(f"[v0] ❌ Welcome email failed for {to_email}")

        return email_result

    except Exception as e:
        logger.error(f"[v0] ❌ Exception in send_welcome_email: {str(e)}", exc_info=True)
        return False


def send_email_verification_email(to_email, customer_name, verification_link):
    """Send email verification link to user."""
    try:
        logger.info(f"[v0] 🚀 Starting email verification email process for: {to_email}")

        sent_date = datetime.utcnow().strftime('%B %d, %Y at %I:%M %p')

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email Address - MIZIZZI</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;500;600&display=swap');
        body, html {{
            margin: 0;
            padding: 0;
            font-family: 'Montserrat', sans-serif;
            color: #333333;
            background-color: #f9f9f9;
        }}
        .email-container {{
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }}
        .email-header {{
            background-color: #1A1A1A;
            color: #D4AF37;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #D4AF37;
        }}
        .email-header h1 {{
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            font-size: 28px;
            margin: 0;
            letter-spacing: 1px;
        }}
        .email-body {{
            padding: 40px 30px;
            color: #333;
        }}
        .greeting {{
            font-size: 18px;
            margin-bottom: 20px;
            color: #1A1A1A;
        }}
        .verification-box {{
            background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
            border: 2px solid #D4AF37;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }}
        .verification-text {{
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 20px;
            color: #666;
        }}
        .btn {{
            display: inline-block;
            background-color: #D4AF37;
            color: #1A1A1A;
            text-decoration: none;
            padding: 14px 40px;
            border-radius: 4px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 14px;
            transition: background-color 0.3s;
        }}
        .btn:hover {{
            background-color: #C4A32F;
        }}
        .verification-link {{
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            word-break: break-all;
            font-size: 12px;
            color: #666;
        }}
        .expiry-notice {{
            background-color: #fff9e6;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #e65100;
        }}
        .email-footer {{
            background-color: #1A1A1A;
            padding: 30px 20px;
            text-align: center;
            font-size: 13px;
            color: #f0f0f0;
        }}
        .footer-links {{
            margin: 15px 0;
        }}
        .footer-links a {{
            color: #D4AF37;
            text-decoration: none;
            margin: 0 10px;
        }}
        .divider {{
            height: 1px;
            background-color: #D4AF37;
            opacity: 0.3;
            margin: 15px 0;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Verify Your Email</h1>
        </div>
        <div class="email-body">
            <div class="greeting">Hello {customer_name},</div>
            
            <p style="font-size: 15px; line-height: 1.6; margin: 20px 0;">
                Thank you for creating a MIZIZZI account! To complete your registration and unlock all the features of your account, please verify your email address.
            </p>

            <div class="verification-box">
                <p class="verification-text">
                    Click the button below to verify your email address and activate your account.
                </p>
                <a href="{verification_link}" class="btn">Verify Email Address</a>
                <p style="margin-top: 15px; font-size: 13px; color: #999;">
                    This link will expire in 24 hours
                </p>
            </div>

            <div class="expiry-notice">
                <strong>⏱️ Important:</strong> This verification link is valid for 24 hours. If it expires, you can request a new one from your account settings.
            </div>

            <p style="font-size: 15px; line-height: 1.6; margin: 20px 0;">
                If the button doesn't work, you can also copy and paste this link into your browser:
            </p>

            <div class="verification-link">{verification_link}</div>

            <p style="font-size: 15px; line-height: 1.6; margin: 20px 0;">
                If you didn't create this account, please ignore this email or contact our support team immediately at <a href="mailto:support@mizizzi.com" style="color: #D4AF37; text-decoration: none;">support@mizizzi.com</a>.
            </p>

            <p style="margin-top: 30px; font-weight: 500;">
                Warm regards,<br>
                <span style="font-family: 'Playfair Display', serif; font-size: 18px; color: #D4AF37;">The MIZIZZI Team</span>
            </p>
        </div>

        <div class="email-footer">
            <div class="footer-links">
                <a href="https://www.mizizzi.com/terms">Terms & Conditions</a>
                <a href="https://www.mizizzi.com/privacy">Privacy Policy</a>
            </div>
            <div class="divider"></div>
            <p style="margin-top: 20px;">
                &copy; {datetime.utcnow().year} MIZIZZI. All rights reserved.
            </p>
            <p style="font-size: 12px; margin-top: 15px; color: #999;">
                This email was sent to {to_email} for email verification.<br>
                Please do not reply to this email as it is automatically generated.
            </p>
        </div>
    </div>
</body>
</html>
        """

        logger.info(f"[v0] ✅ Email verification HTML template generated successfully")
        
        email_result = send_email(to_email, "Verify Your MIZIZZI Account Email Address", html_content)

        if email_result:
            logger.info(f"[v0] ✅ Email verification sent successfully to {to_email}")
        else:
            logger.error(f"[v0] ❌ Email verification failed for {to_email}")

        return email_result

    except Exception as e:
        logger.error(f"[v0] ❌ Exception in send_email_verification_email: {str(e)}", exc_info=True)
        return False


def send_password_reset_email(to_email, customer_name, reset_link):
    """Send password reset link to user."""
    try:
        logger.info(f"[v0] 🚀 Starting password reset email process for: {to_email}")

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - MIZIZZI</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;500;600&display=swap');
        body, html {{
            margin: 0;
            padding: 0;
            font-family: 'Montserrat', sans-serif;
            color: #333333;
            background-color: #f9f9f9;
        }}
        .email-container {{
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }}
        .email-header {{
            background-color: #1A1A1A;
            color: #D4AF37;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #D4AF37;
        }}
        .email-header h1 {{
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            font-size: 28px;
            margin: 0;
            letter-spacing: 1px;
        }}
        .email-body {{
            padding: 40px 30px;
            color: #333;
        }}
        .greeting {{
            font-size: 18px;
            margin-bottom: 20px;
            color: #1A1A1A;
        }}
        .security-box {{
            background: linear-gradient(135deg, #fff3cd 0%, #fffbea 100%);
            border-left: 4px solid #ff9800;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .security-box strong {{
            color: #e65100;
        }}
        .reset-box {{
            background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
            border: 2px solid #D4AF37;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }}
        .btn {{
            display: inline-block;
            background-color: #D4AF37;
            color: #1A1A1A;
            text-decoration: none;
            padding: 14px 40px;
            border-radius: 4px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 14px;
            transition: background-color 0.3s;
        }}
        .btn:hover {{
            background-color: #C4A32F;
        }}
        .reset-link {{
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            word-break: break-all;
            font-size: 12px;
            color: #666;
        }}
        .email-footer {{
            background-color: #1A1A1A;
            padding: 30px 20px;
            text-align: center;
            font-size: 13px;
            color: #f0f0f0;
        }}
        .footer-links {{
            margin: 15px 0;
        }}
        .footer-links a {{
            color: #D4AF37;
            text-decoration: none;
            margin: 0 10px;
        }}
        .divider {{
            height: 1px;
            background-color: #D4AF37;
            opacity: 0.3;
            margin: 15px 0;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="email-body">
            <div class="greeting">Hello {customer_name},</div>
            
            <p style="font-size: 15px; line-height: 1.6; margin: 20px 0;">
                We received a request to reset the password for your MIZIZZI account. Click the button below to create a new password.
            </p>

            <div class="security-box">
                <strong>🔒 Security Notice:</strong> If you did not request a password reset, please ignore this email. Your account remains secure. Do not share this link with anyone.
            </div>

            <div class="reset-box">
                <p style="font-size: 15px; margin-bottom: 20px;">
                    Click the button below to reset your password. This link will expire in 1 hour.
                </p>
                <a href="{reset_link}" class="btn">Reset Password</a>
            </div>

            <p style="font-size: 15px; line-height: 1.6; margin: 20px 0;">
                Or copy and paste this link into your browser:
            </p>

            <div class="reset-link">{reset_link}</div>

            <ul style="font-size: 14px; line-height: 1.8; color: #666; margin: 20px 0;">
                <li><strong>Link expires:</strong> 1 hour from now</li>
                <li><strong>For security:</strong> Use a strong password with letters, numbers, and symbols</li>
                <li><strong>Questions?</strong> Contact support at support@mizizzi.com</li>
            </ul>

            <p style="font-size: 15px; line-height: 1.6; margin: 20px 0;">
                If you continue to have issues resetting your password, please contact our support team at <a href="mailto:support@mizizzi.com" style="color: #D4AF37; text-decoration: none;">support@mizizzi.com</a> or call us at <strong>+254 700 123 456</strong>.
            </p>

            <p style="margin-top: 30px; font-weight: 500;">
                Warm regards,<br>
                <span style="font-family: 'Playfair Display', serif; font-size: 18px; color: #D4AF37;">The MIZIZZI Team</span>
            </p>
        </div>

        <div class="email-footer">
            <div class="footer-links">
                <a href="https://www.mizizzi.com/security">Security Help</a>
                <a href="https://www.mizizzi.com/privacy">Privacy Policy</a>
            </div>
            <div class="divider"></div>
            <p style="margin-top: 20px;">
                &copy; {datetime.utcnow().year} MIZIZZI. All rights reserved.
            </p>
            <p style="font-size: 12px; margin-top: 15px; color: #999;">
                This email was sent to {to_email} for password reset.<br>
                Please do not reply to this email as it is automatically generated.
            </p>
        </div>
    </div>
</body>
</html>
        """

        logger.info(f"[v0] ✅ Password reset HTML template generated successfully")
        
        email_result = send_email(to_email, "Reset Your MIZIZZI Account Password", html_content)

        if email_result:
            logger.info(f"[v0] ✅ Password reset email sent successfully to {to_email}")
        else:
            logger.error(f"[v0] ❌ Password reset email failed for {to_email}")

        return email_result

    except Exception as e:
        logger.error(f"[v0] ❌ Exception in send_password_reset_email: {str(e)}", exc_info=True)
        return False


def send_account_deletion_confirmation_email(to_email, customer_name):
    """Send account deletion confirmation email."""
    try:
        logger.info(f"[v0] 🚀 Starting account deletion confirmation email for: {to_email}")

        deletion_date = datetime.utcnow().strftime('%B %d, %Y at %I:%M %p')

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Deleted - MIZIZZI</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;500;600&display=swap');
        body, html {{
            margin: 0;
            padding: 0;
            font-family: 'Montserrat', sans-serif;
            color: #333333;
            background-color: #f9f9f9;
        }}
        .email-container {{
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }}
        .email-header {{
            background-color: #1A1A1A;
            color: #D4AF37;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #D4AF37;
        }}
        .email-header h1 {{
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            font-size: 24px;
            margin: 0;
            letter-spacing: 1px;
        }}
        .email-body {{
            padding: 40px 30px;
            color: #333;
        }}
        .notice-box {{
            background: linear-gradient(135deg, #fff3cd 0%, #fffbea 100%);
            border-left: 4px solid #D4AF37;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .details {{
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .details p {{
            margin: 5px 0;
            font-size: 14px;
        }}
        .email-footer {{
            background-color: #1A1A1A;
            padding: 30px 20px;
            text-align: center;
            font-size: 13px;
            color: #f0f0f0;
        }}
        .divider {{
            height: 1px;
            background-color: #D4AF37;
            opacity: 0.3;
            margin: 15px 0;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Account Deleted</h1>
        </div>
        <div class="email-body">
            <p style="font-size: 16px; margin-bottom: 20px;">
                Hello {customer_name},
            </p>
            
            <p style="font-size: 15px; line-height: 1.6; margin: 20px 0;">
                Your MIZIZZI account has been successfully deleted. All your personal data, orders, and preferences have been permanently removed from our system.
            </p>

            <div class="details">
                <p><strong>Deletion Details:</strong></p>
                <p><strong>Email:</strong> {to_email}</p>
                <p><strong>Deletion Date:</strong> {deletion_date}</p>
                <p><strong>Status:</strong> Permanently Deleted</p>
            </div>

            <div class="notice-box">
                <strong>📝 Important:</strong> Your account deletion is permanent and cannot be undone. If you'd like to shop with MIZIZZI again, you'll need to create a new account.
            </div>

            <p style="font-size: 15px; line-height: 1.6; margin: 20px 0;">
                We're sorry to see you go! If you deleted your account by mistake or have any concerns, please contact our support team at <a href="mailto:support@mizizzi.com" style="color: #D4AF37; text-decoration: none;">support@mizizzi.com</a> within 30 days.
            </p>

            <p style="font-size: 15px; line-height: 1.6; margin: 20px 0;">
                Thank you for being part of the MIZIZZI community. We hope to welcome you back in the future!
            </p>

            <p style="margin-top: 30px; font-weight: 500;">
                Warm regards,<br>
                <span style="font-family: 'Playfair Display', serif; font-size: 18px; color: #D4AF37;">The MIZIZZI Team</span>
            </p>
        </div>

        <div class="email-footer">
            <div class="divider"></div>
            <p style="margin-top: 20px;">
                &copy; {datetime.utcnow().year} MIZIZZI. All rights reserved.
            </p>
            <p style="font-size: 12px; margin-top: 15px; color: #999;">
                This email was sent to {to_email} regarding account deletion.<br>
                Please do not reply to this email as it is automatically generated.
            </p>
        </div>
    </div>
</body>
</html>
        """

        logger.info(f"[v0] ✅ Account deletion HTML template generated successfully")
        
        email_result = send_email(to_email, "MIZIZZI Account Deletion Confirmation", html_content)

        if email_result:
            logger.info(f"[v0] ✅ Account deletion confirmation email sent successfully to {to_email}")
        else:
            logger.error(f"[v0] ❌ Account deletion confirmation email failed for {to_email}")

        return email_result

    except Exception as e:
        logger.error(f"[v0] ❌ Exception in send_account_deletion_confirmation_email: {str(e)}", exc_info=True)
        return False


def send_suspicious_login_email(to_email, customer_name, login_details):
    """Send suspicious login activity notification."""
    try:
        logger.info(f"[v0] 🚀 Starting suspicious login email for: {to_email}")

        login_time = login_details.get('login_time', 'Unknown')
        login_location = login_details.get('location', 'Unknown Location')
        login_device = login_details.get('device', 'Unknown Device')
        login_ip = login_details.get('ip_address', 'Unknown IP')

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unusual Login Activity - MIZIZZI</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;500;600&display=swap');
        body, html {{
            margin: 0;
            padding: 0;
            font-family: 'Montserrat', sans-serif;
            color: #333333;
            background-color: #f9f9f9;
        }}
        .email-container {{
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }}
        .email-header {{
            background-color: #d32f2f;
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #D4AF37;
        }}
        .email-header h1 {{
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            font-size: 24px;
            margin: 0;
            letter-spacing: 1px;
        }}
        .email-body {{
            padding: 40px 30px;
            color: #333;
        }}
        .alert-box {{
            background: linear-gradient(135deg, #ffebee 0%, #fff5f5 100%);
            border-left: 4px solid #d32f2f;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .login-details {{
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .login-details p {{
            margin: 8px 0;
            font-size: 14px;
        }}
        .action-buttons {{
            text-align: center;
            margin: 30px 0;
        }}
        .btn {{
            display: inline-block;
            padding: 12px 25px;
            margin: 5px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .btn-secure {{
            background-color: #4caf50;
            color: #ffffff;
        }}
        .btn-secure:hover {{
            background-color: #45a049;
        }}
        .btn-contact {{
            background-color: #D4AF37;
            color: #1A1A1A;
        }}
        .btn-contact:hover {{
            background-color: #C4A32F;
        }}
        .email-footer {{
            background-color: #1A1A1A;
            padding: 30px 20px;
            text-align: center;
            font-size: 13px;
            color: #f0f0f0;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>⚠️ Unusual Login Activity</h1>
        </div>
        <div class="email-body">
            <p style="font-size: 16px; margin-bottom: 20px;">
                Hello {customer_name},
            </p>
            
            <div class="alert-box">
                <p><strong>🔒 Security Alert:</strong> We detected an unusual login to your MIZIZZI account from a new location or device. If this was you, you can safely ignore this email.</p>
            </div>

            <h3 style="font-family: 'Playfair Display', serif; margin-top: 30px; margin-bottom: 15px; color: #1A1A1A;">Login Details</h3>
            <div class="login-details">
                <p><strong>Date & Time:</strong> {login_time}</p>
                <p><strong>Location:</strong> {login_location}</p>
                <p><strong>Device:</strong> {login_device}</p>
                <p><strong>IP Address:</strong> {login_ip}</p>
            </div>

            <p style="font-size: 15px; line-height: 1.6; margin: 20px 0;">
                <strong>If this was NOT you:</strong> Take action immediately to secure your account:
            </p>

            <ol style="font-size: 14px; line-height: 1.8; color: #333;">
                <li>Change your password immediately</li>
                <li>Review your recent account activity</li>
                <li>Contact our support team if you don't recognize this activity</li>
            </ol>

            <div class="action-buttons">
                <a href="https://www.mizizzi.com/account/security" class="btn btn-secure">Secure My Account</a>
                <a href="mailto:support@mizizzi.com" class="btn btn-contact">Contact Support</a>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #666; margin: 20px 0;">
                For security questions or concerns, please contact our support team at <a href="mailto:support@mizizzi.com" style="color: #D4AF37; text-decoration: none;">support@mizizzi.com</a> or call us at <strong>+254 700 123 456</strong>.
            </p>

            <p style="margin-top: 30px; font-weight: 500;">
                Stay safe,<br>
                <span style="font-family: 'Playfair Display', serif; font-size: 18px; color: #D4AF37;">The MIZIZZI Security Team</span>
            </p>
        </div>

        <div class="email-footer">
            <p style="margin-top: 20px;">
                &copy; {datetime.utcnow().year} MIZIZZI. All rights reserved.
            </p>
            <p style="font-size: 12px; margin-top: 15px; color: #999;">
                This email was sent to {to_email} for security purposes.<br>
                Please do not reply to this email as it is automatically generated.
            </p>
        </div>
    </div>
</body>
</html>
        """

        logger.info(f"[v0] ✅ Suspicious login HTML template generated successfully")
        
        email_result = send_email(to_email, "⚠️ Unusual Login Activity - MIZIZZI Security Alert", html_content)

        if email_result:
            logger.info(f"[v0] ✅ Suspicious login email sent successfully to {to_email}")
        else:
            logger.error(f"[v0] ❌ Suspicious login email failed for {to_email}")

        return email_result

    except Exception as e:
        logger.error(f"[v0] ❌ Exception in send_suspicious_login_email: {str(e)}", exc_info=True)
        return False
