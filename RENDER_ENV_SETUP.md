# Adding Brevo API Key to Render Backend

## Quick Setup Steps

### Step 1: Access Render Dashboard
1. Go to https://dashboard.render.com
2. Log in with your account
3. Select your MIZIZZI backend service (e.g., `mizizzi-ecommerce-1`)

### Step 2: Add Environment Variables
1. Click on **Settings** tab
2. Scroll down to **Environment** section
3. Click **Add Environment Variable** and add these three variables:

```
BREVO_API_KEY = xsmtpsib-60abaf833ed7483eebe873a92b84ce1c1e76cdb645654c9ae15b4ac5f32e598d-9tAvzulp5ZidaWDn

BREVO_SENDER_EMAIL = info.contactgilbertdev@gmail.com

BREVO_SENDER_NAME = MIZIZZI
```

### Step 3: Deploy Changes
1. After adding variables, click **Deploy** or wait for auto-deploy
2. The backend will restart with the new environment variables

### Step 4: Test Email Sending
1. Go to your MIZIZZI app at http://localhost:3000/auth/login
2. Try registering a new account
3. Check your email for the verification code

### Verify It's Working
Check Render backend logs:
1. In Render dashboard, go to **Logs** tab
2. Look for logs showing `Sending email via Brevo API` (should now succeed)
3. If successful, you'll see the email was sent

## If Emails Still Don't Work

Check these things:
1. **API Key is correct** - Make sure it was copied exactly (no extra spaces)
2. **Sender email is verified** - In Brevo, the sender email must be verified (it is: info.contactgilbertdev@gmail.com ✓)
3. **Backend restarted** - After adding env vars, Render must redeploy
4. **Check Brevo logs** - Go to Brevo → Inbox to see if emails were sent

## Security Note
After testing, you should regenerate a new SMTP key in Brevo for security:
1. Go to Brevo → Settings → SMTP & API
2. Click "Generate a new SMTP key"
3. Copy the new key and update it in Render
4. This invalidates the old key you shared in chat
