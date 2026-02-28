"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  RefreshCw,
  Download,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from "lucide-react"
import { useAdminAuth } from "@/contexts/admin/auth-context"
import { Loader } from "@/components/ui/loader"
import { adminService } from "@/services/admin"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import type { AdminDashboardResponse } from "@/services/admin"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAdminAuth()
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      const data = await adminService.getDashboardData()
      setDashboardData(data)
    } catch (err: any) {
      const errorMsg = err.message || "Failed to load dashboard data"
      setError(errorMsg)
      console.error("[v0] Dashboard error:", errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
      setIsRefreshing(false)
    }
  }

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchDashboardData()
    }
  }, [isAuthenticated, isLoading])

  // Redirect if not authenticated
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader />
          <p className="mt-3 text-sm text-gray-600 font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const data = dashboardData || adminService.getDefaultDashboardData()

  // Calculate growth
  const salesGrowth = data.sales.yesterday > 0 
    ? Math.round(((data.sales.today - data.sales.yesterday) / data.sales.yesterday) * 100)
    : 0

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="w-full p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-base text-gray-600 mt-2">
              Welcome back, {user?.name || "Admin"}. Here's your store overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 h-10"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/admin/reports")}
              className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white h-10"
            >
              <Download className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoadingData ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <Loader />
              <p className="mt-3 text-sm text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {/* Primary KPI Cards - Apple Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Total Revenue Card */}
              <AppleCard
                icon={<DollarSign className="h-5 w-5 text-blue-600" />}
                title="Total Revenue"
                value={`$${(data.sales.total_revenue / 1000000).toFixed(1)}M`}
                subtitle="All-time revenue"
                trend={data.sales.today_trend}
                bgColor="bg-blue-50"
              />

              {/* Today's Sales Card */}
              <AppleCard
                icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                title="Today's Sales"
                value={`$${(data.sales.today / 1000).toFixed(1)}K`}
                subtitle={`${Math.abs(salesGrowth)}% ${salesGrowth >= 0 ? "increase" : "decrease"} vs yesterday`}
                trend={salesGrowth}
                bgColor="bg-green-50"
              />

              {/* Total Orders Card */}
              <AppleCard
                icon={<ShoppingCart className="h-5 w-5 text-orange-600" />}
                title="Total Orders"
                value={data.counts.orders.toString()}
                subtitle={`${data.counts.pending_payments} pending`}
                bgColor="bg-orange-50"
              />

              {/* Total Customers Card */}
              <AppleCard
                icon={<Users className="h-5 w-5 text-purple-600" />}
                title="Total Customers"
                value={data.counts.users.toString()}
                subtitle={`${data.counts.new_signups_today} new today`}
                bgColor="bg-purple-50"
              />
            </div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              {/* Products */}
              <MetricCard
                label="Products"
                value={data.counts.products}
                sublabel={`${data.counts.low_stock_count} low stock`}
                icon={<Package className="h-4 w-4" />}
                color="blue"
              />

              {/* Categories */}
              <MetricCard
                label="Categories"
                value={data.counts.categories}
                sublabel="Product categories"
                icon={<BarChart3 className="h-4 w-4" />}
                color="green"
              />

              {/* Orders in Transit */}
              <MetricCard
                label="In Transit"
                value={data.counts.orders_in_transit}
                sublabel="Active shipments"
                icon={<ShoppingCart className="h-4 w-4" />}
                color="orange"
              />

              {/* Pending Payments */}
              <MetricCard
                label="Pending"
                value={data.counts.pending_payments}
                sublabel="Awaiting payment"
                icon={<AlertTriangle className="h-4 w-4" />}
                color="red"
              />

              {/* Newsletter */}
              <MetricCard
                label="Subscribers"
                value={data.counts.newsletter_subscribers}
                sublabel="Newsletter list"
                icon={<Users className="h-4 w-4" />}
                color="purple"
              />
            </div>

            {/* Sales & Customer Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Analytics */}
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="p-6 border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold">Sales Overview</CardTitle>
                  <CardDescription>Revenue trends and metrics</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Weekly Revenue</p>
                      <p className="text-2xl font-semibold mt-1">
                        ${(data.sales.weekly / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <TrendIndicator value={data.sales.weekly_trend} />
                  </div>
                  <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-semibold mt-1">
                        ${(data.sales.monthly / 1000000).toFixed(2)}M
                      </p>
                    </div>
                    <TrendIndicator value={data.sales.monthly_trend} />
                  </div>
                  <div className="pt-4">
                    <p className="text-sm text-gray-600 mb-2">Average Order Value</p>
                    <p className="text-2xl font-semibold">${data.sales.average_order_value.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Analytics */}
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="p-6 border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold">Customer Insights</CardTitle>
                  <CardDescription>User engagement and metrics</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Retention Rate</span>
                    <span className="font-semibold">{data.customer_analytics.customer_retention_rate}%</span>
                  </div>
                  <Progress value={data.customer_analytics.customer_retention_rate} className="rounded-full h-2" />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-600">Satisfaction Score</span>
                    <span className="font-semibold">{data.customer_analytics.customer_satisfaction_score.toFixed(1)}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${
                          i < Math.floor(data.customer_analytics.customer_satisfaction_score)
                            ? "bg-yellow-400"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">Repeat Customers</p>
                    <p className="text-2xl font-semibold">{data.customer_analytics.repeat_customers}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders & Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              {data.recent_orders && data.recent_orders.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <CardHeader className="p-6 border-b border-gray-100 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                      <CardDescription>Latest transactions</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/admin/orders")}
                      className="text-blue-600 hover:bg-blue-50 h-8"
                    >
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {data.recent_orders.slice(0, 4).map((order) => (
                        <OrderItem key={order.id} order={order} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Low Stock Alert */}
              {data.low_stock_products && data.low_stock_products.length > 0 && (
                <Card className="bg-white border border-yellow-200 rounded-2xl shadow-sm">
                  <CardHeader className="p-6 border-b border-yellow-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          Low Stock Alert
                        </CardTitle>
                        <CardDescription>{data.counts.low_stock_count} products</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/admin/inventory")}
                        className="text-blue-600 hover:bg-blue-50 h-8"
                      >
                        Manage
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {data.low_stock_products.slice(0, 4).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-sm">{product.stock}</p>
                            <p className="text-xs text-gray-500">left</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Customers & Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Customers */}
              {data.recent_users && data.recent_users.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <CardHeader className="p-6 border-b border-gray-100 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Recent Customers</CardTitle>
                      <CardDescription>New registrations</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/admin/customers")}
                      className="text-blue-600 hover:bg-blue-50 h-8"
                    >
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {data.recent_users.slice(0, 4).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-gray-600 truncate">{user.email}</p>
                          </div>
                          {user.is_premium && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-0">Premium</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              {data.recent_activities && data.recent_activities.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <CardHeader className="p-6 border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Live store events</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {data.recent_activities.slice(0, 4).map((activity) => (
                        <div key={activity.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            activity.severity === "warning" ? "bg-yellow-500" :
                            activity.severity === "error" ? "bg-red-500" :
                            activity.severity === "success" ? "bg-green-500" :
                            "bg-blue-500"
                          }`} />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Best Selling Products */}
            {data.best_selling_products && data.best_selling_products.length > 0 && (
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="p-6 border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold">Best Sellers</CardTitle>
                  <CardDescription>Top performing products</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {data.best_selling_products.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-600">{product.sales_count} sales • ${(product.revenue / 1000).toFixed(1)}K revenue</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-2 w-2 rounded-full ${
                                  i < Math.floor(product.rating) ? "bg-yellow-400" : "bg-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium">{product.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* System Health & Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Health */}
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="p-6 border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Health</span>
                    <span className="font-semibold">{data.system_health.api_health}%</span>
                  </div>
                  <Progress value={data.system_health.api_health} className="rounded-full h-2" />

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600">Memory</p>
                      <p className="text-lg font-semibold">{data.system_health.memory_usage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">CPU</p>
                      <p className="text-lg font-semibold">{data.system_health.cpu_usage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Disk</p>
                      <p className="text-lg font-semibold">{data.system_health.disk_usage}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <div className={`h-2 w-2 rounded-full ${
                      data.system_health.status === "healthy" ? "bg-green-500" :
                      data.system_health.status === "warning" ? "bg-yellow-500" :
                      "bg-red-500"
                    }`} />
                    <span className="text-sm text-gray-600">
                      Status: <span className="font-semibold capitalize">{data.system_health.status}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="p-6 border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold">Performance</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Page Load Time</span>
                    <span className="font-semibold text-green-600">{data.performance_metrics.page_load_time}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Response Time</span>
                    <span className="font-semibold text-green-600">{data.performance_metrics.api_response_time}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cache Hit Rate</span>
                    <span className="font-semibold">{data.performance_metrics.cache_hit_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="font-semibold text-green-600">{data.performance_metrics.uptime_percentage}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods Distribution */}
            {data.payment_methods && data.payment_methods.length > 0 && (
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="p-6 border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold">Payment Methods</CardTitle>
                  <CardDescription>Revenue by payment type</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {data.payment_methods.map((method) => (
                      <div key={method.method} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{method.method}</span>
                            <span className="text-sm text-gray-600">${(method.total_amount / 1000).toFixed(1)}K</span>
                          </div>
                          <Progress value={method.percentage} className="rounded-full h-2" />
                          <p className="text-xs text-gray-500 mt-1">{method.percentage}% • {method.count} transactions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// APPLE-INSPIRED COMPONENTS
// ============================================================================

function AppleCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  bgColor,
}: {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  trend?: number
  bgColor: string
}) {
  return (
    <div className={`${bgColor} rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-2">{value}</h3>
          <p className="text-xs text-gray-600 mt-2">{subtitle}</p>
        </div>
        <div className="flex-shrink-0">{icon}</div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-4 text-xs font-medium ${
          trend >= 0 ? "text-green-600" : "text-red-600"
        }`}>
          {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{Math.abs(trend)}% vs last period</span>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  sublabel,
  icon,
  color,
}: {
  label: string
  value: number
  sublabel: string
  icon: React.ReactNode
  color: string
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    red: "bg-red-50 text-red-600 border-red-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  }

  return (
    <div className={`${colorMap[color]} rounded-xl p-4 border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-600 mt-1">{sublabel}</p>
        </div>
        <div className="flex-shrink-0 text-lg">{icon}</div>
      </div>
    </div>
  )
}

function TrendIndicator({ value }: { value: number }) {
  return (
    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
      value >= 0
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }`}>
      {value >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      <span>{Math.abs(value)}%</span>
    </div>
  )
}

function OrderItem({ order }: { order: any }) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="min-w-0">
        <p className="font-medium text-sm">{order.order_number}</p>
        <p className="text-xs text-gray-600 truncate">{order.user_name}</p>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <span className="font-semibold text-sm tabular-nums">${order.total_amount.toFixed(2)}</span>
        <Badge className={`${statusColors[order.status] || statusColors.pending} border-0 text-xs`}>
          {order.status}
        </Badge>
      </div>
    </div>
  )
}
