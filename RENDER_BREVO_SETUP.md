# Render Environment Setup - Brevo API Configuration

## Overview
Your Brevo account is fully verified and ready to send emails via the API. You just need to add one environment variable to your Render backend service.

## Steps to Configure Render

### 1. Go to your Render Dashboard
- Navigate to: https://dashboard.render.com
- Select your project: MIZIZZI-ECOMMERCE
- Click on the MIZIZZI-ECOMMERCE web service

### 2. Go to Environment Variables
- Click Settings in the left sidebar
- Scroll down to Environment section
- Click Add Environment Variable

### 3. Add the Brevo API Key

Add this environment variable:
- Key: BREVO_API_KEY
- Value: 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

Confirm these variables are also set:
- BREVO_SENDER_EMAIL = info.contactgilbertdev@gmail.com
- BREVO_SENDER_NAME = MIZIZZI

### 4. Redeploy
- Click the Deploy button to redeploy with new environment variables
- Wait for deployment to complete

## Verification

### Test Email Sending
1. Register a new user in your MIZIZZI app
2. Should receive verification email
3. Check spam folder if not in inbox

### Check Logs
Go to Render dashboard > MIZIZZI-ECOMMERCE > Logs and look for:
- Success: "[v0] ✅ Email sent successfully"
- Error: "[v0] ❌ Brevo API failed"

### Brevo Check
1. Go to https://app.brevo.com/dashboard
2. Senders, Domains & IPs > Senders
3. Verify info.contactgilbertdev@gmail.com shows green checkmark

## Troubleshooting

### "BREVO_API_KEY not configured" Error
- Verify you added the environment variable to Render
- Check API key is correct (starts with xkeysib-)
- Redeploy the service

### "Failed to send verification email" (500 Error)
- Check Render logs for actual Brevo API error
- Verify sender email is marked Verified in Brevo
- Confirm API key hasn't been revoked

### Email Goes to Spam
- Your sender shows DMARC warnings (Gmail domain not ideal for transactional)
- Consider using business domain for better deliverability

## Success!
Once working, users will be able to:
1. Register and receive verification emails
2. Verify their email address
3. Log in successfully

Backend ready: Yes
Brevo configured: Yes
Action needed: Add BREVO_API_KEY to Render environment variables
