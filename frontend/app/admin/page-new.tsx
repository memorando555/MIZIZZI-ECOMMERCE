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
import { adminService, type AdminDashboardResponse } from "@/services/admin"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

// ============================================================================
// TYPE DEFINITIONS FOR COMPONENTS
// ============================================================================

interface OrderData {
  id: string
  order_number: string
  user_email: string
  user_name: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  items_count: number
}

interface UserData {
  id: number | string
  name: string
  username: string
  email: string
  created_at: string
  total_spent: number
  orders_count: number
  is_premium: boolean
}

interface ActivityData {
  id: string | number
  message: string
  description: string
  type: string
  timestamp: string
  user_id?: string
  severity: "info" | "success" | "warning" | "error"
}

interface ProductData {
  id: number | string
  name: string
  sku?: string
  sales_count?: number
  revenue?: number
  rating?: number
  stock?: number
}

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

  // Ensure all data properties have defaults to prevent undefined errors
  const safeData = {
    counts: {
      users: data?.counts?.users || 0,
      products: data?.counts?.products || 0,
      orders: data?.counts?.orders || 0,
      categories: data?.counts?.categories || 0,
      brands: data?.counts?.brands || 0,
      reviews: data?.counts?.reviews || 0,
      pending_reviews: data?.counts?.pending_reviews || 0,
      newsletter_subscribers: data?.counts?.newsletter_subscribers || 0,
      new_signups_today: data?.counts?.new_signups_today || 0,
      new_signups_week: data?.counts?.new_signups_week || 0,
      orders_in_transit: data?.counts?.orders_in_transit || 0,
      pending_payments: data?.counts?.pending_payments || 0,
      low_stock_count: data?.counts?.low_stock_count || 0,
      total_active_sessions: data?.counts?.total_active_sessions || 0,
      total_sales_channels: data?.counts?.total_sales_channels || 0,
      refunds_pending: data?.counts?.refunds_pending || 0,
      support_tickets_open: data?.counts?.support_tickets_open || 0,
      total_wishlist_items: data?.counts?.total_wishlist_items || 0,
      active_coupons: data?.counts?.active_coupons || 0,
      returning_customers: data?.counts?.returning_customers || 0,
    },
    sales: {
      today: Number(data?.sales?.today ?? 0) || 0,
      yesterday: Number(data?.sales?.yesterday ?? 0) || 0,
      weekly: Number(data?.sales?.weekly ?? 0) || 0,
      monthly: Number(data?.sales?.monthly ?? 0) || 0,
      yearly: Number(data?.sales?.yearly ?? 0) || 0,
      total_revenue: Number(data?.sales?.total_revenue ?? 0) || 0,
      pending_amount: Number(data?.sales?.pending_amount ?? 0) || 0,
      average_order_value: Number(data?.sales?.average_order_value ?? 0) || 0,
      net_profit: Number(data?.sales?.net_profit ?? 0) || 0,
      gross_profit: Number(data?.sales?.gross_profit ?? 0) || 0,
      refunded_amount: Number(data?.sales?.refunded_amount ?? 0) || 0,
      tax_collected: Number(data?.sales?.tax_collected ?? 0) || 0,
      shipping_revenue: Number(data?.sales?.shipping_revenue ?? 0) || 0,
      today_trend: Number(data?.sales?.today_trend ?? 0) || 0,
      weekly_trend: Number(data?.sales?.weekly_trend ?? 0) || 0,
      monthly_trend: Number(data?.sales?.monthly_trend ?? 0) || 0,
    },
    customer_analytics: {
      total_customers: Number(data?.customer_analytics?.total_customers ?? 0) || 0,
      new_customers_today: Number(data?.customer_analytics?.new_customers_today ?? 0) || 0,
      repeat_customers: Number(data?.customer_analytics?.repeat_customers ?? 0) || 0,
      customer_retention_rate: Number(data?.customer_analytics?.customer_retention_rate ?? 0) || 0,
      average_customer_lifetime_value: Number(data?.customer_analytics?.average_customer_lifetime_value ?? 0) || 0,
      customer_satisfaction_score: Number(data?.customer_analytics?.customer_satisfaction_score ?? 0) || 0,
      churn_rate: Number(data?.customer_analytics?.churn_rate ?? 0) || 0,
    },
    recent_orders: Array.isArray(data?.recent_orders) ? data.recent_orders : [],
    recent_users: Array.isArray(data?.recent_users) ? data.recent_users : [],
    recent_activities: Array.isArray(data?.recent_activities) ? data.recent_activities : [],
    low_stock_products: Array.isArray(data?.low_stock_products) ? data.low_stock_products : [],
    best_selling_products: Array.isArray(data?.best_selling_products) ? data.best_selling_products : [],
    payment_methods: Array.isArray(data?.payment_methods) ? data.payment_methods : [],
    performance_metrics: data?.performance_metrics || adminService.getDefaultPerformanceMetrics(),
    system_health: data?.system_health || adminService.getDefaultSystemStatus(),
  }

  console.log("[v0] safeData created:", {
    salesObject: safeData.sales,
    hasToday: safeData.sales.today !== undefined,
    todayValue: safeData.sales.today,
  })

  // Calculate growth - with safe defaults
  const salesGrowth = (safeData.sales.yesterday || 0) > 0
    ? Math.round(((safeData.sales.today - safeData.sales.yesterday) / safeData.sales.yesterday) * 100)
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
                value={`$${((safeData.sales?.total_revenue || 0) / 1000000).toFixed(1)}M`}
                subtitle="All-time revenue"
                trend={safeData.sales?.today_trend}
                bgColor="bg-blue-50"
              />

              {/* Today's Sales Card */}
              <AppleCard
                icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                title="Today's Sales"
                value={`$${((safeData.sales?.today || 0) / 1000).toFixed(1)}K`}
                subtitle={`${Math.abs(salesGrowth)}% ${salesGrowth >= 0 ? "increase" : "decrease"} vs yesterday`}
                trend={salesGrowth}
                bgColor="bg-green-50"
              />

              {/* Total Orders Card */}
              <AppleCard
                icon={<ShoppingCart className="h-5 w-5 text-orange-600" />}
                title="Total Orders"
                value={safeData.counts.orders.toString()}
                subtitle={`${safeData.counts.pending_payments} pending`}
                bgColor="bg-orange-50"
              />

              {/* Total Customers Card */}
              <AppleCard
                icon={<Users className="h-5 w-5 text-purple-600" />}
                title="Total Customers"
                value={safeData.counts.users.toString()}
                subtitle={`${safeData.counts.new_signups_today} new today`}
                bgColor="bg-purple-50"
              />
            </div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              {/* Products */}
              <MetricCard
                label="Products"
                value={safeData.counts.products}
                sublabel={`${safeData.counts.low_stock_count} low stock`}
                icon={<Package className="h-4 w-4" />}
                color="blue"
              />

              {/* Categories */}
              <MetricCard
                label="Categories"
                value={safeData.counts.categories}
                sublabel="Product categories"
                icon={<BarChart3 className="h-4 w-4" />}
                color="green"
              />

              {/* Orders in Transit */}
              <MetricCard
                label="In Transit"
                value={safeData.counts.orders_in_transit}
                sublabel="Active shipments"
                icon={<ShoppingCart className="h-4 w-4" />}
                color="orange"
              />

              {/* Pending Payments */}
              <MetricCard
                label="Pending"
                value={safeData.counts.pending_payments}
                sublabel="Awaiting payment"
                icon={<AlertTriangle className="h-4 w-4" />}
                color="red"
              />

              {/* Newsletter */}
              <MetricCard
                label="Subscribers"
                value={safeData.counts.newsletter_subscribers}
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
                        ${((safeData.sales?.weekly || 0) / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <TrendIndicator value={safeData.sales?.weekly_trend || 0} />
                  </div>
                  <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-semibold mt-1">
                        ${((safeData.sales?.monthly || 0) / 1000000).toFixed(2)}M
                      </p>
                    </div>
                    <TrendIndicator value={safeData.sales?.monthly_trend || 0} />
                  </div>
                  <div className="pt-4">
                    <p className="text-sm text-gray-600 mb-2">Average Order Value</p>
                    <p className="text-2xl font-semibold">${(safeData.sales?.average_order_value || 0).toFixed(2)}</p>
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
                    <span className="font-semibold">{safeData.customer_analytics?.customer_retention_rate || 0}%</span>
                  </div>
                  <Progress value={safeData.customer_analytics?.customer_retention_rate || 0} className="rounded-full h-2" />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-600">Satisfaction Score</span>
                    <span className="font-semibold">{(safeData.customer_analytics?.customer_satisfaction_score || 0).toFixed(1)}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${
                          i < Math.floor(safeData.customer_analytics?.customer_satisfaction_score || 0)
                            ? "bg-yellow-400"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">Repeat Customers</p>
                    <p className="text-2xl font-semibold">{safeData.customer_analytics?.repeat_customers || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders & Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              {safeData.recent_orders && safeData.recent_orders.length > 0 && (
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
                      {safeData.recent_orders.slice(0, 4).map((order: OrderData) => (
                        <OrderItem key={order.id} order={order} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Low Stock Alert */}
              {safeData.low_stock_products && safeData.low_stock_products.length > 0 && (
                <Card className="bg-white border border-yellow-200 rounded-2xl shadow-sm">
                  <CardHeader className="p-6 border-b border-yellow-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          Low Stock Alert
                        </CardTitle>
                        <CardDescription>{safeData.counts.low_stock_count} products</CardDescription>
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
                      {safeData.low_stock_products.slice(0, 4).map((product: any) => (
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
              {safeData.recent_users && safeData.recent_users.length > 0 && (
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
                      {safeData.recent_users.slice(0, 4).map((user: UserData) => (
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
              {safeData.recent_activities && safeData.recent_activities.length > 0 && (
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
                      {safeData.recent_activities.slice(0, 4).map((activity: ActivityData) => (
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
            {safeData.best_selling_products && safeData.best_selling_products.length > 0 && (
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="p-6 border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold">Best Sellers</CardTitle>
                  <CardDescription>Top performing products</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {safeData.best_selling_products.slice(0, 5).map((product: ProductData) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-600">{product.sales_count} sales • ${((product.revenue || 0) / 1000).toFixed(1)}K revenue</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-2 w-2 rounded-full ${
                                  i < Math.floor(product.rating || 0) ? "bg-yellow-400" : "bg-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium">{(product.rating || 0).toFixed(1)}</span>
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
                    <span className="font-semibold">{safeData.system_health.api_health}%</span>
                  </div>
                  <Progress value={safeData.system_health.api_health} className="rounded-full h-2" />

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600">Memory</p>
                        <p className="text-lg font-semibold">{safeData.system_health.memory_usage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">CPU</p>
                      <p className="text-lg font-semibold">{safeData.system_health.cpu_usage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Disk</p>
                      <p className="text-lg font-semibold">{safeData.system_health.disk_usage}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <div className={`h-2 w-2 rounded-full ${
                      safeData.system_health.status === "healthy" ? "bg-green-500" :
                      safeData.system_health.status === "warning" ? "bg-yellow-500" :
                      "bg-red-500"
                    }`} />
                    <span className="text-sm text-gray-600">
                      Status: <span className="font-semibold capitalize">{safeData.system_health.status}</span>
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
                    <span className="font-semibold text-green-600">{safeData.performance_metrics.page_load_time}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Response Time</span>
                    <span className="font-semibold text-green-600">{safeData.performance_metrics.api_response_time}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cache Hit Rate</span>
                    <span className="font-semibold">{safeData.performance_metrics.cache_hit_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="font-semibold text-green-600">{safeData.performance_metrics.uptime_percentage}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods Distribution */}
            {safeData.payment_methods && safeData.payment_methods.length > 0 && (
              <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="p-6 border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold">Payment Methods</CardTitle>
                  <CardDescription>Revenue by payment type</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {safeData.payment_methods.map((method: any) => (
                      <div key={method.method} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{method.method}</span>
                            <span className="text-sm text-gray-600">${((method.total_amount || 0) / 1000).toFixed(1)}K</span>
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
  const safeTrend = trend ?? undefined
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
      {safeTrend !== undefined && (
        <div className={`flex items-center gap-1 mt-4 text-xs font-medium ${
          safeTrend >= 0 ? "text-green-600" : "text-red-600"
        }`}>
          {safeTrend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{Math.abs(safeTrend)}% vs last period</span>
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
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value || 0}</p>
          <p className="text-xs text-gray-600 mt-1">{sublabel}</p>
        </div>
        <div className="flex-shrink-0 text-lg">{icon}</div>
      </div>
    </div>
  )
}

function TrendIndicator({ value }: { value: number }) {
  const safeValue = value || 0
  return (
    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
      safeValue >= 0
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }`}>
      {safeValue >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      <span>{Math.abs(safeValue)}%</span>
    </div>
  )
}

function OrderItem({ order }: { order: OrderData }) {
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
        <span className="font-semibold text-sm tabular-nums">${(order.total_amount || 0).toFixed(2)}</span>
        <Badge className={`${statusColors[order.status] || statusColors.pending} border-0 text-xs`}>
          {order.status}
        </Badge>
      </div>
    </div>
  )
}
