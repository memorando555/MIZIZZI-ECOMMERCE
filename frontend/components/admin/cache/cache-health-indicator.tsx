'use client'

import { AlertCircle, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { CacheStatus } from '@/lib/services/cache-monitor'

interface CacheHealthIndicatorProps {
  status: CacheStatus | null
  loading: boolean
}

export function CacheHealthIndicator({ status, loading }: CacheHealthIndicatorProps) {
  if (loading || !status) {
    return (
      <div className="bg-background border border-border rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-muted rounded w-full" />
          ))}
        </div>
      </div>
    )
  }

  const statusConfig = {
    excellent: {
      label: 'Excellent',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: CheckCircle,
      description: 'System performing optimally',
    },
    good: {
      label: 'Good',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: CheckCircle,
      description: 'System operating normally',
    },
    warning: {
      label: 'Warning',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      borderColor: 'border-amber-200 dark:border-amber-800',
      icon: AlertTriangle,
      description: 'Some performance concerns detected',
    },
    critical: {
      label: 'Critical',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: XCircle,
      description: 'System requires attention',
    },
  }

  const config = statusConfig[status.status]
  const Icon = config.icon

  return (
    <div
      className={`border rounded-lg p-6 ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-start gap-4">
        <div className={`mt-1 ${config.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`text-lg font-semibold ${config.color}`}>
              {config.label}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{config.description}</p>

          {status.issues.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2">Issues:</p>
              <ul className="space-y-1">
                {status.issues.map((issue, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-lg leading-none">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {status.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Recommendations:</p>
              <ul className="space-y-1">
                {status.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-lg leading-none">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
