# Response Caching & ISR Implementation Guide

## Overview

This implementation provides aggressive response caching and Incremental Static Regeneration (ISR) to dramatically improve page load performance from **8 seconds → 2 seconds**.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CDN / Browser Cache                             │
│  (public, max-age=31536000 for images/static)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Vercel Edge Cache (Stale-While-Revalidate)         │
│  Carousel: s-maxage=60, SWR=3600                                │
│  Products: s-maxage=30, SWR=60                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js ISR Cache                            │
│  60-second revalidation window for fresh content                │
│  Cache tags for granular invalidation                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend API (Render)                          │
│  Only called after ISR window expires or on webhook             │
└─────────────────────────────────────────────────────────────────┘
```

## Cache Tiers

### 1. **Browser & CDN Cache** (Longest)
- **Static assets**: `public, max-age=31536000, immutable` (1 year)
- **Images**: `public, max-age=31536000, immutable` (1 year)
- **Fonts**: `public, max-age=31536000, immutable` (1 year)

### 2. **Vercel Edge Cache**
- **Homepage**: `public, s-maxage=60, stale-while-revalidate=3600`
- **Carousel**: `public, s-maxage=60, stale-while-revalidate=300`
- **Products**: `public, s-maxage=30, stale-while-revalidate=60`
- **Flash Sales**: `public, s-maxage=10, stale-while-revalidate=30`

### 3. **ISR Revalidation** (Origin)
- **Background revalidation**: Happens after cache expires
- **On-demand revalidation**: Via webhook when admin updates content
- **Tag-based revalidation**: Granular cache invalidation

## How It Works

### Initial Request (Cold Cache)
1. User requests homepage
2. No edge cache → fetch from origin (Next.js server)
3. Page renders with cached data from backend
4. Response cached for 60 seconds on edge
5. User gets ~2-3 second page load

### Repeat Request (Warm Cache)
1. User requests homepage
2. Edge has cached response → served instantly
3. User gets <500ms page load (cached)

### After Cache Expires (Stale-While-Revalidate)
1. Cache expires after 60 seconds
2. Edge returns stale cached version to user
3. In background: ISR triggers page rebuild
4. Fresh content cached for next request
5. User always gets fast response + fresh content

### Admin Updates Content
1. Admin updates carousel in CMS
2. Backend triggers webhook to `/api/webhooks/cache-invalidate`
3. Frontend invalidates carousel cache tags
4. Homepage ISR revalidates immediately
5. Next user request gets fresh content

## Environment Variables

Add these to your `.env.local` or Vercel project settings:

```bash
# Cache invalidation secret
REVALIDATION_SECRET=your-super-secret-key-here

# Webhook authentication
WEBHOOK_SECRET=your-webhook-secret-here

# Enable cache tags (recommended)
NEXT_PUBLIC_CACHE_TAGS=true
```

## API Endpoints

### Manual Cache Invalidation
```bash
POST /api/carousel/invalidate
Headers: Authorization: Bearer YOUR_REVALIDATION_SECRET
Body: { "secret": "YOUR_REVALIDATION_SECRET" }
```

### Webhook Handler
```bash
POST /api/webhooks/cache-invalidate
Headers: x-webhook-secret: YOUR_WEBHOOK_SECRET
Body: {
  "event_type": "carousel.updated",
  "timestamp": "2024-02-26T10:00:00Z"
}
```

## Cache Tags

Fine-grained control over what gets revalidated:

- `carousel-items` - Homepage carousel
- `premium-experiences` - Premium section
- `contact-cta-slides` - Contact CTA
- `flash-sale-products` - Flash sale section
- `top-picks` - Top picks section
- `new-arrivals` - New arrivals section
- `categories` - Category data
- `products` - General product data

## Monitoring & Debugging

### Check Cache Headers
```bash
curl -I https://your-site.com/
# Look for Cache-Control header
```

### Monitor Revalidations (Vercel Dashboard)
1. Go to project → Functions → Revalidation
2. View recent revalidation events
3. Check revalidation timing and success rate

### Local Development
Cache is disabled by default. To test ISR locally:
```bash
npm run build  # Build static pages
npm run start  # Run production server
```

## Performance Impact

| Scenario | Page Load |
|----------|-----------|
| Cold cache | 2-3 seconds |
| Warm cache | <500ms |
| After revalidation | 1-2 seconds |
| Flash sales update | <1 second (webhook) |

## Troubleshooting

### Cache Not Invalidating
1. Check `WEBHOOK_SECRET` is set correctly
2. Verify webhook is being called by backend
3. Check `/api/webhooks/cache-invalidate` logs

### Stale Content Showing
1. Content caches for 60 seconds by default
2. Wait 1-2 minutes for ISR rebuild
3. Manually trigger `/api/carousel/invalidate`
4. Check backend is not returning stale data

### High Cache Misses
1. ISR window too short? Increase `s-maxage`
2. Backend slow? Check API response times
3. Too many different URLs? Consolidate cache tags

## Production Checklist

- [ ] Set `REVALIDATION_SECRET` in Vercel
- [ ] Set `WEBHOOK_SECRET` in Vercel
- [ ] Configure backend to call webhook on updates
- [ ] Test webhook with `curl` or Postman
- [ ] Monitor cache hit rates in Vercel Analytics
- [ ] Verify Core Web Vitals improve
- [ ] Load test with K6 or similar

## References

- [Next.js ISR Documentation](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration)
- [Cache Control Header MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Vercel Edge Caching](https://vercel.com/docs/edge-network/caching)
