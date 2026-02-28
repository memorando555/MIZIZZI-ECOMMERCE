"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
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
  Eye,
  AlertCircle,
  BarChart3,
  PieChart,
  Star,
  Zap,
  ArrowRight,
} from "lucide-react"
import { useAdminAuth } from "@/contexts/admin/auth-context"
import { Loader } from "@/components/ui/loader"
import { adminService } from "@/services/admin"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface AdminDashboardResponse {
  counts: {
    users: number
    products: number
    orders: number
    categories: number
    brands: number
    reviews: number
    pending_reviews: number
    newsletter_subscribers: number
    new_signups_today: number
    new_signups_week: number
    orders_in_transit: number
    pending_payments: number
    low_stock_count: number
  }
  sales: {
    today: number
    yesterday: number
    weekly: number
    monthly: number
    yearly: number
    total_revenue: number
    pending_amount: number
  }
  order_status: Record<string, number>
  recent_orders: any[]
  recent_users: any[]
  recent_activities: any[]
  low_stock_products: any[]
  sales_by_category: any[]
  best_selling_products: any[]
  traffic_sources: any[]
  notifications: any[]
  upcoming_events: any[]
  users_by_region: any[]
  revenue_vs_refunds: any[]
  active_users: any[]
  sales_data: any[]
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAdminAuth()
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null)
  const [healthData, setHealthData] = useState<any>(null)
  const [productStats, setProductStats] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllData = async () => {
    try {
      setIsRefreshing(true)
      setError(null)

      const dashData = await adminService.getDashboardData()
      setDashboardData(dashData)

      try {
        const health = await adminService.getDashboardHealth()
        setHealthData(health)
      } catch (err) {
        console.warn("Failed to fetch health data:", err)
      }

      try {
        const prodStats = await adminService.getProductStats()
        setProductStats(prodStats)
      } catch (err) {
        console.warn("Failed to fetch product stats:", err)
      }
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

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchAllData()
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-sm text-gray-300">Initializing dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-gray-300">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const data = dashboardData || adminService.getDefaultDashboardData()
  const salesGrowth = data.sales.yesterday > 0 ? Math.round(((data.sales.today - data.sales.yesterday) / data.sales.yesterday) * 100) : 0
  const isSystemHealthy = !error && healthData?.status === "healthy"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-gray-400 text-lg">Welcome back, {user?.name || "Admin"}</p>
            <div className="flex items-center gap-3 mt-3">
              <div className={`h-2.5 w-2.5 rounded-full ${isSystemHealthy ? "bg-emerald-500" : "bg-red-500"}`}></div>
              <span className="text-sm text-gray-400">System {isSystemHealthy ? "healthy" : "attention needed"}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={fetchAllData}
              disabled={isRefreshing}
              className="rounded-xl border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white font-semibold"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="lg"
              onClick={() => router.push("/admin/reports")}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-red-900 bg-red-950/50 rounded-xl">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <AlertDescription className="text-red-200 ml-3">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {isLoadingData ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <Loader />
              <p className="mt-4 text-sm text-gray-400">Loading metrics...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-2xl overflow-hidden group hover:border-blue-600/50 transition-all duration-300 shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-gray-400 font-semibold">Total Revenue</CardDescription>
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 rounded-xl group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all">
                      <DollarSign className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    ${(data.sales.total_revenue / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-400">
                    All-time cumulative
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-2xl overflow-hidden group hover:border-emerald-600/50 transition-all duration-300 shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-gray-400 font-semibold">Today's Sales</CardDescription>
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-3 rounded-xl group-hover:from-emerald-500/30 group-hover:to-emerald-600/30 transition-all">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    ${(data.sales.today / 1000).toFixed(1)}K
                  </div>
                  <div className={`text-sm font-semibold flex items-center gap-1 ${salesGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {salesGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {Math.abs(salesGrowth)}% vs yesterday
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-2xl overflow-hidden group hover:border-orange-600/50 transition-all duration-300 shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-gray-400 font-semibold">Active Orders</CardDescription>
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-3 rounded-xl group-hover:from-orange-500/30 group-hover:to-orange-600/30 transition-all">
                      <ShoppingCart className="h-5 w-5 text-orange-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    {data.counts.orders_in_transit}
                  </div>
                  <div className="text-sm text-gray-400">
                    Orders in transit
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-2xl overflow-hidden group hover:border-purple-600/50 transition-all duration-300 shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-gray-400 font-semibold">Total Customers</CardDescription>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-3 rounded-xl group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all">
                      <Users className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    {data.counts.users.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    +{data.counts.new_signups_today} today
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-xl shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-white mb-1">{data.counts.products}</div>
                  <p className="text-xs text-gray-400 font-medium">Products</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-xl shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-white mb-1">{data.counts.categories}</div>
                  <p className="text-xs text-gray-400 font-medium">Categories</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-xl shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-400 mb-1">{data.counts.low_stock_count}</div>
                      <p className="text-xs text-gray-400 font-medium">Low Stock</p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-xl shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-400 mb-1">{data.counts.pending_payments}</div>
                  <p className="text-xs text-gray-400 font-medium">Pending</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-xl shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">{data.counts.reviews}</div>
                  <p className="text-xs text-gray-400 font-medium">Reviews</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-xl shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{data.counts.newsletter_subscribers}</div>
                  <p className="text-xs text-gray-400 font-medium">Subscribers</p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-2xl lg:col-span-2 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Sales Performance
                  </CardTitle>
                  <CardDescription className="text-gray-400">Daily, weekly, and monthly breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300 font-medium">Today</span>
                      <span className="font-semibold text-white">${(data.sales.today / 1000).toFixed(1)}K</span>
                    </div>
                    <Progress value={Math.min((data.sales.today / (data.sales.monthly / 30)) * 100, 100)} className="h-2.5 bg-gray-700" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300 font-medium">This Week</span>
                      <span className="font-semibold text-white">${(data.sales.weekly / 1000).toFixed(1)}K</span>
                    </div>
                    <Progress value={Math.min((data.sales.weekly / (data.sales.monthly / 4)) * 100, 100)} className="h-2.5 bg-gray-700" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300 font-medium">This Month</span>
                      <span className="font-semibold text-white">${(data.sales.monthly / 1000).toFixed(1)}K</span>
                    </div>
                    <Progress value={100} className="h-2.5 bg-gray-700" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-400" />
                    Quick Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400">Yearly Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">${(data.sales.yearly / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400">Pending Amount</p>
                    <p className="text-2xl font-bold text-orange-400 mt-1">${(data.sales.pending_amount / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400">New Signups</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">+{data.counts.new_signups_week}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            {data.recent_orders?.length > 0 && (
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-2xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-orange-400" />
                      Recent Orders
                    </CardTitle>
                    <CardDescription className="text-gray-400">Latest 8 transactions</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/admin/orders")}
                    className="text-blue-400 hover:bg-gray-700 font-semibold"
                  >
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recent_orders.slice(0, 8).map((order, idx) => (
                      <div key={order.id || idx} className="flex items-center justify-between p-4 bg-gray-900/40 rounded-xl hover:bg-gray-900/60 transition-colors border border-gray-700/50">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white text-sm">{order.order_number || `Order #${order.id}`}</p>
                          <p className="text-xs text-gray-400">{order.user_email || "Customer"}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-2">
                          <span className="font-bold text-white">${parseFloat(order.total_amount || 0).toFixed(2)}</span>
                          <Badge className="bg-blue-900 text-blue-200 text-xs font-semibold">{order.status || "pending"}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Low Stock Products */}
            {data.low_stock_products?.length > 0 && (
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-orange-900/50 rounded-2xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                      Low Stock Products
                    </CardTitle>
                    <CardDescription className="text-gray-400">{data.counts.low_stock_count} products need attention</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/admin/inventory")}
                    className="text-orange-400 hover:bg-orange-950/40 font-semibold"
                  >
                    Manage <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.low_stock_products.slice(0, 6).map((product, idx) => (
                      <div key={product.id || idx} className="flex items-center justify-between p-4 bg-orange-950/20 rounded-xl border border-orange-900/30 hover:bg-orange-950/30 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white text-sm truncate">{product.name}</p>
                          <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-orange-400 text-sm">{product.stock} units</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/inventory?id=${product.id}`)}
                            className="mt-2 h-7 text-xs border-orange-700 text-orange-400 hover:bg-orange-950 font-semibold"
                          >
                            Restock
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Best Selling Products */}
            {data.best_selling_products?.length > 0 && (
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    Best Selling Products
                  </CardTitle>
                  <CardDescription className="text-gray-400">Top 6 performers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.best_selling_products.slice(0, 6).map((product, idx) => (
                      <div key={product.id || idx} className="p-4 bg-gray-900/40 rounded-xl border border-gray-700 hover:border-yellow-900/50 transition-all hover:shadow-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-3xl font-bold text-yellow-400">#{idx + 1}</div>
                          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        </div>
                        <p className="font-semibold text-white text-sm mb-1 truncate">{product.name}</p>
                        <p className="text-xs text-gray-400 mb-3">{product.sales_count || 0} sales</p>
                        <p className="text-lg font-bold text-emerald-400">${parseFloat(product.revenue || 0).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            {data.recent_activities?.length > 0 && (
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-gray-400">Store events and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recent_activities.slice(0, 10).map((activity, idx) => (
                      <div key={activity.id || idx} className="flex items-start gap-3 pb-3 border-b border-gray-700 last:border-0 last:pb-0">
                        <div className="bg-blue-950/40 p-2 rounded-lg flex-shrink-0 mt-1 border border-blue-900/50">
                          <Activity className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-200">{activity.message || activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
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
            {Object.keys(data.order_status || {}).length > 0 && (
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    Order Status Distribution
                  </CardTitle>
                  <CardDescription className="text-gray-400">Current order breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(data.order_status || {}).map(([status, count]) => (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300 capitalize">{status}</span>
                          <span className="text-sm font-bold text-white">{count as number}</span>
                        </div>
                        <Progress 
                          value={Math.min(((count as number) / data.counts.orders) * 100, 100)} 
                          className="h-2.5 bg-gray-700"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Customers */}
            {data.recent_users?.length > 0 && (
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 rounded-2xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-400" />
                      Recent Customers
                    </CardTitle>
                    <CardDescription className="text-gray-400">New registrations and activity</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/admin/customers")}
                    className="text-purple-400 hover:bg-gray-700 font-semibold"
                  >
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recent_users.slice(0, 8).map((user, idx) => (
                      <div key={user.id || idx} className="flex items-center justify-between p-4 bg-gray-900/40 rounded-xl hover:bg-gray-900/60 transition-colors border border-gray-700/50">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white text-sm">{user.name || user.username}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                        <Badge className="bg-purple-900 text-purple-200 text-xs font-semibold">Customer</Badge>
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
