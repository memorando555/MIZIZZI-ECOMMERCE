"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Truck,
  MessageSquare,
  ArrowRight,
  Clock,
  AlertCircle,
  Zap,
  Mail,
  Star,
  Eye,
  Gift,
  CreditCard,
  Percent,
  HardDrive,
} from "lucide-react"
import { useAdminAuth } from "@/contexts/admin/auth-context"
import { Loader } from "@/components/ui/loader"
import { adminService } from "@/services/admin"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface AdminDashboardResponse {
  counts: Record<string, number>
  sales: Record<string, number>
  order_status: Record<string, number>
  recent_orders: any[]
  recent_users: any[]
  recent_activities: any[]
  low_stock_products: any[]
  sales_by_category: any[]
  best_selling_products: any[]
  traffic_sources?: any[]
  notifications?: any[]
  upcoming_events?: any[]
  users_by_region?: any[]
  revenue_vs_refunds?: any[]
  active_users?: any[]
  sales_data?: any[]
}

interface AdditionalStats {
  productStats?: any
  salesStats?: any
  customerMetrics?: any
  reviewStats?: any
  inventoryStats?: any
  marketingStats?: any
  couponStats?: any
  shippingStats?: any
  refundStats?: any
  paymentMethods?: any
  trafficSources?: any
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAdminAuth()
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null)
  const [additionalStats, setAdditionalStats] = useState<AdditionalStats>({})
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Main dashboard data fetch
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
      setIsRefreshing(false)
    }
  }

  // Fetch additional stats in parallel
  const fetchAdditionalStats = async () => {
    try {
      const [
        productStats,
        customerMetrics,
        reviewStats,
        inventoryStats,
        marketingStats,
        couponStats,
        shippingStats,
        refundStats,
        paymentMethods,
        trafficSources,
      ] = await Promise.allSettled([
        adminService.getProductStats(),
        adminService.getCustomerMetrics(),
        adminService.getReviewStats(),
        adminService.getInventoryStats(),
        adminService.getMarketingStats(),
        adminService.getCouponStats(),
        adminService.getShippingStats(),
        adminService.getRefundStats(),
        adminService.getPaymentMethods(),
        adminService.getTrafficSources(),
      ])

      setAdditionalStats({
        productStats: productStats.status === "fulfilled" ? productStats.value : null,
        customerMetrics: customerMetrics.status === "fulfilled" ? customerMetrics.value : null,
        reviewStats: reviewStats.status === "fulfilled" ? reviewStats.value : null,
        inventoryStats: inventoryStats.status === "fulfilled" ? inventoryStats.value : null,
        marketingStats: marketingStats.status === "fulfilled" ? marketingStats.value : null,
        couponStats: couponStats.status === "fulfilled" ? couponStats.value : null,
        shippingStats: shippingStats.status === "fulfilled" ? shippingStats.value : null,
        refundStats: refundStats.status === "fulfilled" ? refundStats.value : null,
        paymentMethods: paymentMethods.status === "fulfilled" ? paymentMethods.value : null,
        trafficSources: trafficSources.status === "fulfilled" ? trafficSources.value : null,
      })
    } catch (err) {
      console.warn("[v0] Error fetching additional stats:", err)
    }
  }

  // Load all data when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setIsLoadingData(true)
      Promise.all([fetchDashboardData(), fetchAdditionalStats()]).finally(() => {
        setIsLoadingData(false)
      })
    }
  }, [isAuthenticated, isLoading])

  // Redirect if not authenticated
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader />
          <p className="mt-2 text-sm text-gray-600">Loading admin panel...</p>
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

  // Get order status counts
  const orderStatusEntries = Object.entries(data.order_status || {}).map(([status, count]) => ({
    status,
    count: count as number,
  }))

  // Safe number formatting
  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) return "$0.00"
    return `$${(value / 1000000).toFixed(1)}M`
  }

  const formatNumber = (value: number) => {
    if (!value || isNaN(value)) return "0"
    return value.toLocaleString()
  }

  return (
    <div className="min-h-screen bg-white w-full">
      <div className="w-full p-2 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-base text-gray-600 mt-2 font-medium">
              Welcome back, {user?.name || "Admin"}. Here's your complete store overview.
            </p>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500 mt-3">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : "bg-green-500"}`}></div>
                <span className="font-medium">System {error ? "error" : "healthy"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoadingData(true)
                Promise.all([fetchDashboardData(), fetchAdditionalStats()]).finally(() => {
                  setIsLoadingData(false)
                })
              }}
              disabled={isRefreshing}
              className="rounded-lg text-xs h-8 sm:h-9 border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="ml-1 hidden sm:inline font-medium">Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/admin/reports")}
              className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs h-8 sm:h-9 font-medium"
            >
              <Download className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm ml-3">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoadingData ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <Loader />
              <p className="mt-3 text-sm text-gray-600 font-medium">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-5 bg-white border border-gray-200 rounded-lg p-1 h-auto gap-0">
              <TabsTrigger value="overview" className="rounded text-xs md:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="sales" className="rounded text-xs md:text-sm">Sales</TabsTrigger>
              <TabsTrigger value="customers" className="rounded text-xs md:text-sm">Customers</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded text-xs md:text-sm">Inventory</TabsTrigger>
              <TabsTrigger value="marketing" className="rounded text-xs md:text-sm">Marketing</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6 md:space-y-8">
              {/* Primary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {/* Total Revenue */}
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardDescription className="text-gray-600 text-xs md:text-sm font-bold uppercase tracking-wider">
                          Total Revenue
                        </CardDescription>
                        <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                          {formatCurrency(data.sales.total_revenue)}
                        </CardTitle>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg flex-shrink-0">
                        <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                      </div>
                    </div>
                    {data.sales.pending_amount > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600">Pending: ${(data.sales.pending_amount / 1000).toFixed(1)}K</p>
                      </div>
                    )}
                  </CardHeader>
                </Card>

                {/* Today's Sales */}
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardDescription className="text-gray-600 text-xs md:text-sm font-bold uppercase tracking-wider">
                          Today's Sales
                        </CardDescription>
                        <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                          ${(data.sales.today / 1000).toFixed(1)}K
                        </CardTitle>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg flex-shrink-0">
                        <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      </div>
                    </div>
                    {salesGrowth !== 0 && (
                      <div className={`flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-200 text-xs font-semibold ${salesGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {salesGrowth >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        <span>{Math.abs(salesGrowth)}% vs yesterday</span>
                      </div>
                    )}
                  </CardHeader>
                </Card>

                {/* Total Orders */}
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardDescription className="text-gray-600 text-xs md:text-sm font-bold uppercase tracking-wider">
                          Total Orders
                        </CardDescription>
                        <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                          {formatNumber(data.counts.orders)}
                        </CardTitle>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg flex-shrink-0">
                        <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                      </div>
                    </div>
                    {data.counts.orders_in_transit > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-orange-600 font-medium">{data.counts.orders_in_transit} in transit</p>
                      </div>
                    )}
                  </CardHeader>
                </Card>

                {/* Total Customers */}
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardDescription className="text-gray-600 text-xs md:text-sm font-bold uppercase tracking-wider">
                          Total Customers
                        </CardDescription>
                        <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                          {formatNumber(data.counts.users)}
                        </CardTitle>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg flex-shrink-0">
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                      </div>
                    </div>
                    {data.counts.new_signups_today > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-purple-600 font-medium">+{data.counts.new_signups_today} new today</p>
                      </div>
                    )}
                  </CardHeader>
                </Card>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardDescription className="text-xs md:text-sm font-bold uppercase text-gray-600">Products</CardDescription>
                        <CardTitle className="text-2xl md:text-3xl font-bold mt-2">{formatNumber(data.counts.products)}</CardTitle>
                      </div>
                      <div className="bg-cyan-50 p-3 rounded-lg flex-shrink-0">
                        <Package className="h-5 w-5 text-cyan-600" />
                      </div>
                    </div>
                    {data.counts.low_stock_count > 0 && (
                      <Badge variant="destructive" className="text-xs mt-3">
                        {data.counts.low_stock_count} low stock
                      </Badge>
                    )}
                  </CardHeader>
                </Card>

                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardDescription className="text-xs md:text-sm font-bold uppercase text-gray-600">Categories</CardDescription>
                        <CardTitle className="text-2xl md:text-3xl font-bold mt-2">{data.counts.categories}</CardTitle>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-lg flex-shrink-0">
                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-emerald-600 font-medium">{data.counts.brands} brands</p>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardDescription className="text-xs md:text-sm font-bold uppercase text-gray-600">Pending Orders</CardDescription>
                        <CardTitle className="text-2xl md:text-3xl font-bold mt-2">{data.counts.pending_payments}</CardTitle>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-red-600 font-medium">Needs attention</p>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardDescription className="text-xs md:text-sm font-bold uppercase text-gray-600">Reviews</CardDescription>
                        <CardTitle className="text-2xl md:text-3xl font-bold mt-2">{formatNumber(data.counts.reviews)}</CardTitle>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg flex-shrink-0">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                    {data.counts.pending_reviews > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-yellow-600 font-medium">{data.counts.pending_reviews} pending</p>
                      </div>
                    )}
                  </CardHeader>
                </Card>
              </div>

              {/* Recent Orders */}
              {data.recent_orders && data.recent_orders.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg md:text-xl font-bold">Recent Orders</CardTitle>
                        <CardDescription className="text-xs md:text-sm mt-1">Latest customer transactions</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/admin/orders")}
                        className="text-xs h-8"
                      >
                        View All <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="space-y-2">
                      {data.recent_orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900 truncate">{order.order_number || order.id}</p>
                            <p className="text-xs text-gray-600 truncate mt-0.5">{order.user_email || "Customer"}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-3">
                            <span className="font-bold text-sm">${parseFloat(order.total_amount || 0).toFixed(2)}</span>
                            <Badge variant="outline" className="text-xs">{order.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Customers */}
              {data.recent_users && data.recent_users.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg md:text-xl font-bold">Recent Customers</CardTitle>
                        <CardDescription className="text-xs md:text-sm mt-1">New registrations</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/admin/customers")}
                        className="text-xs h-8"
                      >
                        View All <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="space-y-2">
                      {data.recent_users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-600 truncate mt-0.5">{user.email}</p>
                          </div>
                          <Badge variant="outline" className="text-xs ml-3">Customer</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Low Stock Products */}
              {data.low_stock_products && data.low_stock_products.length > 0 && (
                <Card className="bg-white border border-orange-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-orange-200 bg-orange-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div>
                          <CardTitle className="text-lg md:text-xl font-bold text-gray-900">Low Stock Alert</CardTitle>
                          <CardDescription className="text-xs md:text-sm mt-1">{data.counts.low_stock_count} products need restocking</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => router.push("/admin/inventory")} className="text-xs h-8">
                        Manage
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="space-y-2">
                      {data.low_stock_products.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-600 mt-0.5">SKU: {product.sku}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-3">
                            <div className="text-right">
                              <p className="font-bold text-sm text-orange-600">{product.stock}</p>
                              <p className="text-xs text-gray-600">in stock</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              {data.recent_activities && data.recent_activities.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg md:text-xl font-bold">Recent Activity</CardTitle>
                        <CardDescription className="text-xs md:text-sm mt-1">Live feed of store events</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="space-y-3">
                      {data.recent_activities.slice(0, 8).map((activity, idx) => (
                        <div key={activity.id || idx} className={`flex items-start gap-3 pb-3 ${idx < data.recent_activities.length - 1 ? "border-b border-gray-200" : ""}`}>
                          <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                            <Activity className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : activity.time || "Just now"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Status Distribution */}
              {orderStatusEntries.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                    <CardTitle className="text-lg md:text-xl font-bold">Order Status Distribution</CardTitle>
                    <CardDescription className="text-xs md:text-sm mt-1">Current order breakdown by status</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="space-y-4">
                      {orderStatusEntries.map(({ status, count }) => (
                        <div key={status}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700 capitalize">{status.replace(/_/g, " ")}</span>
                            <span className="text-sm font-bold text-gray-900">{count}</span>
                          </div>
                          <Progress value={Math.min((count / data.counts.orders) * 100, 100)} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Best Selling Products */}
              {data.best_selling_products && data.best_selling_products.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                    <CardTitle className="text-lg md:text-xl font-bold">Top Selling Products</CardTitle>
                    <CardDescription className="text-xs md:text-sm mt-1">Your best performers this period</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="space-y-2">
                      {data.best_selling_products.slice(0, 5).map((product, idx) => (
                        <div key={product.id || idx} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{product.sales_count || 0} sales</p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="font-bold text-sm">${parseFloat(product.revenue || 0).toFixed(0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* SALES TAB */}
            <TabsContent value="sales" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                    <CardTitle className="text-lg md:text-xl font-bold">Sales by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    {data.sales_by_category && data.sales_by_category.length > 0 ? (
                      <div className="space-y-3">
                        {data.sales_by_category.slice(0, 6).map((cat, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{cat.category}</span>
                            <div className="text-right">
                              <p className="text-sm font-bold">${parseFloat(cat.revenue || 0).toFixed(0)}</p>
                              <p className="text-xs text-gray-600">{cat.items_sold || 0} items</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No sales data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                    <CardTitle className="text-lg md:text-xl font-bold">Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    {additionalStats.paymentMethods?.methods ? (
                      <div className="space-y-3">
                        {additionalStats.paymentMethods.methods.slice(0, 5).map((method: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-900">{method.name}</span>
                            </div>
                            <span className="text-sm font-bold">{method.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No payment data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                  <CardTitle className="text-lg md:text-xl font-bold">Refund Statistics</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 md:p-6">
                  {additionalStats.refundStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase">Total Refunds</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">${parseFloat(additionalStats.refundStats.total_refunds || 0).toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase">Refund Rate</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{additionalStats.refundStats.refund_rate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium uppercase">Pending</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{additionalStats.refundStats.pending_refunds || 0}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No refund data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CUSTOMERS TAB */}
            <TabsContent value="customers" className="space-y-6">
              {additionalStats.customerMetrics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardHeader className="p-4 sm:p-5 md:p-6">
                      <CardDescription className="text-xs font-bold uppercase text-gray-600">Total Customers</CardDescription>
                      <CardTitle className="text-2xl font-bold mt-2">{formatNumber(additionalStats.customerMetrics.total_customers)}</CardTitle>
                      {additionalStats.customerMetrics.new_today > 0 && (
                        <p className="text-xs text-green-600 mt-2">+{additionalStats.customerMetrics.new_today} new today</p>
                      )}
                    </CardHeader>
                  </Card>

                  <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardHeader className="p-4 sm:p-5 md:p-6">
                      <CardDescription className="text-xs font-bold uppercase text-gray-600">Repeat Rate</CardDescription>
                      <CardTitle className="text-2xl font-bold mt-2">{additionalStats.customerMetrics.repeat_rate || 0}%</CardTitle>
                      <p className="text-xs text-gray-600 mt-2">Repeat Customers</p>
                    </CardHeader>
                  </Card>

                  <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardHeader className="p-4 sm:p-5 md:p-6">
                      <CardDescription className="text-xs font-bold uppercase text-gray-600">Avg Customer Lifetime Value</CardDescription>
                      <CardTitle className="text-2xl font-bold mt-2">${parseFloat(additionalStats.customerMetrics.lifetime_value || 0).toFixed(2)}</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardHeader className="p-4 sm:p-5 md:p-6">
                      <CardDescription className="text-xs font-bold uppercase text-gray-600">Churn Rate</CardDescription>
                      <CardTitle className="text-2xl font-bold mt-2">{additionalStats.customerMetrics.churn_rate || 0}%</CardTitle>
                    </CardHeader>
                  </Card>

                  <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardHeader className="p-4 sm:p-5 md:p-6">
                      <CardDescription className="text-xs font-bold uppercase text-gray-600">Satisfaction Score</CardDescription>
                      <CardTitle className="text-2xl font-bold mt-2">{additionalStats.customerMetrics.satisfaction_score || 0}/5</CardTitle>
                    </CardHeader>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* INVENTORY TAB */}
            <TabsContent value="inventory" className="space-y-6">
              {additionalStats.inventoryStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardHeader className="p-4 sm:p-5 md:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardDescription className="text-xs font-bold uppercase text-gray-600">Total Products</CardDescription>
                          <CardTitle className="text-2xl font-bold mt-2">{formatNumber(additionalStats.inventoryStats.total_products)}</CardTitle>
                        </div>
                        <Package className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardHeader className="p-4 sm:p-5 md:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardDescription className="text-xs font-bold uppercase text-gray-600">Low Stock</CardDescription>
                          <CardTitle className="text-2xl font-bold mt-2 text-orange-600">{additionalStats.inventoryStats.low_stock}</CardTitle>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardHeader className="p-4 sm:p-5 md:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardDescription className="text-xs font-bold uppercase text-gray-600">Out of Stock</CardDescription>
                          <CardTitle className="text-2xl font-bold mt-2 text-red-600">{additionalStats.inventoryStats.out_of_stock}</CardTitle>
                        </div>
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardHeader className="p-4 sm:p-5 md:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardDescription className="text-xs font-bold uppercase text-gray-600">Total Value</CardDescription>
                          <CardTitle className="text-2xl font-bold mt-2">${parseFloat(additionalStats.inventoryStats.total_value || 0).toFixed(0)}</CardTitle>
                        </div>
                        <HardDrive className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* MARKETING TAB */}
            <TabsContent value="marketing" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {additionalStats.marketingStats && (
                  <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                      <CardTitle className="text-lg md:text-xl font-bold">Marketing Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 md:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Newsletter Subscribers</span>
                        <span className="text-lg font-bold">{formatNumber(additionalStats.marketingStats.newsletter_subscribers)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Email Campaigns</span>
                        <span className="text-lg font-bold">{additionalStats.marketingStats.email_campaigns}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Open Rate</span>
                        <span className="text-lg font-bold text-blue-600">{additionalStats.marketingStats.campaign_open_rate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Click Rate</span>
                        <span className="text-lg font-bold text-green-600">{additionalStats.marketingStats.campaign_click_rate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Social Followers</span>
                        <span className="text-lg font-bold">{formatNumber(additionalStats.marketingStats.social_followers)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {additionalStats.couponStats && (
                  <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardHeader className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                      <CardTitle className="text-lg md:text-xl font-bold">Coupon Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 md:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Active Coupons</span>
                        <span className="text-lg font-bold">{additionalStats.couponStats.active_coupons}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Total Used</span>
                        <span className="text-lg font-bold">{additionalStats.couponStats.total_used}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Total Discounts</span>
                        <span className="text-lg font-bold text-red-600">${parseFloat(additionalStats.couponStats.total_discounts || 0).toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Conversion Lift</span>
                        <span className="text-lg font-bold text-green-600">+{additionalStats.couponStats.conversion_lift}%</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
