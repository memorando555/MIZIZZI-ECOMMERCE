/*
  Carousel Performance Monitoring
  Tracks and logs Web Vitals for carousel loading performance
  Helps identify bottlenecks and optimization opportunities
*/

import { getCLS, getFCP, getFID, getLCP, getINP, getTTFB } from 'web-vitals'

export interface CarouselMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  cls?: number // Cumulative Layout Shift
  fid?: number // First Input Delay
  inp?: number // Interaction to Next Paint
  ttfb?: number // Time to First Byte
  carouselLoadTime?: number // Time from component mount to full image load
  lqipDisplayTime?: number // Time LQIP visible
  fullImageLoadTime?: number // Time to full image load
  timestamp?: string
  url?: string
}

class CarouselPerformanceMonitor {
  private metrics: CarouselMetrics = {}
  private startTime: number = 0
  private lqipShowTime: number = 0
  private fullImageLoadTime: number = 0

  /**
   * Initialize performance monitoring
   */
  public init() {
    this.startTime = performance.now()
    this.trackWebVitals()
  }

  /**
   * Track Web Vitals
   */
  private trackWebVitals() {
    try {
      getFCP(metric => {
        this.metrics.fcp = metric.value
      })

      getLCP(metric => {
        this.metrics.lcp = metric.value
      })

      getCLS(metric => {
        this.metrics.cls = metric.value
      })

      getFID(metric => {
        this.metrics.fid = metric.value
      })

      getINP(metric => {
        this.metrics.inp = metric.value
      })

      getTTFB(metric => {
        this.metrics.ttfb = metric.value
      })
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Record LQIP display time
   */
  public recordLQIPDisplay() {
    this.lqipShowTime = performance.now()
  }

  /**
   * Record full image load time
   */
  public recordFullImageLoad() {
    if (this.lqipShowTime > 0) {
      this.fullImageLoadTime = performance.now() - this.lqipShowTime
      this.metrics.fullImageLoadTime = this.fullImageLoadTime
    }

    const totalTime = performance.now() - this.startTime
    this.metrics.carouselLoadTime = totalTime
  }

  /**
   * Get all collected metrics
   */
  public getMetrics(): CarouselMetrics {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }
  }

  /**
   * Send metrics to analytics
   */
  public async sendMetrics(endpoint: string = '/api/analytics/carousel') {
    try {
      const metrics = this.getMetrics()
      
      // Only send if critical metrics were captured
      if (metrics.fcp || metrics.lcp) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metrics),
          keepalive: true
        })

        if (response.ok) {
          console.log('[v0] Carousel metrics sent to analytics')
        }
      }
    } catch (error) {
      console.warn('[v0] Failed to send carousel metrics:', error)
    }
  }

  /**
   * Log individual metric
   */
  private logMetric(name: string, value: number) {
    const threshold = {
      'FCP': 1800,
      'LCP': 2500,
      'CLS': 0.1,
      'FID': 100,
      'INP': 200,
      'TTFB': 600
    }

    const goal = threshold[name as keyof typeof threshold] || 0
    const status = value <= goal ? '✅' : '⚠️'
    console.log(`[v0] Carousel ${name}: ${value.toFixed(0)}ms ${status}`)
  }

  /**
   * Check if carousel meets performance targets
   */
  public isPassing(): boolean {
    const metrics = this.getMetrics()
    
    const checks = {
      fcp: (metrics.fcp || 0) <= 1800,
      lcp: (metrics.lcp || 0) <= 2500,
      cls: (metrics.cls || 0) <= 0.1,
      carouselLoad: (metrics.carouselLoadTime || 0) <= 3000
    }

    const passing = Object.values(checks).filter(Boolean).length
    const total = Object.keys(checks).length
    
    console.log(`[v0] Carousel performance: ${passing}/${total} targets met`)
    
    return passing === total
  }
}

// Create singleton instance
export const carouselMonitor = new CarouselPerformanceMonitor()

/**
 * React hook for carousel performance monitoring
 */
export function useCarouselPerformance() {
  const recordLQIPDisplay = () => carouselMonitor.recordLQIPDisplay()
  const recordFullImageLoad = () => carouselMonitor.recordFullImageLoad()
  const getMetrics = () => carouselMonitor.getMetrics()
  const isPassing = () => carouselMonitor.isPassing()
  const sendMetrics = async () => carouselMonitor.sendMetrics()

  return {
    recordLQIPDisplay,
    recordFullImageLoad,
    getMetrics,
    isPassing,
    sendMetrics
  }
}
