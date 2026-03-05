'use client'

/**
 * Performance monitoring utility for categories and flash sales caching
 * Log performance metrics to admin dashboard and identify optimization benefits
 */

interface PerformanceMetrics {
  serverDataTime: number
  cacheHitTime: number
  isCached: boolean
  cacheSource: 'sessionStorage' | 'localStorage' | 'server'
}

let metrics: PerformanceMetrics[] = []
let cacheMonitor: any = null

// Lazy load cache monitor to avoid circular dependencies
function getCacheMonitor() {
  if (!cacheMonitor && typeof window !== 'undefined') {
    try {
      const module = require('@/lib/services/cache-monitor')
      cacheMonitor = module.cacheMonitor
    } catch (e) {
      // Gracefully fail if cache monitor is not available
      return null
    }
  }
  return cacheMonitor
}

export function recordCacheMetric(
  isCached: boolean,
  source: 'sessionStorage' | 'localStorage' | 'server',
  time: number,
  cacheType: 'categories' | 'flash-sales' = 'categories'
) {
  metrics.push({
    serverDataTime: 0,
    cacheHitTime: time,
    isCached,
    cacheSource: source,
  })

  // Record event in cache monitor for admin dashboard
  try {
    const monitor = getCacheMonitor()
    if (monitor) {
      monitor.recordEvent({
        type: isCached ? 'hit' : 'miss',
        source: cacheType,
        layer: source === 'server' ? 'server' : (source as 'sessionStorage' | 'localStorage'),
        responseTime: time,
      })
    }
  } catch (error) {
    // Silently fail if monitor service has issues
  }

  // Log to console only in development
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[v0] ${cacheType} loaded from ${source} in ${time}ms (cached: ${isCached})`
    )
  }
}

export function getPerformanceMetrics() {
  if (metrics.length === 0) return null

  const avgCacheTime =
    metrics.reduce((sum, m) => sum + m.cacheHitTime, 0) / metrics.length
  const cachedCount = metrics.filter((m) => m.isCached).length
  const cacheHitRate = (cachedCount / metrics.length) * 100

  return {
    totalLoads: metrics.length,
    averageLoadTime: avgCacheTime,
    cacheHitRate: cacheHitRate.toFixed(2),
    lastMetric: metrics[metrics.length - 1],
  }
}

export function resetMetrics() {
  metrics = []
}

