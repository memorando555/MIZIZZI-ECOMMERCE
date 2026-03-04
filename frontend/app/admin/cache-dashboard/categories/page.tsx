'use client'

import { useCacheMetrics, useCacheEvents } from '@/hooks/use-cache-metrics'
import { KPICards } from '@/components/admin/cache/kpi-cards'
import { CacheHealthIndicator } from '@/components/admin/cache/cache-health-indicator'

export default function CategoriesDashboard() {
  const { metrics, status, loading, error } = useCacheMetrics(30000)
  const { events: categoryEvents, loading: eventsLoading } = useCacheEvents('categories', 50)

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Categories Cache Performance
          </h1>
          <p className="text-muted-foreground mt-1">
            Detailed analysis of category caching performance
          </p>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-background border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Hit Rate</p>
              <p className="text-3xl font-bold text-foreground">
                {metrics.categories.hitRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.categories.hits} hits / {metrics.categories.misses} misses
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Avg Response Time</p>
              <p className="text-3xl font-bold text-foreground">
                {metrics.categories.avgResponseTime.toFixed(0)}ms
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Fastest cache layer response
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Storage Size</p>
              <p className="text-3xl font-bold text-foreground">
                {metrics.categories.storageSize}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Total cache storage used
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
              <p className="text-lg font-bold text-foreground">
                {metrics.categories.lastUpdated}
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
            <h3 className="text-lg font-semibold mb-4 text-foreground">Cache Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cache TTL</p>
                <p className="text-lg font-bold text-foreground">24 hours</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Cached</p>
                <p className="text-lg font-bold text-foreground">
                  {metrics?.categories.cachedCount ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Expired</p>
                <p className="text-lg font-bold text-foreground">
                  {metrics?.categories.expiredCount ?? '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Cache Events</h3>
          
          {eventsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : categoryEvents.length > 0 ? (
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
                  {categoryEvents.slice(0, 10).map((event, i) => (
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
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Performance Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>- Categories are cached for 24 hours with 3-layer browser caching</li>
            <li>- Hit rate above 70% indicates optimal cache performance</li>
            <li>- Cache is automatically invalidated when admins update categories</li>
            <li>- Response times under 100ms indicate successful cache hits</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
