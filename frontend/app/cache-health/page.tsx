"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { API_URL } from "@/config"
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
  Database,
  Zap,
  Clock,
  Server,
  Wifi,
  WifiOff,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface CacheStats {
  connected: boolean
  stats: {
    errors: number
    hit_rate_percent: number
    hits: number
    misses: number
    sets: number
    total_requests: number
    fast_json?: boolean
  }
  timestamp: string
  type: string
}

interface HealthCheck {
  name: string
  status: "healthy" | "degraded" | "unhealthy" | "checking" | "warming"
  message: string
  latency?: number
}

interface PingResult {
  success: boolean
  latency: number
  error?: string
}

export default function CacheHealthPage() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [pingResults, setPingResults] = useState<PingResult[]>([])

  const runHealthChecks = useCallback(async () => {
    setLoading(true)
    const checks: HealthCheck[] = []

    // Check 1: API Connection
    const apiCheck: HealthCheck = {
      name: "API Server",
      status: "checking",
      message: "Checking connection...",
    }
    checks.push(apiCheck)
    setHealthChecks([...checks])

    try {
      const startTime = performance.now()
      const response = await fetch(`${API_URL}/api/products/cache/status`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      const latency = Math.round(performance.now() - startTime)

      if (response.ok) {
        const data = await response.json()
        setCacheStats(data)
        checks[0] = {
          name: "API Server",
          status: "healthy",
          message: `Connected to ${API_URL}`,
          latency,
        }

        // Check 2: Redis Connection
        const redisCheck: HealthCheck = {
          name: "Upstash Redis",
          status: data.connected ? "healthy" : "unhealthy",
          message: data.connected ? `Connected (${data.type})` : "Redis not connected - using fallback",
          latency,
        }
        checks.push(redisCheck)

        // Check 3: Cache Performance - smarter logic for warming caches
        const hitRate = data.stats.hit_rate_percent
        const totalRequests = data.stats.total_requests
        const isWarmingUp = totalRequests < 50 // Cache is still warming up

        let perfStatus: HealthCheck["status"]
        let perfMessage: string

        if (isWarmingUp) {
          // Cache is warming up - don't judge harshly
          perfStatus = "warming"
          perfMessage = `Warming up: ${hitRate.toFixed(1)}% hit rate (${data.stats.hits}/${totalRequests} requests)`
        } else if (hitRate >= 70) {
          perfStatus = "healthy"
          perfMessage = `Excellent: ${hitRate.toFixed(1)}% hit rate`
        } else if (hitRate >= 40) {
          perfStatus = "degraded"
          perfMessage = `Moderate: ${hitRate.toFixed(1)}% hit rate - consider longer TTL`
        } else {
          perfStatus = "unhealthy"
          perfMessage = `Low: ${hitRate.toFixed(1)}% hit rate - review caching strategy`
        }

        const perfCheck: HealthCheck = {
          name: "Cache Performance",
          status: perfStatus,
          message: perfMessage,
        }
        checks.push(perfCheck)

        // Check 4: Fast JSON (orjson) - informational, not critical
        const jsonCheck: HealthCheck = {
          name: "Fast JSON (orjson)",
          status: data.stats.fast_json ? "healthy" : "warming",
          message: data.stats.fast_json
            ? "orjson enabled - 10x faster serialization"
            : "Using standard JSON (optional optimization)",
        }
        checks.push(jsonCheck)

        // Check 5: Error Rate
        const errorRate = data.stats.total_requests > 0 ? (data.stats.errors / data.stats.total_requests) * 100 : 0
        const errorCheck: HealthCheck = {
          name: "Error Rate",
          status: errorRate === 0 ? "healthy" : errorRate < 5 ? "degraded" : "unhealthy",
          message:
            errorRate === 0
              ? "No errors detected"
              : `${errorRate.toFixed(2)}% error rate (${data.stats.errors} errors)`,
        }
        checks.push(errorCheck)
      } else {
        checks[0] = {
          name: "API Server",
          status: "unhealthy",
          message: `HTTP ${response.status} - ${response.statusText}`,
          latency,
        }
      }
    } catch (error) {
      checks[0] = {
        name: "API Server",
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Connection failed",
      }
    }

    setHealthChecks(checks)
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  const runLatencyTest = useCallback(async () => {
    const results: PingResult[] = []
    for (let i = 0; i < 5; i++) {
      try {
        const startTime = performance.now()
        await fetch(`${API_URL}/api/products/cache/status`)
        const latency = Math.round(performance.now() - startTime)
        results.push({ success: true, latency })
      } catch (error) {
        results.push({
          success: false,
          latency: 0,
          error: error instanceof Error ? error.message : "Failed",
        })
      }
      // Small delay between pings
      await new Promise((r) => setTimeout(r, 200))
    }
    setPingResults(results)
  }, [])

  useEffect(() => {
    runHealthChecks()
  }, [runHealthChecks])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(runHealthChecks, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, runHealthChecks])

  const getOverallHealth = () => {
    if (healthChecks.length === 0) return "checking"

    // Only API and Redis connection are critical
    const criticalChecks = healthChecks.filter(
      (c) => c.name === "API Server" || c.name === "Upstash Redis" || c.name === "Error Rate",
    )

    const hasUnhealthyCritical = criticalChecks.some((c) => c.status === "unhealthy")
    if (hasUnhealthyCritical) return "unhealthy"

    // Check for degraded (but not warming)
    const hasDegraded = healthChecks.some((c) => c.status === "degraded")
    if (hasDegraded) return "degraded"

    // Check if anything is still warming up
    const hasWarming = healthChecks.some((c) => c.status === "warming")
    if (hasWarming) return "warming"

    return "healthy"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600"
      case "degraded":
        return "text-yellow-600"
      case "unhealthy":
        return "text-red-600"
      case "warming":
        return "text-blue-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 border-green-200"
      case "degraded":
        return "bg-yellow-100 border-yellow-200"
      case "unhealthy":
        return "bg-red-100 border-red-200"
      case "warming":
        return "bg-blue-100 border-blue-200"
      default:
        return "bg-muted border-border"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "unhealthy":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warming":
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    }
  }

  const overallHealth = getOverallHealth()
  const avgLatency =
    pingResults.length > 0
      ? Math.round(
          pingResults.filter((r) => r.success).reduce((a, b) => a + b.latency, 0) /
            pingResults.filter((r) => r.success).length,
        )
      : null

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cache Health Dashboard</h1>
            <p className="text-muted-foreground">Monitor Upstash Redis cache status and performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "border-green-500 text-green-600" : ""}
            >
              <Activity className={`h-4 w-4 mr-1 ${autoRefresh ? "animate-pulse" : ""}`} />
              {autoRefresh ? "Auto" : "Manual"}
            </Button>
            <Button onClick={runHealthChecks} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status Banner */}
        <Card className={`border-2 ${getStatusBg(overallHealth)}`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center ${
                    overallHealth === "healthy"
                      ? "bg-green-500"
                      : overallHealth === "degraded"
                        ? "bg-yellow-500"
                        : overallHealth === "unhealthy"
                          ? "bg-red-500"
                          : overallHealth === "warming"
                            ? "bg-blue-500"
                            : "bg-muted"
                  }`}
                >
                  {overallHealth === "healthy" ? (
                    <Wifi className="h-8 w-8 text-white" />
                  ) : overallHealth === "degraded" ? (
                    <AlertTriangle className="h-8 w-8 text-white" />
                  ) : overallHealth === "unhealthy" ? (
                    <WifiOff className="h-8 w-8 text-white" />
                  ) : overallHealth === "warming" ? (
                    <TrendingUp className="h-8 w-8 text-white" />
                  ) : (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  )}
                </div>
                <div>
                  <h2 className={`text-2xl font-bold capitalize ${getStatusColor(overallHealth)}`}>
                    {overallHealth === "checking"
                      ? "Checking..."
                      : overallHealth === "warming"
                        ? "System Warming Up"
                        : overallHealth === "healthy"
                          ? "System Healthy"
                          : overallHealth === "degraded"
                            ? "System Degraded"
                            : "System Unhealthy"}
                  </h2>
                  <p className="text-muted-foreground">
                    {lastUpdated ? `Last checked: ${lastUpdated.toLocaleTimeString()}` : "Checking system health..."}
                  </p>
                  {overallHealth === "warming" && (
                    <p className="text-sm text-blue-600 mt-1">
                      Cache is building up - hit rate will improve with more requests
                    </p>
                  )}
                </div>
              </div>
              {cacheStats && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-muted-foreground">Cache Type</p>
                  <Badge variant={cacheStats.type === "upstash" ? "default" : "secondary"}>{cacheStats.type}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Health Checks Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {healthChecks.map((check, index) => (
            <Card key={index} className={`border ${getStatusBg(check.status)}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(check.status)}
                      <span className="font-semibold">{check.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                  </div>
                  {check.latency !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      {check.latency}ms
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cache Statistics */}
        {cacheStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Cache Statistics
              </CardTitle>
              <CardDescription>Real-time cache performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hit Rate</span>
                    <span className="font-mono font-bold">{cacheStats.stats.hit_rate_percent.toFixed(1)}%</span>
                  </div>
                  <Progress value={cacheStats.stats.hit_rate_percent} className="h-2" />
                </div>

                <div className="rounded-lg border p-4 text-center">
                  <Zap className="h-6 w-6 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{cacheStats.stats.hits}</p>
                  <p className="text-xs text-muted-foreground">Cache Hits</p>
                </div>

                <div className="rounded-lg border p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                  <p className="text-2xl font-bold">{cacheStats.stats.misses}</p>
                  <p className="text-xs text-muted-foreground">Cache Misses</p>
                </div>

                <div className="rounded-lg border p-4 text-center">
                  <Server className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{cacheStats.stats.sets}</p>
                  <p className="text-xs text-muted-foreground">Cache Sets</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-xl font-bold">{cacheStats.stats.total_requests}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Errors</p>
                  <p className={`text-xl font-bold ${cacheStats.stats.errors > 0 ? "text-red-600" : ""}`}>
                    {cacheStats.stats.errors}
                  </p>
                </div>
                <div
                  className={`rounded-lg border p-4 ${cacheStats.stats.fast_json ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}
                >
                  <p className="text-sm text-muted-foreground">JSON Serializer</p>
                  <p
                    className={`text-xl font-bold ${cacheStats.stats.fast_json ? "text-green-600" : "text-yellow-600"}`}
                  >
                    {cacheStats.stats.fast_json ? "orjson" : "standard"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Latency Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Latency Test
                </CardTitle>
                <CardDescription>Test round-trip response times (5 pings)</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={runLatencyTest}>
                Run Test
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pingResults.length > 0 ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {pingResults.map((result, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-lg border p-3 text-center ${
                        result.success
                          ? result.latency < 200
                            ? "border-green-200 bg-green-50"
                            : result.latency < 500
                              ? "border-yellow-200 bg-yellow-50"
                              : "border-red-200 bg-red-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      {result.success ? (
                        <>
                          <p className="text-lg font-mono font-bold">{result.latency}ms</p>
                          <p className="text-xs text-muted-foreground">Ping {i + 1}</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 mx-auto text-red-500" />
                          <p className="text-xs text-red-600">Failed</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {avgLatency !== null && (
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Average Latency</p>
                    <p
                      className={`text-3xl font-mono font-bold ${
                        avgLatency < 200 ? "text-green-600" : avgLatency < 500 ? "text-yellow-600" : "text-red-600"
                      }`}
                    >
                      {avgLatency}ms
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Click &quot;Run Test&quot; to measure latency
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Endpoint Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connection Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">API Endpoint</span>
                <code className="text-xs bg-background px-2 py-1 rounded">{API_URL}</code>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Cache Status Endpoint</span>
                <code className="text-xs bg-background px-2 py-1 rounded">/api/products/cache/status</code>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Featured Cache Status</span>
                <code className="text-xs bg-background px-2 py-1 rounded">/api/products/featured/cache-status</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link to detailed testing page */}
        <div className="text-center">
          <Link href="/redis-test" className="text-sm text-muted-foreground hover:text-foreground underline">
            Need detailed endpoint testing? Go to Redis Performance Test Page
          </Link>
        </div>
      </div>
    </div>
  )
}
