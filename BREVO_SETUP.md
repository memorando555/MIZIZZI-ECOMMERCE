# Brevo Email Service Setup Guide

## Overview
This application uses Brevo (formerly Sendinblue) to send transactional emails for user registration, verification, and notifications.

## Current Configuration

### Backend Settings (config.py)
```python
BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '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')
BREVO_SENDER_EMAIL = os.environ.get('BREVO_SENDER_EMAIL', 'noreply@mizizzi.com')
BREVO_SENDER_NAME = os.environ.get('BREVO_SENDER_NAME', 'MIZIZZI')
```

## Issues & Solutions

### 1. Sender Email Not Verified
**Issue**: Brevo rejects emails from unverified sender addresses
**Solution**: 
- Log into your Brevo account
- Go to Settings → Sender Identities
- Add your sender email (`noreply@mizizzi.com` or your custom domain)
- Complete the verification process (usually involves email confirmation or DNS records for domain)

### 2. Invalid API Key
**Issue**: 401 Unauthorized or "Invalid API Key" errors
**Solution**:
- Get your API key from Brevo dashboard: Settings → SMTP & API
- Update the environment variable: `BREVO_API_KEY=your_actual_api_key`

### 3. Rate Limiting
**Issue**: 429 Too Many Requests errors
**Solution**:
- Brevo has different rate limits based on your plan
- Check your account plan at brevo.com
- Consider upgrading if sending large volumes

## How to Get a Brevo Account

1. Go to https://www.brevo.com
2. Sign up for a free account
3. Verify your email
4. Set up your sender identity (email address)
5. Get your API key from Settings → SMTP & API

## Email Endpoints Used

### Registration Verification Email
- **Route**: `/api/register` (POST)
- **Template**: User registration with verification code
- **Sender**: Configured BREVO_SENDER_EMAIL

### Welcome Email
- **Route**: `/google-login` (POST)
- **Template**: Welcome message after successful registration
- **Sender**: Configured BREVO_SENDER_EMAIL

### Password Reset Email
- **Route**: `/forgot-password` (POST)
- **Template**: Password reset link
- **Sender**: Configured BREVO_SENDER_EMAIL

## Testing Email Sending

### 1. Check Logs
```bash
# Check application logs for detailed email sending information
tail -f /path/to/app.log | grep "Brevo"
```

### 2. Test Endpoint
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

### 3. Monitor Brevo Dashboard
- Go to brevo.com → Campaigns → Sent emails
- Check email logs for delivery status

## Environment Variables

Set these in your `.env` file or deployment platform:

```env
BREVO_API_KEY=xkeysib-your-actual-key-here
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Your Company Name
FLASK_ENV=production
```

## Troubleshooting

### Email Not Sending - Check These:
1. ✅ Brevo API key is valid and not expired
2. ✅ Sender email is verified in Brevo
3. ✅ Recipient email is valid
4. ✅ Email domain has proper DNS records (if using custom domain)
5. ✅ Rate limits not exceeded
6. ✅ Network connectivity to Brevo API

### Check Application Logs
The application logs detailed information for debugging:
- Sender email being used
- Recipient email
- API key status
- Brevo response status and errors

Look for `[v0]` prefixed log messages for detailed troubleshooting information.

## Support
- Brevo Support: https://www.brevo.com/contact/
- API Documentation: https://developers.brevo.com/docs
