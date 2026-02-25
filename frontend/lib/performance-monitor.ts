/**
 * Performance Monitoring System
 * 
 * Tracks Core Web Vitals and image optimization metrics
 * Reports data to console and potential analytics services
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number // Largest Contentful Paint
  FCP?: number // First Contentful Paint
  CLS?: number // Cumulative Layout Shift
  TTFB?: number // Time to First Byte
  
  // Performance metrics
  speedIndex?: number
  totalBlockingTime?: number
  
  // Image metrics
  imageLoadTime?: number
  imageCount?: number
  totalImageSize?: number
  
  // Navigation timing
  domContentLoaded?: number
  pageLoadTime?: number
  
  timestamp?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set()

  /**
   * Initialize performance monitoring
   * Uses Web Vitals API to track Core Web Vitals
   */
  init(): void {
    if (typeof window === "undefined") return

    // Use Web Vitals if available, otherwise use standard metrics
    this.trackWebVitals()
    this.trackNavigationTiming()
    this.trackImageMetrics()

    console.log("[v0] Performance monitoring initialized")
  }

  /**
   * Track Core Web Vitals using PerformanceObserver
   */
  private trackWebVitals(): void {
    if (!("PerformanceObserver" in window)) return

    try {
      // Track Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime
        this.notifyObservers()
      })
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })

      // Track First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        this.metrics.FCP = entries[0]?.startTime
        this.notifyObservers()
      })
      fcpObserver.observe({ entryTypes: ["paint"] })

      // Track Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!("hadRecentInput" in entry) || !entry.hadRecentInput) {
            clsValue += entry.value
            this.metrics.CLS = clsValue
            this.notifyObservers()
          }
        }
      })
      clsObserver.observe({ entryTypes: ["layout-shift"] })

      // Track First Input Delay (FID) / Interaction to Next Paint (INP)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const firstEntry = entries[0]
        this.metrics.totalBlockingTime = firstEntry.processingDuration
        this.notifyObservers()
      })
      fidObserver.observe({ entryTypes: ["first-input"] })
    } catch (error) {
      console.warn("[v0] Failed to track Web Vitals:", error)
    }
  }

  /**
   * Track navigation timing metrics
   */
  private trackNavigationTiming(): void {
    if (typeof window === "undefined" || !window.performance) return

    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      if (navigation) {
        this.metrics.TTFB = navigation.responseStart - navigation.requestStart
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
        this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart
        this.metrics.timestamp = Date.now()
        this.notifyObservers()
        this.logMetrics()
      }
    })
  }

  /**
   * Track image resource metrics
   */
  private trackImageMetrics(): void {
    if (typeof window === "undefined" || !window.performance) return

    window.addEventListener("load", () => {
      const resources = performance.getEntriesByType("resource")
      const imageResources = resources.filter((r) => /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i.test(r.name))

      this.metrics.imageCount = imageResources.length
      this.metrics.imageLoadTime = imageResources.reduce((sum, r) => sum + (r.duration || 0), 0)
      this.metrics.totalImageSize = imageResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)

      if (this.metrics.imageCount > 0) {
        console.log(`[v0] Image metrics: ${this.metrics.imageCount} images, ${(this.metrics.totalImageSize / 1024).toFixed(2)}KB total`)
      }

      this.notifyObservers()
    })
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.add(callback)
    return () => this.observers.delete(callback)
  }

  /**
   * Notify all observers of metric changes
   */
  private notifyObservers(): void {
    this.observers.forEach((observer) => observer(this.getMetrics()))
  }

  /**
   * Log all metrics to console
   */
  private logMetrics(): void {
    const metrics = this.getMetrics()
    console.group("[v0] Performance Metrics")
    
    if (metrics.FCP) console.log(`First Contentful Paint (FCP): ${metrics.FCP.toFixed(2)}ms`)
    if (metrics.LCP) console.log(`Largest Contentful Paint (LCP): ${metrics.LCP.toFixed(2)}ms`)
    if (metrics.CLS) console.log(`Cumulative Layout Shift (CLS): ${metrics.CLS.toFixed(3)}`)
    if (metrics.TTFB) console.log(`Time to First Byte (TTFB): ${metrics.TTFB.toFixed(2)}ms`)
    if (metrics.domContentLoaded) console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`)
    if (metrics.pageLoadTime) console.log(`Page Load Time: ${metrics.pageLoadTime.toFixed(2)}ms`)
    if (metrics.imageCount) console.log(`Images: ${metrics.imageCount} loaded, ${(metrics.totalImageSize! / 1024).toFixed(2)}KB total`)
    
    console.groupEnd()
  }

  /**
   * Send metrics to analytics service
   */
  async sendToAnalytics(endpoint: string): Promise<void> {
    try {
      const metrics = this.getMetrics()
      if (!metrics.timestamp) metrics.timestamp = Date.now()

      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
      })
    } catch (error) {
      console.warn("[v0] Failed to send metrics to analytics:", error)
    }
  }
}

// Singleton instance
let instance: PerformanceMonitor | null = null

/**
 * Get or create the performance monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!instance) {
    instance = new PerformanceMonitor()
  }
  return instance
}

/**
 * Initialize performance monitoring (call from root layout)
 */
export function initPerformanceMonitoring(): void {
  if (typeof window !== "undefined") {
    const monitor = getPerformanceMonitor()
    monitor.init()
  }
}
