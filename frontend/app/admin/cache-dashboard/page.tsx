'use client'

import { useState } from 'react'
import { RefreshCw, Download } from 'lucide-react'
import { useCacheMetrics } from '@/hooks/use-cache-metrics'
import { KPICards } from '@/components/admin/cache/kpi-cards'
import { CacheHealthIndicator } from '@/components/admin/cache/cache-health-indicator'
import { CacheCharts } from '@/components/admin/cache/cache-charts'
import { CacheDetailsTable } from '@/components/admin/cache/cache-details-table'

export default function CacheDashboard() {
  const { metrics, status, loading, error, refresh, isPolling } = useCacheMetrics(30000)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = () => {
    if (!metrics) return

    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      status,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cache-metrics-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="flex-1">
      <div className="space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Cache Performance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time monitoring of categories and flash sales cache
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleExport}
              disabled={!metrics}
              className="px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive">
            <p className="text-sm font-medium">Error loading cache metrics: {error}</p>
          </div>
        )}

        {/* Polling Status */}
        {isPolling && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Auto-refreshing every 30 seconds
            </p>
          </div>
        )}

        {/* KPI Cards */}
        <KPICards metrics={metrics} loading={loading} />

        {/* Health Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CacheHealthIndicator status={status} loading={loading} />
          </div>

          {/* Quick Stats */}
          <div className="bg-background border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Categories Hit Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics?.categories.hitRate.toFixed(1) ?? '-'}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Flash Sales Hit Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics?.flashSales.hitRate.toFixed(1) ?? '-'}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">System Uptime</p>
                <p className="text-lg font-bold text-foreground">
                  {metrics && metrics.system.uptime > 0
                    ? `${Math.floor(metrics.system.uptime / 60)}m ${metrics.system.uptime % 60}s`
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <CacheCharts metrics={metrics} loading={loading} />

        {/* Detailed Metrics Table */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-4">
            Detailed Metrics
          </h2>
          <CacheDetailsTable metrics={metrics} loading={loading} />
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground border-t border-border pt-4">
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
          <p className="mt-1">
            Metrics collected from browser cache storage (sessionStorage, localStorage) and server responses
          </p>
        </div>
      </div>
    </main>
  )
}
