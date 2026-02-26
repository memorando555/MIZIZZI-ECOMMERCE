/**
 * Cache Configuration & Environment Setup
 * 
 * Required environment variables to add:
 * 
 * REVALIDATION_SECRET=your-secret-key
 *   - Used for manual cache invalidation via API
 *   - Should be a strong random string
 * 
 * WEBHOOK_SECRET=your-webhook-secret
 *   - Used for backend webhook authentication
 *   - Must match the value configured on backend
 *   - Should be a strong random string
 * 
 * NEXT_PUBLIC_CACHE_TAGS=true
 *   - Enable cache tag revalidation
 */

export const CACHE_CONFIG = {
  // ISR Revalidation windows (in seconds)
  ISR_REVALIDATE: {
    CAROUSEL: 60,        // Carousel: 1 minute
    PREMIUM: 300,        // Premium: 5 minutes
    CATEGORIES: 3600,    // Categories: 1 hour
    PRODUCTS: 30,        // Products: 30 seconds
    FLASH_SALES: 10,     // Flash sales: 10 seconds
    USER_DATA: 0,        // User data: no cache
  },

  // Cache control headers
  CACHE_HEADERS: {
    STATIC: 'public, max-age=31536000, immutable',
    DYNAMIC: 'public, s-maxage=60, stale-while-revalidate=3600',
    SHORT: 'public, s-maxage=30, stale-while-revalidate=60',
    USER: 'private, no-cache, no-store, must-revalidate',
  },

  // Webhook configuration
  WEBHOOK: {
    SECRET: process.env.WEBHOOK_SECRET || process.env.REVALIDATION_SECRET,
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
  },

  // Cache invalidation settings
  INVALIDATION: {
    ENABLED: process.env.NEXT_PUBLIC_CACHE_TAGS !== 'false',
    BATCH_SIZE: 10,      // Max tags to revalidate per batch
  },
}

/**
 * Verify cache configuration is properly set up
 */
export function verifyCacheConfig(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []

  if (!CACHE_CONFIG.WEBHOOK.SECRET) {
    warnings.push(
      'WEBHOOK_SECRET or REVALIDATION_SECRET environment variable is not set. ' +
      'Webhook authentication will fail. Set this value for production.'
    )
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.VERCEL) {
      warnings.push(
        'Not running on Vercel. ISR may not work as expected. ' +
        'Deploy to Vercel for optimal caching behavior.'
      )
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  }
}

// Log warnings in development
if (process.env.NODE_ENV === 'development') {
  const { warnings } = verifyCacheConfig()
  if (warnings.length > 0) {
    console.warn('[v0] Cache configuration warnings:')
    warnings.forEach((w) => console.warn(`  - ${w}`))
  }
}
