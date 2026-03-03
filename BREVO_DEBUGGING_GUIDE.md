# Brevo Email Service Debugging Guide

## Current Issues
- ❌ **500 Error on `/api/resend-verification`** - Email verification emails are failing
- ❌ **403 Error on `/api/login`** - Users can't log in because they're not verified

Both issues stem from the Brevo email service not working properly.

## Troubleshooting Steps

### 1. Check Render Environment Variables
Go to your Render dashboard for the MIZIZZI-ECOMMERCE service and verify these are set:

Required environment variables:
- ✅ `BREVO_API_KEY` - Your Brevo API key
- ✅ `BREVO_SENDER_EMAIL` - The sender email address (must be verified in Brevo)
- ✅ `BREVO_SENDER_NAME` - Display name (e.g., "MIZIZZI")

### 2. Verify Sender Email in Brevo
Your sender email must be verified in your Brevo account:

1. Go to Brevo console (https://app.brevo.com/)
2. Navigate to **Settings → Senders, domains, IPs**
3. Check that your sender email (`info.contactgilbertdev@gmail.com`) is listed and **VERIFIED**
4. If not verified, Brevo will reject all emails from that address

### 3. Check API Key Permissions
Ensure your Brevo API key has the right permissions:

1. Go to Brevo console
2. Navigate to **Account → API Keys & MCP instances**
3. Verify the API key is marked as **Active**
4. Ensure it has **Email sending** permissions

### 4. Check Brevo Account Status
- Make sure your Brevo account is active (not suspended)
- Verify you haven't exceeded email sending limits
- Check if there are any account warnings or issues in Brevo dashboard

### 5. Test the Email Directly
To test if Brevo API is working, you can make a direct API call:

```bash
curl -X POST "https://api.brevo.com/v3/smtp/email" \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "api-key: YOUR_BREVO_API_KEY_HERE" \
  -d '{
    "sender": {
      "name": "MIZIZZI",
      "email": "info.contactgilbertdev@gmail.com"
    },
    "to": [{"email": "test@example.com"}],
    "subject": "Test Email",
    "htmlContent": "<h1>Test</h1>"
  }'
```

If you get a `400` or `401` error, check the error message for details.

### 6. Check Render Logs
Look at your Render service logs for detailed error messages:

1. Go to Render dashboard
2. Click on your MIZIZZI-ECOMMERCE service
3. Go to **Logs**
4. Look for `[v0]` tagged messages for email debugging info
5. The logs will show:
   - Exact Brevo API error code and message
   - Whether API key is configured
   - Whether sender email is configured
   - The HTTP status code from Brevo

### 7. Common Brevo Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `400 - Invalid sender email` | Sender not verified | Verify email in Brevo Senders section |
| `401 - Unauthorized` | Invalid API key | Check API key in Render env vars |
| `403 - Forbidden` | API key lacks permissions | Check API key permissions in Brevo |
| `429 - Too many requests` | Rate limited | Wait before retrying |
| `500 - Server error` | Brevo issue | Check Brevo status page |

## Solution Steps

### If Brevo API key is the issue:
1. Go to https://app.brevo.com/
2. Log in to your Brevo account
3. Get a new API key with email permissions
4. Update `BREVO_API_KEY` in your Render environment variables
5. Restart the Render service

### If Sender email is not verified:
1. Go to https://app.brevo.com/
2. Navigate to **Settings → Senders, domains, IPs**
3. Add your sender email (`info.contactgilbertdev@gmail.com`) if not present
4. Verify the email (check your inbox for verification link)
5. Once verified, Brevo will accept emails from that address

### If you want to change the sender email:
1. Verify the new email in Brevo
2. Update `BREVO_SENDER_EMAIL` in Render environment variables
3. Restart the service

## Testing After Fix

Once you fix the Brevo configuration:

1. Try to resend verification email:
   ```
   POST /api/resend-verification
   {"identifier": "test@example.com"}
   ```

2. You should get a `200` response with:
   ```json
   {
     "msg": "Verification email sent successfully",
     "user_id": "...",
     "email": "test@example.com"
   }
   ```

3. Check the email inbox for verification email

4. Complete verification to unblock login

## Need More Help?

Check the Render logs by filtering for `[v0]` to see detailed debugging information about what's happening with email sending.
