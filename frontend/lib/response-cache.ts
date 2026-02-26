/**
 * Response caching layer for API calls
 * Implements in-memory caching with TTL to reduce duplicate API requests
 * Reduces API server load and improves response times dramatically
 */

interface CachedResponse<T> {
  data: T
  timestamp: number
}

class ResponseCache {
  private cache = new Map<string, CachedResponse<any>>()
  private readonly DEFAULT_TTL = 30 * 1000 // 30 seconds
  private readonly MAX_CACHE_SIZE = 100

  get<T>(key: string, ttl = this.DEFAULT_TTL): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    const isExpired = Date.now() - item.timestamp > ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  set<T>(key: string, data: T): void {
    // Prevent memory bloat - remove oldest entry if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }
}

export const responseCache = new ResponseCache()
