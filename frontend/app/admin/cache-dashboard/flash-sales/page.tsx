'use client'

import { useCacheMetrics, useCacheEvents } from '@/hooks/use-cache-metrics'
import { CacheHealthIndicator } from '@/components/admin/cache/cache-health-indicator'
import { Zap } from 'lucide-react'

export default function FlashSalesDashboard() {
  const { metrics, status, loading, error } = useCacheMetrics(30000)
  const { events: flashSalesEvents, loading: eventsLoading } = useCacheEvents('flash-sales', 50)

  if (error) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive">
          <p className="text-sm font-medium">Error loading dashboard: {error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1">
      <div className="space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Flash Sales Cache Performance
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of flash sale product caching and stock updates
          </p>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-background border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Hit Rate</p>
              <p className="text-3xl font-bold text-foreground">
                {metrics.flashSales.hitRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.flashSales.hits} hits / {metrics.flashSales.misses} misses
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Avg Response Time</p>
              <p className="text-3xl font-bold text-foreground">
                {metrics.flashSales.avgResponseTime.toFixed(0)}ms
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Critical for high-traffic events
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Storage Size</p>
              <p className="text-3xl font-bold text-foreground">
                {metrics.flashSales.storageSize}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Total cache storage used
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
              <p className="text-lg font-bold text-foreground">
                {metrics.flashSales.lastUpdated}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Last cache access time
              </p>
            </div>
          </div>
        )}

        {/* Health Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CacheHealthIndicator status={status} loading={loading} />
          </div>

          <div className="bg-background border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Cache Configuration</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Products TTL</p>
                <p className="text-lg font-bold text-foreground">15 minutes</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Event TTL</p>
                <p className="text-lg font-bold text-foreground">5 minutes</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <p className="text-sm text-muted-foreground">Stock updates frequently</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Alert */}
        {metrics && metrics.flashSales.hitRate < 60 && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Low Flash Sales Hit Rate
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                Hit rate is below 60%. Consider checking if the flash sale inventory is being updated frequently, or adjust cache invalidation strategy.
              </p>
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Cache Events</h3>
          
          {eventsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : flashSalesEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Layer
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Response Time
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flashSalesEvents.slice(0, 10).map((event, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            event.type === 'hit'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                              : event.type === 'miss'
                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                                : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100'
                          }`}
                        >
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {event.layer}
                      </td>
                      <td className="py-3 px-4">{event.responseTime.toFixed(2)}ms</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No cache events recorded yet
            </p>
          )}
        </div>

        {/* Performance Tips */}
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3">
            Flash Sales Cache Strategy
          </h3>
          <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
            <li>- Products cached for 15 minutes to balance freshness and performance</li>
            <li>- Events (countdown timer) cached for 5 minutes for real-time accuracy</li>
            <li>- Shorter TTL than categories because stock updates frequently</li>
            <li>- Cache auto-invalidates when admins update flash sales</li>
            <li>- Hit rates 60%+ indicate good performance during high traffic</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
