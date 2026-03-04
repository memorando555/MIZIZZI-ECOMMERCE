/**
 * Response caching and revalidation for faster auth data retrieval
 * Uses Next.js 16 cache directives for intelligent caching
 */

import { revalidateTag, updateTag } from 'next/cache'

export const CACHE_TAGS = {
  // Auth-related cache tags
  AUTH_USER: 'auth-user',
  AUTH_SESSION: 'auth-session',
  USER_PROFILE: 'user-profile',
  
  // Products and content
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  CAROUSEL: 'carousel',
  TRENDING: 'trending-products',
  NEW_ARRIVALS: 'new-arrivals',
  FLASH_SALE: 'flash-sale',
  
  // Admin
  ADMIN_ORDERS: 'admin-orders',
  ADMIN_PRODUCTS: 'admin-products',
} as const

/**
 * Cache time profiles for revalidateTag with stale-while-revalidate
 * Using Next.js 16's new cacheLife profiles
 */
export const CACHE_LIFETIMES = {
  // Very short cache for auth (5 seconds, revalidate immediately after)
  AUTH_SHORT: 5,
  
  // Auth user profile (30 seconds fast, then revalidate)
  AUTH_PROFILE: 30,
  
  // Product data (5 minutes, then background refresh)
  PRODUCTS_MEDIUM: 5 * 60,
  
  // Slower-changing data (1 hour)
  CATEGORIES_LONG: 60 * 60,
  
  // Admin data (1 minute for freshness)
  ADMIN_SHORT: 60,
} as const

/**
 * Revalidate auth-related cache immediately
 */
export async function revalidateAuthCache(): Promise<void> {
  try {
    revalidateTag(CACHE_TAGS.AUTH_USER)
    revalidateTag(CACHE_TAGS.AUTH_SESSION)
    updateTag(CACHE_TAGS.AUTH_USER)
  } catch (error) {
    console.error('[Cache] Error revalidating auth:', error)
  }
}

/**
 * Revalidate user profile cache
 */
export async function revalidateUserProfile(): Promise<void> {
  try {
    revalidateTag(CACHE_TAGS.USER_PROFILE)
    updateTag(CACHE_TAGS.USER_PROFILE)
  } catch (error) {
    console.error('[Cache] Error revalidating profile:', error)
  }
}

/**
 * Revalidate products cache
 */
export async function revalidateProducts(): Promise<void> {
  try {
    revalidateTag(CACHE_TAGS.PRODUCTS)
    revalidateTag(CACHE_TAGS.TRENDING)
    revalidateTag(CACHE_TAGS.NEW_ARRIVALS)
  } catch (error) {
    console.error('[Cache] Error revalidating products:', error)
  }
}

/**
 * Revalidate all caches
 */
export async function revalidateAllCaches(): Promise<void> {
  try {
    Object.values(CACHE_TAGS).forEach(tag => {
      revalidateTag(tag)
    })
  } catch (error) {
    console.error('[Cache] Error revalidating all caches:', error)
  }
}

/**
 * Set response cache headers for API routes
 */
export function getCacheHeaders(seconds: number = 30, revalidate: boolean = true) {
  return {
    'Cache-Control': `public, max-age=${seconds}${revalidate ? ', stale-while-revalidate=86400' : ''}`,
  }
}

/**
 * Middleware to add cache headers to responses
 */
export function withCacheControl(seconds: number = 30) {
  return (response: Response) => {
    const newResponse = response.clone()
    newResponse.headers.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=86400`)
    return newResponse
  }
}
