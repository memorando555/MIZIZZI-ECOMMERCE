'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, RefreshCw, Trash2, Eye, EyeOff } from 'lucide-react'

interface CacheStatus {
  sessionStorage: { count: number; size: string }
  localStorage: { count: number; size: string; expiresIn: string }
  serverCache: { status: string; ttl: number }
}

interface PerformanceStats {
  pageLoadTime: string
  cacheHits: number
  cacheMisses: number
  apiCalls: number
  averageApiTime: string
}

export function PerformanceMonitorWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null)
  const [perfStats, setPerfStats] = useState<PerformanceStats | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  const CACHE_KEY = 'mizizzi_categories_cache'
  const CACHE_EXPIRY_KEY = 'mizizzi_categories_cache_expiry'

  useEffect(() => {
    const updateStats = () => {
      if (typeof window === 'undefined') return

      // Check sessionStorage
      const sessionCache = sessionStorage.getItem(CACHE_KEY)
      const sessionSize = sessionCache ? (new Blob([sessionCache]).size / 1024).toFixed(2) + 'KB' : '0KB'
      const sessionCount = sessionCache ? JSON.parse(sessionCache)?.data?.length || 0 : 0

      // Check localStorage
      const localCache = localStorage.getItem(CACHE_KEY)
      const localSize = localCache ? (new Blob([localCache]).size / 1024).toFixed(2) + 'KB' : '0KB'
      const localCount = localCache ? JSON.parse(localCache)?.data?.length || 0 : 0
      
      const expiryTime = localStorage.getItem(CACHE_EXPIRY_KEY)
      let expiresIn = 'N/A'
      if (expiryTime) {
        const remaining = Math.max(0, (parseInt(expiryTime, 10) - Date.now()) / 1000)
        const hours = Math.floor(remaining / 3600)
        const minutes = Math.floor((remaining % 3600) / 60)
        expiresIn = remaining > 0 ? `${hours}h ${minutes}m` : 'Expired'
      }

      setCacheStatus({
        sessionStorage: { count: sessionCount, size: sessionSize },
        localStorage: { count: localCount, size: localSize, expiresIn },
        serverCache: { status: 'Active', ttl: 3600 }
      })

      // Get performance metrics from window
      if ((window as any).performanceStats) {
        setPerfStats((window as any).performanceStats)
      }
    }

    updateStats()
    const interval = setInterval(updateStats, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleClearCache = () => {
    sessionStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_EXPIRY_KEY)
    setCacheStatus({
      sessionStorage: { count: 0, size: '0KB' },
      localStorage: { count: 0, size: '0KB', expiresIn: 'N/A' },
      serverCache: { status: 'Active', ttl: 3600 }
    })
    console.log('[v0] Cache cleared successfully')
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-cherry-600 text-white rounded-full shadow-lg hover:bg-cherry-700 z-40"
        title="Show Performance Monitor"
      >
        <Eye className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 font-mono text-sm">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3 bg-gradient-to-r from-cherry-600 to-cherry-700 text-white rounded-t-lg cursor-pointer hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="font-semibold">Performance Monitor (Dev)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsVisible(false)
            }}
            className="p-1 hover:bg-white/20 rounded"
            title="Hide"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Cache Status */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Cache Status</h3>
            
            {/* sessionStorage */}
            <div className="bg-blue-50 p-2 rounded border border-blue-200">
              <div className="flex justify-between">
                <span className="text-blue-900">sessionStorage:</span>
                <span className="text-blue-600 font-semibold">
                  {cacheStatus?.sessionStorage.count > 0 ? '✓' : '✗'} 
                  {cacheStatus?.sessionStorage.count} items
                </span>
              </div>
              <div className="text-xs text-blue-700 ml-4">Size: {cacheStatus?.sessionStorage.size}</div>
            </div>

            {/* localStorage */}
            <div className="bg-green-50 p-2 rounded border border-green-200">
              <div className="flex justify-between">
                <span className="text-green-900">localStorage:</span>
                <span className="text-green-600 font-semibold">
                  {cacheStatus?.localStorage.count > 0 ? '✓' : '✗'} 
                  {cacheStatus?.localStorage.count} items
                </span>
              </div>
              <div className="text-xs text-green-700 ml-4">
                Size: {cacheStatus?.localStorage.size} | Expires: {cacheStatus?.localStorage.expiresIn}
              </div>
            </div>

            {/* Server Cache */}
            <div className="bg-purple-50 p-2 rounded border border-purple-200">
              <div className="flex justify-between">
                <span className="text-purple-900">Server Cache (3600s TTL):</span>
                <span className="text-purple-600 font-semibold">{cacheStatus?.serverCache.status}</span>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          {perfStats && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">Performance</h3>
              <div className="bg-gray-50 p-2 rounded space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Page Load:</span>
                  <span className="font-semibold">{perfStats.pageLoadTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Hits:</span>
                  <span className="font-semibold text-green-600">{perfStats.cacheHits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Misses:</span>
                  <span className="font-semibold text-orange-600">{perfStats.cacheMisses}</span>
                </div>
                <div className="flex justify-between">
                  <span>API Calls:</span>
                  <span className="font-semibold">{perfStats.apiCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg API Time:</span>
                  <span className="font-semibold">{perfStats.averageApiTime}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cache Info */}
          <div className="bg-amber-50 p-2 rounded border border-amber-200 text-xs text-amber-900">
            <div className="font-semibold mb-1">Cache Layers</div>
            <div className="space-y-1">
              <div>L1: sessionStorage - Same session (&lt;50ms)</div>
              <div>L2: localStorage - 24h persistence (&lt;100ms)</div>
              <div>L3: Server - 1h TTL (&lt;500ms)</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                window.location.reload()
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              Reload
            </button>
            <button
              onClick={handleClearCache}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
            >
              <Trash2 className="w-3 h-3" />
              Clear Cache
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
