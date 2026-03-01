/**
 * SWR Configuration for Admin Product Operations
 * Optimized for fast, real-time updates with WebSocket support
 */

import type { SWRConfiguration } from "swr"

export const adminProductSWRConfig: SWRConfiguration = {
  // Revalidation Strategy
  revalidateOnFocus: false, // Don't revalidate when window refocuses
  revalidateOnReconnect: true, // Revalidate when network reconnects
  revalidateIfStale: true, // Revalidate if data is stale
  revalidateOnMount: true, // Validate when component mounts

  // Cache Duration
  dedupingInterval: 0, // No deduping - each request is unique
  focusThrottleInterval: 300000, // 5 minutes before checking focus
  errorRetryInterval: 5000, // Retry errors every 5 seconds
  errorRetryCount: 3, // Retry 3 times before giving up

  // Performance
  suspense: false, // Don't use Suspense
  keepPreviousData: true, // Keep showing old data while fetching new
  compare: (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b), // Custom comparison

  // Callbacks
  onError: (error) => {
    if (error.status !== 404 && error.status !== 401) {
      console.error("[v0] SWR error:", error)
    }
  },
}

/**
 * Cache Key Generator for Products
 * Creates consistent cache keys for SWR
 */
export const productCacheKeys = {
  product: (id: string | number) => `/api/admin/products/${id}`,
  productList: (page?: number, limit?: number) =>
    `/api/admin/products?page=${page || 1}&limit=${limit || 50}`,
  productImages: (id: string | number) => `/api/admin/products/${id}/images`,
  categories: () => `/api/admin/shop-categories/categories`,
  brands: () => `/api/admin/brands`,
}

/**
 * Real-time Sync Configuration
 * Optimizes how frequently updates are synced
 */
export const SYNC_CONFIG = {
  // Auto-save debounce time (milliseconds)
  AUTO_SAVE_DEBOUNCE: 500,

  // Batch multiple changes within this window
  BATCH_UPDATE_WINDOW: 1000,

  // How often to check for external changes
  POLLING_INTERVAL: 30000, // 30 seconds

  // WebSocket reconnection attempts
  WS_RECONNECT_MAX_ATTEMPTS: 5,
  WS_RECONNECT_DELAY: 3000,

  // Cache invalidation timeout
  CACHE_INVALIDATE_TIMEOUT: 5000,
}

/**
 * Optimistic Update Helper
 * Prepares data for immediate UI update while syncing to server
 */
export function prepareOptimisticUpdate<T extends Record<string, any>>(
  currentData: T | undefined,
  changes: Partial<T>,
): T {
  return {
    ...(currentData || ({} as T)),
    ...changes,
    updated_at: new Date().toISOString(),
  } as T
}

/**
 * Error Recovery Helper
 * Determines if an error is recoverable
 */
export function isRecoverableError(error: any): boolean {
  const recoverableCodes = [408, 429, 500, 502, 503, 504]
  return recoverableCodes.includes(error?.status)
}
