'use client'

import { ArrowUp, ArrowDown, Activity, Zap, HardDrive, AlertCircle } from 'lucide-react'
import type { CacheMetrics } from '@/lib/services/cache-monitor'

interface KPICardsProps {
  metrics: CacheMetrics | null
  loading: boolean
}

export function KPICards({ metrics, loading }: KPICardsProps) {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="bg-background border border-border rounded-lg p-6 animate-pulse"
          >
            <div className="h-4 bg-muted rounded w-3/4 mb-4" />
            <div className="h-8 bg-muted rounded w-full mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  const kpis = [
    {
      label: 'Cache Hit Rate',
      value: `${metrics.system.overallHitRate.toFixed(1)}%`,
      trend: metrics.categories.hitRate >= 70 ? 'up' : metrics.categories.hitRate >= 50 ? 'stable' : 'down',
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      description: 'Overall cache effectiveness',
    },
    {
      label: 'Avg Response Time',
      value: `${Math.min(
        metrics.categories.avgResponseTime,
        metrics.flashSales.avgResponseTime
      ).toFixed(0)}ms`,
      trend: metrics.categories.avgResponseTime < 100 ? 'up' : 'down',
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      description: 'Fastest cache layer',
    },
    {
      label: 'Storage Used',
      value: metrics.system.storageUsed,
      trend: 'stable',
      icon: HardDrive,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      description: 'Total cache size',
    },
    {
      label: 'Total Requests',
      value: metrics.system.totalRequests.toLocaleString(),
      trend: metrics.system.totalRequests > 0 ? 'up' : 'stable',
      icon: AlertCircle,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      description: 'Requests tracked',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(kpi => {
        const Icon = kpi.icon
        const TrendIcon = kpi.trend === 'up' ? ArrowUp : kpi.trend === 'down' ? ArrowDown : null

        return (
          <div
            key={kpi.label}
            className="bg-background border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              {TrendIcon && (
                <TrendIcon
                  className={`w-4 h-4 ${
                    kpi.trend === 'up'
                      ? 'text-green-500'
                      : kpi.trend === 'down'
                        ? 'text-red-500'
                        : 'text-gray-500'
                  }`}
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold mb-2 text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.description}</p>
          </div>
        )
      })}
    </div>
  )
}
