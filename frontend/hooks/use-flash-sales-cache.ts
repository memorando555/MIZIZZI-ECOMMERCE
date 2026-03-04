'use client'

import { useEffect, useRef, useState } from 'react'
import type { FlashSaleProduct, FlashSaleEvent } from '@/lib/server/get-flash-sale-products'
import { recordCacheMetric } from '@/lib/performance-metrics'

const CACHE_KEY = 'mizizzi_flash_sales_cache'
const EVENT_CACHE_KEY = 'mizizzi_flash_sale_event_cache'
const CACHE_EXPIRY_KEY = 'mizizzi_flash_sales_cache_expiry'
const EVENT_EXPIRY_KEY = 'mizizzi_flash_sale_event_expiry'

// Flash sales expire faster than categories (15 mins vs 24h) due to stock updates
const PRODUCTS_CACHE_TTL = 15 * 60 * 1000 // 15 minutes
const EVENT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes (countdown updates frequently)

interface CacheEntry {
  data: FlashSaleProduct[]
  timestamp: number
}

interface EventCacheEntry {
  data: FlashSaleEvent
  timestamp: number
}

/**
 * 3-Layer Browser Cache for Flash Sales with Intelligent Expiry
 * 
 * Layer 1: sessionStorage - Fast, same-session persistence (~50ms)
 * Layer 2: localStorage - Cross-session persistence (15min for products, 5min for events)
 * Layer 3: Server fallback - Fresh data if cache expired
 * 
 * Optimized for:
 * ✓ Quick page loads during high-traffic periods (Black Friday, sales events)
 * ✓ Stock updates (shorter TTL than categories)
 * ✓ Countdown timer accuracy (event cache expires faster)
 * ✓ Real-time stock tracking (items_left updates)
 */

export function useFlashSalesCache(serverProducts: FlashSaleProduct[], serverEvent: FlashSaleEvent | null) {
  const [products, setProducts] = useState<FlashSaleProduct[]>(serverProducts)
  const [event, setEvent] = useState<FlashSaleEvent | null>(serverEvent)
  const [isFromCache, setIsFromCache] = useState(false)
  const cacheChecked = useRef(false)

  useEffect(() => {
    if (cacheChecked.current) return
    cacheChecked.current = true

    if (typeof window === 'undefined') return

    const startTime = performance.now()
    let cacheSource: 'server' | 'sessionStorage' | 'localStorage' = 'server'
    let cacheHit = false

    try {
      // ===== PRODUCTS CACHE =====

      // Layer 1: Check sessionStorage (fastest)
      const sessionCache = sessionStorage.getItem(CACHE_KEY)
      if (sessionCache) {
        try {
          const parsed: CacheEntry = JSON.parse(sessionCache)
          if (Array.isArray(parsed.data) && parsed.data.length > 0) {
            setProducts(parsed.data)
            cacheHit = true
            cacheSource = 'sessionStorage'
            recordCacheMetric(true, 'sessionStorage', performance.now() - startTime, 'flash-sales')
          }
        } catch (e) {
          // Invalid cached data, continue to next layer
        }
      }

      // Layer 2: Check localStorage if sessionStorage miss
      if (!cacheHit) {
        const localCache = localStorage.getItem(CACHE_KEY)
        const localExpiry = localStorage.getItem(CACHE_EXPIRY_KEY)

        if (localCache && localExpiry) {
          const now = Date.now()
          const expiryTime = parseInt(localExpiry, 10)

          if (now < expiryTime) {
            try {
              const parsed: CacheEntry = JSON.parse(localCache)
              if (Array.isArray(parsed.data) && parsed.data.length > 0) {
                setProducts(parsed.data)
                cacheHit = true
                cacheSource = 'localStorage'

                // Promote to sessionStorage for faster next access
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                  data: parsed.data,
                  timestamp: parsed.timestamp,
                }))
                recordCacheMetric(true, 'localStorage', performance.now() - startTime, 'flash-sales')
              }
            } catch (e) {
              // Invalid cached data, continue
            }
          } else {
            // Cache expired, remove it
            localStorage.removeItem(CACHE_KEY)
            localStorage.removeItem(CACHE_EXPIRY_KEY)
          }
        }
      }

      // Layer 3: Use fresh server data and cache it
      if (!cacheHit && serverProducts && serverProducts.length > 0) {
        const cacheEntry: CacheEntry = {
          data: serverProducts,
          timestamp: Date.now(),
        }

        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry))
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry))
        localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + PRODUCTS_CACHE_TTL).toString())
      }

      // ===== EVENT CACHE =====

      let eventCacheHit = false

      // Layer 1: Check sessionStorage
      const eventSessionCache = sessionStorage.getItem(EVENT_CACHE_KEY)
      if (eventSessionCache) {
        try {
          const parsed: EventCacheEntry = JSON.parse(eventSessionCache)
          if (parsed.data) {
            setEvent(parsed.data)
            eventCacheHit = true
          }
        } catch (e) {
          // Continue
        }
      }

      // Layer 2: Check localStorage if sessionStorage miss
      if (!eventCacheHit) {
        const eventLocalCache = localStorage.getItem(EVENT_CACHE_KEY)
        const eventExpiry = localStorage.getItem(EVENT_EXPIRY_KEY)

        if (eventLocalCache && eventExpiry) {
          const now = Date.now()
          const expiryTime = parseInt(eventExpiry, 10)

          if (now < expiryTime) {
            try {
              const parsed: EventCacheEntry = JSON.parse(eventLocalCache)
              if (parsed.data) {
                setEvent(parsed.data)
                eventCacheHit = true

                // Promote to sessionStorage
                sessionStorage.setItem(EVENT_CACHE_KEY, JSON.stringify({
                  data: parsed.data,
                  timestamp: parsed.timestamp,
                }))
              }
            } catch (e) {
              // Continue
            }
          } else {
            // Cache expired
            localStorage.removeItem(EVENT_CACHE_KEY)
            localStorage.removeItem(EVENT_EXPIRY_KEY)
          }
        }
      }

      // Layer 3: Use fresh server event data
      if (!eventCacheHit && serverEvent) {
        const eventCacheEntry: EventCacheEntry = {
          data: serverEvent,
          timestamp: Date.now(),
        }

        sessionStorage.setItem(EVENT_CACHE_KEY, JSON.stringify(eventCacheEntry))
        localStorage.setItem(EVENT_CACHE_KEY, JSON.stringify(eventCacheEntry))
        localStorage.setItem(EVENT_EXPIRY_KEY, (Date.now() + EVENT_CACHE_TTL).toString())
      }

      // Record metrics
      if (cacheHit) {
        setIsFromCache(true)
        recordCacheMetric(true, cacheSource, performance.now() - startTime, 'flash-sales')
      } else {
        recordCacheMetric(false, 'server', performance.now() - startTime, 'flash-sales')
      }

    } catch (error) {
      console.warn('[v0] Flash sales cache storage error:', error)
    }
  }, [serverProducts, serverEvent])

  return {
    products,
    event,
    isFromCache,
  }
}

/**
 * Clear flash sales cache (called on logout or manual refresh)
 */
export function clearFlashSalesCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_EXPIRY_KEY)
    sessionStorage.removeItem(EVENT_CACHE_KEY)
    localStorage.removeItem(EVENT_CACHE_KEY)
    localStorage.removeItem(EVENT_EXPIRY_KEY)
  } catch (error) {
    console.warn('[v0] Error clearing flash sales cache:', error)
  }
}

/**
 * Get cached flash sales products synchronously
 */
export function getCachedFlashSales(): FlashSaleProduct[] | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed: CacheEntry = JSON.parse(cached)
      return Array.isArray(parsed.data) ? parsed.data : null
    }
    return null
  } catch (error) {
    console.warn('[v0] Error reading flash sales cache:', error)
    return null
  }
}

/**
 * Get cached flash sale event synchronously
 */
export function getCachedFlashSaleEvent(): FlashSaleEvent | null {
  try {
    const cached = sessionStorage.getItem(EVENT_CACHE_KEY) || localStorage.getItem(EVENT_CACHE_KEY)
    if (cached) {
      const parsed: EventCacheEntry = JSON.parse(cached)
      return parsed.data || null
    }
    return null
  } catch (error) {
    console.warn('[v0] Error reading flash sale event cache:', error)
    return null
  }
}

/**
 * Invalidate flash sales cache (called when admin updates flash sales)
 * Smaller timeout than categories since stock changes frequently
 */
export function invalidateFlashSalesCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_EXPIRY_KEY)
    sessionStorage.removeItem(EVENT_CACHE_KEY)
    localStorage.removeItem(EVENT_EXPIRY_KEY)
  } catch (error) {
    console.warn('[v0] Error invalidating flash sales cache:', error)
  }
}
