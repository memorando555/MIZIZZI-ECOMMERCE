'use client'

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { CacheMetrics } from '@/lib/services/cache-monitor'

interface CacheChartsProps {
  metrics: CacheMetrics | null
  loading: boolean
}

export function CacheCharts({ metrics, loading }: CacheChartsProps) {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div
            key={i}
            className="bg-background border border-border rounded-lg p-6 animate-pulse"
          >
            <div className="h-64 bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  // Prepare data for charts
  const categoryVsFlashSalesData = [
    {
      name: 'Categories',
      hitRate: metrics.categories.hitRate,
      avgTime: metrics.categories.avgResponseTime,
    },
    {
      name: 'Flash Sales',
      hitRate: metrics.flashSales.hitRate,
      avgTime: metrics.flashSales.avgResponseTime,
    },
  ]

  const cacheLayerData = [
    {
      name: 'SessionStorage',
      value: 40,
      color: '#3b82f6',
    },
    {
      name: 'LocalStorage',
      value: 35,
      color: '#10b981',
    },
    {
      name: 'Server Cache',
      value: 20,
      color: '#f59e0b',
    },
    {
      name: 'Fresh Requests',
      value: 5,
      color: '#ef4444',
    },
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Hit Rate Comparison */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Cache Hit Rate by Source</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={categoryVsFlashSalesData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
            <YAxis stroke="var(--color-muted-foreground)" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Bar dataKey="hitRate" fill="#3b82f6" name="Hit Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Response Time Comparison */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Avg Response Time (ms)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={categoryVsFlashSalesData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
            <YAxis stroke="var(--color-muted-foreground)" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
              }}
              formatter={(value: number) => `${value.toFixed(0)}ms`}
            />
            <Bar dataKey="avgTime" fill="#10b981" name="Response Time (ms)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cache Layer Distribution */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Cache Layer Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={cacheLayerData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {cacheLayerData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `${value}%`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Storage Summary */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Cache Storage Summary</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Categories</span>
              <span className="text-sm text-muted-foreground">{metrics.categories.storageSize}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: '35%' }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Flash Sales</span>
              <span className="text-sm text-muted-foreground">{metrics.flashSales.storageSize}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: '40%' }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Total Used</span>
              <span className="text-lg font-bold text-foreground">{metrics.system.storageUsed}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated quota usage: ~15% (5-50MB limit)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
