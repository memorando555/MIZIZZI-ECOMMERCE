'use client'

import { Clock, CheckCircle, XCircle } from 'lucide-react'
import type { CacheMetrics } from '@/lib/services/cache-monitor'

interface CacheDetailsTableProps {
  metrics: CacheMetrics | null
  loading: boolean
}

export function CacheDetailsTable({ metrics, loading }: CacheDetailsTableProps) {
  if (loading || !metrics) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-muted rounded" />
        ))}
      </div>
    )
  }

  const details = [
    {
      category: 'Categories Cache',
      metrics: [
        {
          label: 'Total Hits',
          value: metrics.categories.hits.toLocaleString(),
          icon: CheckCircle,
          color: 'text-green-600',
        },
        {
          label: 'Total Misses',
          value: metrics.categories.misses.toLocaleString(),
          icon: XCircle,
          color: 'text-red-600',
        },
        {
          label: 'Storage Size',
          value: metrics.categories.storageSize,
          icon: CheckCircle,
          color: 'text-blue-600',
        },
        {
          label: 'Last Updated',
          value: metrics.categories.lastUpdated,
          icon: Clock,
          color: 'text-amber-600',
        },
      ],
    },
    {
      category: 'Flash Sales Cache',
      metrics: [
        {
          label: 'Total Hits',
          value: metrics.flashSales.hits.toLocaleString(),
          icon: CheckCircle,
          color: 'text-green-600',
        },
        {
          label: 'Total Misses',
          value: metrics.flashSales.misses.toLocaleString(),
          icon: XCircle,
          color: 'text-red-600',
        },
        {
          label: 'Storage Size',
          value: metrics.flashSales.storageSize,
          icon: CheckCircle,
          color: 'text-blue-600',
        },
        {
          label: 'Last Updated',
          value: metrics.flashSales.lastUpdated,
          icon: Clock,
          color: 'text-amber-600',
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {details.map(section => (
        <div key={section.category} className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-6 py-3 border-b border-border">
            <h4 className="font-semibold text-foreground">{section.category}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-border">
            {section.metrics.map((metric, i) => {
              const Icon = metric.icon
              return (
                <div key={i} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${metric.color}`} />
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground break-words">
                    {metric.value}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
