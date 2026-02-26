/**
 * Cache Management Utilities
 * Handles ISR revalidation, cache invalidation, and cache headers
 */

import { revalidatePath, revalidateTag } from 'next/cache'

export const CACHE_TAGS = {
  // Homepage sections
  CAROUSEL: 'carousel-items',
  PREMIUM_EXPERIENCES: 'premium-experiences',
  CONTACT_CTA: 'contact-cta-slides',
  FEATURE_CARDS: 'feature-cards',
  PRODUCT_SHOWCASE: 'product-showcase',
  
  // Product sections
  FLASH_SALE_PRODUCTS: 'flash-sale-products',
  TOP_PICKS: 'top-picks',
  NEW_ARRIVALS: 'new-arrivals',
  TRENDING_PRODUCTS: 'trending-products',
  DAILY_FINDS: 'daily-finds',
  LUXURY_PRODUCTS: 'luxury-products',
  
  // Categories and filters
  CATEGORIES: 'categories',
  SUBCATEGORIES: 'subcategories',
  
  // User data
  WISHLIST: 'wishlist',
  CART: 'cart',
  USER_PROFILE: 'user-profile',
}

export const REVALIDATE_TIMES = {
  // Static content - rarely changes
  CATEGORIES: 3600, // 1 hour
  PREMIUM: 300, // 5 minutes
  
  // Dynamic content - changes frequently
  CAROUSEL: 60, // 1 minute
  PRODUCTS: 30, // 30 seconds
  FLASH_SALES: 10, // 10 seconds
  
  // User-specific - very dynamic
  CART: 0, // No cache
  WISHLIST: 0, // No cache
}

/**
 * Revalidate all homepage caches when content updates
 * Called by backend webhook on admin changes
 */
export async function revalidateHomepage() {
  try {
    // Revalidate individual cache tags
    revalidateTag(CACHE_TAGS.CAROUSEL)
    revalidateTag(CACHE_TAGS.PREMIUM_EXPERIENCES)
    revalidateTag(CACHE_TAGS.CONTACT_CTA)
    revalidateTag(CACHE_TAGS.FEATURE_CARDS)
    revalidateTag(CACHE_TAGS.PRODUCT_SHOWCASE)
    
    // Revalidate the entire homepage path
    revalidatePath('/', 'page')
    
    console.log('[v0] Homepage cache revalidated')
    return { success: true }
  } catch (error) {
    console.error('[v0] Homepage cache revalidation error:', error)
    return { success: false, error }
  }
}

/**
 * Revalidate all product-related caches
 * Called when products are updated in admin
 */
export async function revalidateProducts() {
  try {
    revalidateTag(CACHE_TAGS.FLASH_SALE_PRODUCTS)
    revalidateTag(CACHE_TAGS.TOP_PICKS)
    revalidateTag(CACHE_TAGS.NEW_ARRIVALS)
    revalidateTag(CACHE_TAGS.TRENDING_PRODUCTS)
    revalidateTag(CACHE_TAGS.DAILY_FINDS)
    revalidateTag(CACHE_TAGS.LUXURY_PRODUCTS)
    
    // Revalidate product pages
    revalidatePath('/products', 'page')
    
    console.log('[v0] Product caches revalidated')
    return { success: true }
  } catch (error) {
    console.error('[v0] Product cache revalidation error:', error)
    return { success: false, error }
  }
}

/**
 * Revalidate category caches
 * Called when categories are updated in admin
 */
export async function revalidateCategories() {
  try {
    revalidateTag(CACHE_TAGS.CATEGORIES)
    revalidateTag(CACHE_TAGS.SUBCATEGORIES)
    
    // Revalidate all product and category related pages
    revalidatePath('/products', 'page')
    revalidatePath('/categories', 'page')
    
    console.log('[v0] Category caches revalidated')
    return { success: true }
  } catch (error) {
    console.error('[v0] Category cache revalidation error:', error)
    return { success: false, error }
  }
}

/**
 * Revalidate user-specific caches
 * Called when user cart/wishlist changes
 */
export async function revalidateUserData(userId: string) {
  try {
    revalidatePath(`/user/${userId}`, 'page')
    console.log(`[v0] User cache revalidated for user ${userId}`)
    return { success: true }
  } catch (error) {
    console.error('[v0] User cache revalidation error:', error)
    return { success: false, error }
  }
}

/**
 * Get cache control header value based on content type
 */
export function getCacheControlHeader(type: 'static' | 'dynamic' | 'user' = 'dynamic'): string {
  switch (type) {
    case 'static':
      // Immutable assets - cache forever
      return 'public, max-age=31536000, immutable'
    case 'dynamic':
      // ISR with stale-while-revalidate
      return 'public, s-maxage=60, stale-while-revalidate=3600'
    case 'user':
      // Never cache user data
      return 'private, no-cache, no-store, must-revalidate'
    default:
      return 'public, s-maxage=10, stale-while-revalidate=60'
  }
}

/**
 * Fetch options with cache configuration
 */
export function getFetchOptions(
  revalidate: number = 60,
  tags: string[] = [],
  cache: 'force-cache' | 'no-store' | 'reload' | 'no-cache' = 'force-cache'
) {
  return {
    next: {
      revalidate,
      tags,
    },
    cache,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  } as const
}
