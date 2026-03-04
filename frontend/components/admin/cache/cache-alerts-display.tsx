'use client'

import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface CacheAlert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: Date
  source?: 'categories' | 'flash-sales'
  actionUrl?: string
}

interface CacheAlertsProps {
  alerts?: CacheAlert[]
  onDismiss?: (id: string) => void
}

export function CacheAlerts({ alerts = [], onDismiss }: CacheAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-900 dark:text-green-100">
            All Systems Nominal
          </p>
          <p className="text-sm text-green-800 dark:text-green-200 mt-1">
            No alerts or issues detected
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map(alert => {
        const config = {
          error: {
            icon: AlertCircle,
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-50 dark:bg-red-950',
            borderColor: 'border-red-200 dark:border-red-800',
          },
          warning: {
            icon: AlertTriangle,
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-50 dark:bg-amber-950',
            borderColor: 'border-amber-200 dark:border-amber-800',
          },
          info: {
            icon: Info,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-950',
            borderColor: 'border-blue-200 dark:border-blue-800',
          },
          success: {
            icon: CheckCircle,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-950',
            borderColor: 'border-green-200 dark:border-green-800',
          },
        }

        const Icon = config[alert.type].icon

        return (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 flex items-start gap-3 ${config[alert.type].bgColor} ${config[alert.type].borderColor}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config[alert.type].color}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${config[alert.type].color}`}>
                {alert.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
                {alert.source && (
                  <span className="text-xs px-2 py-1 bg-background/50 rounded text-foreground">
                    {alert.source}
                  </span>
                )}
                {alert.actionUrl && (
                  <a
                    href={alert.actionUrl}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Details
                  </a>
                )}
              </div>
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
