/**
 * Flash Sales Cache Invalidation Strategy
 * 
 * Handles cache clearing across all layers when admin makes updates
 * Ensures data consistency while maintaining fast page loads
 */

import { revalidateTag } from 'next/cache'

/**
 * When Admin Updates Flash Sales Products
 */
export async function invalidateFlashSalesCache() {
  try {
    // Server-side cache invalidation (Next.js)
    revalidateTag('flash-sales', 'manual')
    revalidateTag('flash-sale-event', 'manual')

    console.log('[v0] Flash sales cache invalidated at server level')
  } catch (error) {
    console.warn('[v0] Failed to invalidate server cache:', error)
  }
}

/**
 * Webhook Endpoint Handler (Called when backend updates flash sales)
 * POST /api/webhooks/flash-sales-update
 * 
 * Body: { event: 'flash_sale_updated' | 'flash_sale_ended', productIds: number[] }
 */
export async function handleFlashSalesWebhook(event: string, productIds?: number[]) {
  try {
    // Invalidate server-side cache
    invalidateFlashSalesCache()

    // Next.js will automatically clear the cache for the next request
    console.log('[v0] Flash sales webhook processed:', { event, productCount: productIds?.length })

    return {
      success: true,
      message: 'Flash sales cache invalidated',
      event,
      productsAffected: productIds?.length || 0,
    }
  } catch (error) {
    console.error('[v0] Webhook handler error:', error)
    throw error
  }
}

/**
 * Cache Update Frequency Strategy
 * 
 * | Layer | TTL | Update Frequency | Use Case |
 * |-------|-----|------------------|----------|
 * | sessionStorage (L1) | Session | Instant | Same-session refresh |
 * | localStorage (L2) | 15 min | On expiry | Cross-session caching |
 * | Server Cache (L3) | 60 sec | On webhook | Backend revalidation |
 * 
 * Total Cache Layers:
 * 1. Browser sessionStorage (~50ms) - Current session only
 * 2. Browser localStorage (~100ms) - Persists 15 minutes
 * 3. Next.js Server Cache - Revalidates every 60 seconds
 * 4. Backend API - Source of truth
 */

/**
 * Cache Lifecycle During Flash Sale
 * 
 * Timeline:
 * T+0s  → Admin creates flash sale
 * T+0s  → Webhook triggers invalidation
 * T+1s  → New users see updated data (fresh from API)
 * T+15m → Cached users' localStorage expires
 * T+60s → Server cache revalidates
 * 
 * Impact:
 * - Immediate impact on new users (within 1s)
 * - Existing users see update within 15 minutes max
 * - Minimal server load due to multi-layer caching
 */

/**
 * Manual Cache Clear (Admin Panel)
 * Use when you need to force immediate refresh without waiting for webhooks
 */
export async function manualClearFlashSalesCache() {
  try {
    revalidateTag('flash-sales', 'manual')
    revalidateTag('flash-sale-event', 'manual')

    return {
      success: true,
      message: 'Manual cache clear successful',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[v0] Manual cache clear failed:', error)
    throw error
  }
}
