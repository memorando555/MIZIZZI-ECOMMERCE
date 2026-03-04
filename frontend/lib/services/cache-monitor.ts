'use client'

/**
 * Cache Monitoring Service
 * 
 * Tracks and aggregates cache performance metrics for:
 * - Categories caching (24h TTL, sessionStorage → localStorage → server)
 * - Flash sales caching (15min TTL for products, 5min for events)
 * 
 * Provides real-time cache status for admin dashboard
 */

interface CacheEvent {
  timestamp: number
  type: 'hit' | 'miss' | 'invalidation' | 'error'
  source: 'categories' | 'flash-sales'
  layer: 'sessionStorage' | 'localStorage' | 'server'
  responseTime: number
  error?: string
}

interface CacheMetrics {
  categories: {
    hits: number
    misses: number
    hitRate: number
    avgResponseTime: number
    lastUpdated: string
    cachedCount: number
    expiredCount: number
    storageSize: string
    lastInvalidation: string | null
  }
  flashSales: {
    hits: number
    misses: number
    hitRate: number
    avgResponseTime: number
    lastUpdated: string
    cachedCount: number
    expiredCount: number
    storageSize: string
    lastInvalidation: string | null
  }
  system: {
    totalRequests: number
    overallHitRate: number
    peakTraffic: number
    storageUsed: string
    errorRate: number
    uptime: number
    lastSync: string
  }
}

interface CacheStatus {
  isHealthy: boolean
  status: 'excellent' | 'good' | 'warning' | 'critical'
  issues: string[]
  recommendations: string[]
}

class CacheMonitoringService {
  private events: CacheEvent[] = []
  private maxEvents = 1000 // Keep last 1000 events
  private readonly CATEGORY_CACHE_KEY = 'mizizzi_categories_cache'
  private readonly CATEGORY_EXPIRY_KEY = 'mizizzi_categories_cache_expiry'
  private readonly FLASH_SALES_CACHE_KEY = 'mizizzi_flash_sales_cache'
  private readonly FLASH_SALES_EXPIRY_KEY = 'mizizzi_flash_sales_cache_expiry'
  private readonly EVENT_CACHE_KEY = 'mizizzi_flash_sale_event_cache'
  private readonly EVENT_EXPIRY_KEY = 'mizizzi_flash_sale_event_expiry'
  private startTime = Date.now()

  /**
   * Record a cache event (hit, miss, invalidation, error)
   */
  recordEvent(event: Omit<CacheEvent, 'timestamp'>) {
    this.events.push({
      ...event,
      timestamp: Date.now(),
    })

    // Maintain rolling window of events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }

  /**
   * Get aggregated cache metrics
   */
  getMetrics(): CacheMetrics {
    const now = Date.now()
    const categoryEvents = this.events.filter(e => e.source === 'categories')
    const flashSalesEvents = this.events.filter(e => e.source === 'flash-sales')

    const calculateMetrics = (events: CacheEvent[]) => {
      const hits = events.filter(e => e.type === 'hit').length
      const misses = events.filter(e => e.type === 'miss').length
      const total = hits + misses
      const hitRate = total > 0 ? (hits / total) * 100 : 0
      const avgResponseTime = events.length > 0
        ? events.reduce((sum, e) => sum + e.responseTime, 0) / events.length
        : 0

      return { hits, misses, total, hitRate, avgResponseTime }
    }

    const categoriesMetrics = calculateMetrics(categoryEvents)
    const flashSalesMetrics = calculateMetrics(flashSalesEvents)
    const allMetrics = calculateMetrics(this.events)

    // Get cache storage info
    const categoryStorageSize = this.getStorageSize(this.CATEGORY_CACHE_KEY)
    const flashSalesStorageSize = this.getStorageSize(this.FLASH_SALES_CACHE_KEY)
    const totalStorageSize = categoryStorageSize + flashSalesStorageSize

    // Get last invalidation times
    const categoryLastInvalidation = this.getLastInvalidationTime('categories')
    const flashSalesLastInvalidation = this.getLastInvalidationTime('flash-sales')

    // Get cache counts and expired counts
    const categoryInfo = this.getCacheInfo(
      this.CATEGORY_CACHE_KEY,
      this.CATEGORY_EXPIRY_KEY
    )
    const flashSalesInfo = this.getCacheInfo(
      this.FLASH_SALES_CACHE_KEY,
      this.FLASH_SALES_EXPIRY_KEY
    )

    return {
      categories: {
        hits: categoriesMetrics.hits,
        misses: categoriesMetrics.misses,
        hitRate: Math.round(categoriesMetrics.hitRate * 100) / 100,
        avgResponseTime: Math.round(categoriesMetrics.avgResponseTime * 100) / 100,
        lastUpdated: this.getLastUpdateTime('categories'),
        cachedCount: categoryInfo.isValid ? 1 : 0,
        expiredCount: categoryInfo.isExpired ? 1 : 0,
        storageSize: this.formatBytes(categoryStorageSize),
        lastInvalidation: categoryLastInvalidation,
      },
      flashSales: {
        hits: flashSalesMetrics.hits,
        misses: flashSalesMetrics.misses,
        hitRate: Math.round(flashSalesMetrics.hitRate * 100) / 100,
        avgResponseTime: Math.round(flashSalesMetrics.avgResponseTime * 100) / 100,
        lastUpdated: this.getLastUpdateTime('flash-sales'),
        cachedCount: flashSalesInfo.isValid ? 1 : 0,
        expiredCount: flashSalesInfo.isExpired ? 1 : 0,
        storageSize: this.formatBytes(flashSalesStorageSize),
        lastInvalidation: flashSalesLastInvalidation,
      },
      system: {
        totalRequests: this.events.length,
        overallHitRate: Math.round(allMetrics.hitRate * 100) / 100,
        peakTraffic: this.calculatePeakTraffic(),
        storageUsed: this.formatBytes(totalStorageSize),
        errorRate: this.calculateErrorRate(),
        uptime: Math.round((now - this.startTime) / 1000), // seconds
        lastSync: new Date(now).toISOString(),
      },
    }
  }

  /**
   * Get overall cache health status
   */
  getStatus(): CacheStatus {
    const metrics = this.getMetrics()
    const issues: string[] = []
    const recommendations: string[] = []

    // Check categories hit rate
    if (metrics.categories.hitRate < 50) {
      issues.push('Categories cache hit rate below 50%')
      recommendations.push('Check cache invalidation frequency and TTL settings')
    }

    // Check flash sales hit rate
    if (metrics.flashSales.hitRate < 60) {
      issues.push('Flash sales cache hit rate below 60%')
      recommendations.push('Consider increasing flash sales cache TTL')
    }

    // Check response times
    if (metrics.categories.avgResponseTime > 500) {
      issues.push('Categories average response time exceeds 500ms')
      recommendations.push('Check server performance and cache invalidation')
    }

    if (metrics.flashSales.avgResponseTime > 500) {
      issues.push('Flash sales average response time exceeds 500ms')
      recommendations.push('Optimize flash sales data structure or API endpoint')
    }

    // Check storage usage
    const storageUsagePercent = this.estimateStorageUsagePercent()
    if (storageUsagePercent > 80) {
      issues.push(`Local storage usage at ${storageUsagePercent}%`)
      recommendations.push('Consider clearing old cache entries or reducing TTL')
    }

    // Check recent errors
    const recentErrors = this.events.filter(
      e => e.type === 'error' && (Date.now() - e.timestamp) < 5 * 60 * 1000
    )
    if (recentErrors.length > 5) {
      issues.push(`${recentErrors.length} cache errors in last 5 minutes`)
      recommendations.push('Check browser console for error details')
    }

    // Determine overall status
    let status: 'excellent' | 'good' | 'warning' | 'critical'
    if (issues.length === 0) {
      status = 'excellent'
    } else if (issues.length <= 2) {
      status = 'good'
    } else if (issues.length <= 4) {
      status = 'warning'
    } else {
      status = 'critical'
    }

    return {
      isHealthy: status === 'excellent' || status === 'good',
      status,
      issues,
      recommendations,
    }
  }

  /**
   * Get cache events for the analytics view
   */
  getEvents(
    source?: 'categories' | 'flash-sales',
    limit: number = 100
  ): CacheEvent[] {
    let filtered = this.events
    if (source) {
      filtered = filtered.filter(e => e.source === source)
    }
    return filtered.slice(-limit).reverse()
  }

  /**
   * Clear cache monitoring data (for admin reset)
   */
  clearData() {
    this.events = []
    this.startTime = Date.now()
  }

  // ===== PRIVATE HELPERS =====

  private getStorageSize(key: string): number {
    try {
      if (typeof window === 'undefined') return 0
      const data = localStorage.getItem(key) || sessionStorage.getItem(key)
      return data ? new Blob([data]).size : 0
    } catch (error) {
      return 0
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  private getLastUpdateTime(source: 'categories' | 'flash-sales'): string {
    const recentEvent = this.events
      .filter(e => e.source === source)
      .sort((a, b) => b.timestamp - a.timestamp)[0]
    return recentEvent
      ? new Date(recentEvent.timestamp).toLocaleTimeString()
      : 'Never'
  }

  private getLastInvalidationTime(source: 'categories' | 'flash-sales'): string | null {
    const invalidationEvent = this.events
      .filter(e => e.source === source && e.type === 'invalidation')
      .sort((a, b) => b.timestamp - a.timestamp)[0]
    return invalidationEvent
      ? new Date(invalidationEvent.timestamp).toLocaleTimeString()
      : null
  }

  private getCacheInfo(cacheKey: string, expiryKey: string) {
    try {
      if (typeof window === 'undefined') {
        return { isValid: false, isExpired: false }
      }
      const data = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey)
      const expiry = localStorage.getItem(expiryKey)

      if (!data) return { isValid: false, isExpired: false }

      if (expiry) {
        const isExpired = Date.now() > parseInt(expiry)
        return { isValid: !isExpired, isExpired }
      }

      return { isValid: true, isExpired: false }
    } catch (error) {
      return { isValid: false, isExpired: false }
    }
  }

  private calculatePeakTraffic(): number {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    return this.events.filter(e => e.timestamp > oneHourAgo).length
  }

  private calculateErrorRate(): number {
    if (this.events.length === 0) return 0
    const errors = this.events.filter(e => e.type === 'error').length
    return Math.round((errors / this.events.length) * 10000) / 100
  }

  private estimateStorageUsagePercent(): number {
    // Rough estimate: browsers typically allow 5-50MB for localStorage
    // We're assuming 10MB limit for this estimate
    const limit = 10 * 1024 * 1024
    const used = this.getStorageSize(this.CATEGORY_CACHE_KEY) +
                 this.getStorageSize(this.FLASH_SALES_CACHE_KEY)
    return Math.round((used / limit) * 100)
  }
}

// Export singleton instance
export const cacheMonitor = new CacheMonitoringService()

export type { CacheMetrics, CacheStatus, CacheEvent }
