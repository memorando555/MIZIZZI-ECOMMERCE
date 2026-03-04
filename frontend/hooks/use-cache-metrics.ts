'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { CacheMetrics, CacheStatus } from '@/lib/services/cache-monitor'

interface UseCacheMetricsReturn {
  metrics: CacheMetrics | null
  status: CacheStatus | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  isPolling: boolean
}

export function useCacheMetrics(
  pollInterval: number = 30000 // 30 seconds
): UseCacheMetricsReturn {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null)
  const [status, setStatus] = useState<CacheStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null)
      
      // Fetch both metrics and status in parallel
      const [metricsRes, statusRes] = await Promise.all([
        fetch('/api/admin/cache-metrics', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }),
        fetch('/api/admin/cache-status', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }),
      ])

      if (!metricsRes.ok || !statusRes.ok) {
        throw new Error('Failed to fetch cache metrics')
      }

      const metricsData = await metricsRes.json()
      const statusData = await statusRes.json()

      setMetrics(metricsData.data?.metrics || null)
      setStatus(statusData.data || null)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Set up polling
  useEffect(() => {
    if (pollInterval <= 0) return

    setIsPolling(true)
    pollingRef.current = setInterval(() => {
      fetchMetrics().catch(err => console.error('[cache-metrics] Polling error:', err))
    }, pollInterval)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
      setIsPolling(false)
    }
  }, [pollInterval, fetchMetrics])

  return {
    metrics,
    status,
    loading,
    error,
    refresh: fetchMetrics,
    isPolling,
  }
}

/**
 * Hook for fetching cache events (logs)
 */
interface UseCacheEventsReturn {
  events: any[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useCacheEvents(
  source?: 'categories' | 'flash-sales',
  limit: number = 100
): UseCacheEventsReturn {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setError(null)
      
      const params = new URLSearchParams()
      if (source) params.append('source', source)
      params.append('limit', limit.toString())

      const res = await fetch(`/api/admin/cache-events?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch cache events')
      }

      const data = await res.json()
      setEvents(data.data?.events || [])
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }, [source, limit])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    loading,
    error,
    refresh: fetchEvents,
  }
}
