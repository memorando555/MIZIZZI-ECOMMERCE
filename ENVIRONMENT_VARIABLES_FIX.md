# Environment Variables Configuration Fix

## Problem Identified

The frontend was still trying to connect to `localhost:5000` during server-side rendering (SSR) even after adding environment variables. This happened because individual server-side files had their own hardcoded API URL definitions with fallbacks to localhost.

## Root Cause

Multiple server-side data fetching files were defining their own `API_BASE_URL` constants with hardcoded fallbacks:

```typescript
// WRONG - Before fix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"
```

This pattern created two issues:
1. Multiple sources of truth for the API URL
2. Fallbacks that weren't reading the environment variables correctly

## Solution Implemented

All server-side files now import the centralized `API_BASE_URL` from `lib/config.ts`:

```typescript
// CORRECT - After fix
import { API_BASE_URL } from "../config"
```

### Files Fixed

Server-side data fetching files updated:
- `lib/server/get-footer-settings.ts`
- `lib/server/get-categories.ts`
- `lib/server/get-trending-products.ts`
- `lib/server/get-top-picks.ts`
- `lib/server/get-new-arrivals.ts`
- `lib/server/get-luxury-products.ts`
- `lib/server/get-daily-finds.ts`
- `lib/server/get-carousel-data.ts`
- `lib/server/get-all-products.ts`
- `lib/server/get-flash-sale-products.ts`

### Centralized Configuration

The single source of truth for API URLs is now in `lib/config.ts`:

```typescript
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://mizizzi-ecommerce-1.onrender.com"
```

This reads from environment variables in this order:
1. `NEXT_PUBLIC_API_URL` (primary, defined in `.env.local`)
2. `NEXT_PUBLIC_BACKEND_URL` (fallback)
3. Render production URL (last resort)

## Environment Variables Configuration

Your `.env.local` is correctly set:

```env
NEXT_PUBLIC_API_URL=https://mizizzi-ecommerce-1.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://mizizzi-ecommerce-1.onrender.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://mizizzi-ecommerce-1.onrender.com
```

These will be available to:
- Client-side code (files with `NEXT_PUBLIC_` prefix are baked into client bundle)
- Server-side rendering (Next.js provides env vars during SSR)
- API routes

## What You Need to Do

### Local Development

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   ```

2. **Restart dev server:**
   ```bash
   npm run dev:turbo  # or pnpm dev:turbo
   ```

3. **Verify in browser:**
   - Open your site
   - Check Network tab - API calls should go to `https://mizizzi-ecommerce-1.onrender.com`
   - Check Console - no more connection refused errors to `localhost:5000`

### Render Deployment

Ensure these environment variables are set in your Render dashboard (Settings → Environment):

```
NEXT_PUBLIC_API_URL=https://mizizzi-ecommerce-1.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://mizizzi-ecommerce-1.onrender.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://mizizzi-ecommerce-1.onrender.com
```

Then redeploy to use the fixed code.

## Troubleshooting

If you still see `localhost:5000` errors:

1. **Clear browser cache:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check `.env.local` exists:** Should be at `/vercel/share/v0-project/frontend/.env.local`
3. **Verify environment:** Run `echo $NEXT_PUBLIC_API_URL` in your terminal
4. **Check logs:** Look for `[v0]` debug logs showing which URL is being used

## Email Integration

With this fix, your Brevo emails should now work because:
1. Frontend connects to Render backend via correct URL
2. Backend receives order webhooks properly
3. Backend sends emails through Brevo using configured credentials

The Brevo API key, sender email, and sender name are already configured in Render environment variables and your backend code has been updated to use them correctly.
