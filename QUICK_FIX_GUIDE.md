# MIZIZZI Email Verification - Quick Fix Guide

## The Problem
Users trying to register cannot:
1. Receive verification emails (500 error on `/api/resend-verification`)
2. Log in without email verification (403 error on `/api/login`)

## Root Cause
The Brevo email API is returning an error. This could be because:
- ❌ Brevo sender email (`info.contactgilbertdev@gmail.com`) is not verified in your Brevo account
- ❌ Brevo API key is invalid or has been regenerated  
- ❌ Brevo account is suspended or rate-limited
- ❌ API key doesn't have email sending permissions

## Quick Fix Steps

### Step 1: Check Brevo Sender Email (Most Common Issue)

1. Go to https://app.brevo.com/
2. Click **Settings** in the sidebar
3. Select **Senders, domains, IPs**
4. Look for `info.contactgilbertdev@gmail.com` in the list

If it's NOT there:
- Click **Add a sender**
- Enter the email: `info.contactgilbertdev@gmail.com`
- Click **Add**
- Check your email inbox for verification link
- Click the verification link
- Wait 5 minutes for propagation

If it IS there but shows as UNVERIFIED:
- Check your email for Brevo verification link
- Click it to verify
- If you don't see it, click **Resend verification email**
- Wait for email (check spam folder)

### Step 2: Verify Render Environment Variables

1. Go to your **Render Dashboard**
2. Click **MIZIZZI-ECOMMERCE** service
3. Click **Environment** tab
4. Check these variables:

```
BREVO_API_KEY = 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
BREVO_SENDER_EMAIL = info.contactgilbertdev@gmail.com
BREVO_SENDER_NAME = MIZIZZI
```

If any are missing, add them.

### Step 3: Test Email Sending

To test if email sending works:

**Option A: Via API (Quick Test)**
```bash
curl -X POST "https://api.brevo.com/v3/smtp/email" \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "api-key: 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" \
  -d '{
    "sender": {
      "name": "MIZIZZI",
      "email": "info.contactgilbertdev@gmail.com"
    },
    "to": [{"email": "bagenigilbert76@gmail.com"}],
    "subject": "Test Email",
    "htmlContent": "<h1>Test</h1><p>This is a test</p>"
  }'
```

**Option B: Via Your App**
1. Try to resend verification to a test email
2. Check Render logs for `[v0]` messages
3. The logs will show the exact Brevo error

### Step 4: Check Render Logs

1. Go to **Render Dashboard** → **MIZIZZI-ECOMMERCE**
2. Click **Logs** tab
3. Look for messages containing `[v0]`
4. These will show:
   - Exact Brevo error message
   - Whether API key is configured
   - Whether sender email is configured

Example success log:
```
[v0] ✅ Email sent successfully to bagenigilbert76@gmail.com
```

Example error log:
```
[v0] ❌ Brevo API failed with status 400
[v0] Response: {"code":"invalid_sender","message":"Invalid sender email: not verified"}
```

### Step 5: Restart Service (if you made changes)

If you updated environment variables:
1. Go to **Render Dashboard**
2. Click **MIZIZZI-ECOMMERCE**
3. Click **Manual Deploy** → **Deploy latest commit**

Or just manually restart from the service menu.

### Step 6: Test Complete Flow

Once email is working:

1. **Resend Verification Email**
   - POST `/api/resend-verification`
   - Body: `{"identifier": "bagenigilbert76@gmail.com"}`
   - Should return `200` with success message

2. **Check Email**
   - Look for verification email from MIZIZZI
   - Click verification link or use code

3. **Try Login**
   - POST `/api/login`
   - Body: `{"identifier": "bagenigilbert76@gmail.com", "password": "password"}`
   - Should return `200` with access token

## Advanced Debugging

### Using the Diagnostic Script

If you have SSH access to your Render service:

```bash
cd /app/backend
python test_brevo_config.py
```

This will:
- ✅ Check environment variables
- ✅ Validate API key format
- ✅ Validate email format
- ✅ Send test email to Brevo
- ✅ Show specific error if something fails

### Check Your Brevo Plan

1. Go to https://app.brevo.com/account/subscription
2. Verify you're on an active plan
3. Check if you've exceeded email limits
4. Look for any account warnings or suspensions

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid sender email" | Verify sender email in Brevo Senders section |
| "Unauthorized" (401) | Check API key is correct and not expired |
| "Forbidden" (403) | Check API key has email sending permissions |
| "Too many requests" (429) | Wait, then try again - you may be rate-limited |
| "Server error" (500) | Check Brevo status page - may be temporary outage |
| "Connection refused" | Check internet connection to Brevo API |

## Still Having Issues?

1. **Check Render logs** - Copy the `[v0]` error messages
2. **Test Brevo API directly** - Use the curl command above
3. **Verify Brevo account** - Log into https://app.brevo.com/
4. **Check email verification** - Make sure sender email is verified
5. **Contact Brevo support** - If account has issues

## Verification Flow Diagram

```
User Registration
    ↓
Account Created (email_verified = False)
    ↓
User tries to login
    ↓
Backend checks: Is email_verified = True?
    ├→ NO: Return 403 Forbidden "Email not verified"
    │       ↓
    │   User clicks "Resend verification"
    │       ↓
    │   Backend sends email via Brevo
    │       ├→ ❌ FAILS: Return 500 "Failed to send email"
    │       └→ ✅ SUCCESS: Email sent, return 200
    │
    └→ YES: Create session tokens, return 200

User receives email
    ↓
User clicks verification link
    ↓
Backend marks email_verified = True
    ↓
User can now login successfully
```

## Need More Help?

Check the [BREVO_DEBUGGING_GUIDE.md](./BREVO_DEBUGGING_GUIDE.md) for comprehensive troubleshooting.
