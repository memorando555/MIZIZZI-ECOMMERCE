# Brevo Email Service - Debugging Your Specific Error

## Your Current Error

```
❌ 500 Error on POST /api/resend-verification
{msg: 'Failed to send verification email. Please try again.'}
```

And also:
```
❌ 403 Error on POST /api/login  
{msg: 'Email not verified', 'verification_required': True}
```

## Why This Happens

The flow is:
1. User registers → email not verified automatically
2. User tries login → blocked (403) because needs verification
3. User requests verification email → Brevo API fails (500)
4. User is stuck - can't verify email, can't login

**The real issue is step 3 - Brevo email sending is failing.**

## How to See the Actual Brevo Error

### Method 1: Check Render Logs (Easiest)

1. Go to https://dashboard.render.com/
2. Select **MIZIZZI-ECOMMERCE** service
3. Click **Logs**
4. Look for lines with `[v0]`
5. You should see something like:

```
[v0] 📧 Sending email via Brevo API
[v0]   To: bagenigilbert76@gmail.com
[v0]   From: info.contactgilbertdev@gmail.com (MIZIZZI)
[v0] Brevo API response: 400
[v0] ❌ Brevo API failed with status 400
[v0] Response: {"code":"invalid_sender","message":"Invalid sender email"}
```

### Method 2: Test Directly via API

```bash
# 1. First, test Brevo connectivity
curl -X POST "https://api.brevo.com/v3/smtp/email" \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "api-key: YOUR_API_KEY_HERE" \
  -d '{
    "sender": {
      "name": "MIZIZZI",
      "email": "info.contactgilbertdev@gmail.com"
    },
    "to": [{"email": "test@example.com"}],
    "subject": "Test",
    "htmlContent": "<p>Test</p>"
  }'
```

If this works, you get:
```json
{
  "messageId": "<...>"
}
```

If it fails, you get an error that tells you what's wrong.

## Common Brevo Errors & Fixes

### Error 1: Invalid Sender Email (400)
```json
{
  "code": "invalid_sender",
  "message": "Invalid sender email. The address [info.contactgilbertdev@gmail.com] is either non-existent or not validated."
}
```

**Fix:**
1. Go to https://app.brevo.com/settings/senders
2. Look for `info.contactgilbertdev@gmail.com`
3. If not there:
   - Click **Add a sender**
   - Enter `info.contactgilbertdev@gmail.com`
   - Check email inbox for Brevo verification
   - Click verification link
   - Wait 5 minutes

4. If there but marked UNVERIFIED:
   - Click the sender
   - Click **Resend verification**
   - Check email (check spam!)
   - Click verification link

### Error 2: Invalid API Key (401)
```json
{
  "code": "unauthorized",
  "message": "Unauthorized"
}
```

**Possible causes:**
- API key is wrong
- API key was regenerated
- API key has wrong permissions

**Fix:**
1. Go to https://app.brevo.com/account/api
2. Check your API key:
   - Generate a new one if needed
   - Copy the full key
3. Update in Render:
   - Go to Render → MIZIZZI-ECOMMERCE
   - Settings → Environment
   - Update `BREVO_API_KEY` with the new key
   - Deploy

### Error 3: Forbidden - No Permissions (403)
```json
{
  "code": "forbidden",
  "message": "You do not have permission to perform this action"
}
```

**Fix:**
- Create a new API key with **Email sending** permission
- Update `BREVO_API_KEY` in Render

### Error 4: Too Many Requests (429)
```json
{
  "code": "rate_limit",
  "message": "Too many requests"
}
```

**Fix:**
- Wait 5-10 minutes before trying again
- Check your Brevo plan limits

### Error 5: Service Unavailable (503)
```json
{
  "code": "service_unavailable",
  "message": "Service temporarily unavailable"
}
```

**Fix:**
- Wait for Brevo to recover
- Check https://status.brevo.com/

## Verification Checklist

Before contacting support, verify:

- [ ] You can log into https://app.brevo.com/
- [ ] Your Brevo account is not suspended
- [ ] `info.contactgilbertdev@gmail.com` is in your verified senders list
- [ ] BREVO_API_KEY is set in Render environment
- [ ] BREVO_SENDER_EMAIL is set in Render environment
- [ ] You've restarted the Render service after changing env vars
- [ ] You can access https://api.brevo.com/ (not geographically blocked)

## Testing Email End-to-End

1. **Check logs show email config:**
   ```
   [v0] To: bagenigilbert76@gmail.com
   [v0] From: info.contactgilbertdev@gmail.com (MIZIZZI)
   ```

2. **Check API response status:**
   ```
   [v0] Brevo API response: 200  (or 201 - means success)
   OR
   [v0] Brevo API response: 400  (means error - see error details)
   ```

3. **Check message ID (if successful):**
   ```
   [v0] Message ID: <...>
   ```

4. **Check inbox:**
   - Look for email from MIZIZZI
   - Check spam folder
   - If nothing, the sender email is likely not verified

## Next Steps

1. **Check Render logs** - Copy the `[v0]` error messages
2. **Identify the exact error** - Match it to the errors above
3. **Apply the fix** - Follow the fix for that specific error
4. **Restart Render** - Ensure changes take effect
5. **Test again** - Try resending verification email
6. **Check email** - Look for verification email

## Still Stuck?

If you've done everything above and emails still aren't sending:

1. Get the exact Brevo error from Render logs
2. Go to Brevo support
3. Include:
   - The error code
   - The error message
   - Your sender email address
   - Screenshot of your verified senders list

Your Brevo support will be able to see why the API is rejecting your requests.

## Email Flow After Fix

Once Brevo is working:

```
User Registration
    ↓
[Register] POST /api/register ✅ Success - account created
    ↓
[Needs Verification] User tries to login
    ↓
[Resend Email] POST /api/resend-verification ✅ Email sent (NOW WORKING!)
    ↓
[User receives email] Check inbox for verification email
    ↓
[Click link or verify] GET /api/verify-email?token=... ✅ Email verified
    ↓
[Login works!] POST /api/login ✅ Returns 200 with auth tokens
```

---

**Last updated:** March 3, 2026
**For issues:** Check Render logs with `[v0]` filter first
