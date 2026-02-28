"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  RefreshCw,
  Download,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  MessageSquare,
  ArrowRight,
  Clock,
  AlertCircle,
  BarChart3,
  Star,
  Eye,
  Heart,
  Tag,
  Truck,
  BarChart,
  Gauge,
} from "lucide-react"
import { useAdminAuth } from "@/contexts/admin/auth-context"
import { Loader } from "@/components/ui/loader"
import { adminService } from "@/services/admin"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

const CARD_GRADIENTS = {
  blue: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700",
  green: "bg-gradient-to-br from-green-500 via-green-600 to-emerald-700",
  orange: "bg-gradient-to-br from-orange-500 via-orange-600 to-red-700",
  purple: "bg-gradient-to-br from-purple-500 via-purple-600 to-pink-700",
  cyan: "bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-700",
  emerald: "bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700",
  red: "bg-gradient-to-br from-red-500 via-red-600 to-rose-700",
  yellow: "bg-gradient-to-br from-yellow-500 via-amber-600 to-orange-700",
  indigo: "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-700",
  teal: "bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700",
  pink: "bg-gradient-to-br from-pink-500 via-rose-600 to-red-700",
  violet: "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700",
}

function MetricCard({
  title,
  value,
  icon: Icon,
  gradient,
  onClick,
  subtitle,
  trend,
}: {
  title: string
  value: string | number
  icon: any
  gradient: string
  onClick?: () => void
  subtitle?: string
  trend?: { value: number; positive: boolean }
}) {
  return (
    <div
      onClick={onClick}
      className={`${gradient} rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 h-full flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <p className="text-white/80 text-sm font-bold uppercase tracking-widest">{title}</p>
            <p className="text-4xl md:text-5xl font-black mt-4 text-white drop-shadow-lg">{value}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl flex-shrink-0">
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>

        {subtitle && <p className="text-white/70 text-sm font-semibold mt-3">{subtitle}</p>}
      </div>

      {trend && (
        <div className={`flex items-center gap-2 text-sm font-bold mt-4 ${trend.positive ? "text-green-200" : "text-red-200"}`}>
          {trend.positive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
          <span>{Math.abs(trend.value)}% vs last period</span>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAdminAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    } finally {
      setIsLoadingData(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchDashboardData()
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader />
          <p className="mt-3 text-sm text-gray-600">Loading admin panel...</p>
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
  const salesGrowth =
    data.sales?.yesterday > 0 ? Math.round(((data.sales?.today - data.sales?.yesterday) / data.sales?.yesterday) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 w-full">
      <div className="w-full p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-600 mt-3 text-lg font-semibold">Welcome back, {user?.name || "Admin"}.</p>
            <div className="flex items-center gap-6 text-sm text-gray-500 mt-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${error ? "bg-red-500" : "bg-green-500"}`}></div>
                <span className="font-bold">System {error ? "error" : "healthy"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="rounded-2xl border-2 border-gray-300 hover:bg-gray-100 font-bold h-12"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="ml-2">Refresh</span>
            </Button>
            <Button
              size="lg"
              onClick={() => router.push("/admin/reports")}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold h-12"
            >
              <Download className="h-5 w-5" />
              <span className="ml-2">Export</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-2 border-red-300 bg-red-50 rounded-2xl">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold ml-3">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoadingData ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <Loader />
              <p className="mt-4 text-base text-gray-600 font-bold">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white rounded-2xl shadow-lg p-2 mb-8 border-2 border-gray-200">
              <TabsTrigger value="overview" className="rounded-xl font-bold text-sm md:text-base">
                Overview
              </TabsTrigger>
              <TabsTrigger value="sales" className="rounded-xl font-bold text-sm md:text-base">
                Sales
              </TabsTrigger>
              <TabsTrigger value="customers" className="rounded-xl font-bold text-sm md:text-base">
                Customers
              </TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-xl font-bold text-sm md:text-base">
                Inventory
              </TabsTrigger>
              <TabsTrigger value="marketing" className="rounded-xl font-bold text-sm md:text-base">
                Marketing
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-8">
              {/* Primary KPIs - 4 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Revenue"
                  value={`$${(data.sales?.total_revenue || 0).toLocaleString()}`}
                  icon={DollarSign}
                  gradient={CARD_GRADIENTS.blue}
                  onClick={() => router.push("/admin/sales")}
                  trend={{ value: salesGrowth, positive: salesGrowth >= 0 }}
                />
                <MetricCard
                  title="Today's Sales"
                  value={`$${((data.sales?.today || 0) / 1000).toFixed(1)}K`}
                  icon={TrendingUp}
                  gradient={CARD_GRADIENTS.green}
                  onClick={() => router.push("/admin/sales")}
                  subtitle={`+${salesGrowth}% vs yesterday`}
                />
                <MetricCard
                  title="Total Orders"
                  value={data.counts?.orders || 0}
                  icon={ShoppingCart}
                  gradient={CARD_GRADIENTS.orange}
                  onClick={() => router.push("/admin/orders")}
                  subtitle={`${data.counts?.orders_in_transit || 0} in transit`}
                />
                <MetricCard
                  title="Total Customers"
                  value={data.counts?.users || 0}
                  icon={Users}
                  gradient={CARD_GRADIENTS.purple}
                  onClick={() => router.push("/admin/customers")}
                  subtitle={`+${data.counts?.new_signups_today || 0} new today`}
                />
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Products"
                  value={data.counts?.products || 0}
                  icon={Package}
                  gradient={CARD_GRADIENTS.cyan}
                  onClick={() => router.push("/admin/products")}
                  subtitle={`${data.counts?.low_stock_count || 0} low stock`}
                />
                <MetricCard
                  title="Categories"
                  value={data.counts?.categories || 0}
                  icon={BarChart3}
                  gradient={CARD_GRADIENTS.emerald}
                  onClick={() => router.push("/admin/categories")}
                  subtitle={`${data.counts?.brands || 0} brands`}
                />
                <MetricCard
                  title="Pending Orders"
                  value={data.counts?.pending_payments || 0}
                  icon={AlertTriangle}
                  gradient={CARD_GRADIENTS.red}
                  onClick={() => router.push("/admin/orders?status=pending")}
                  subtitle="Needs attention"
                />
                <MetricCard
                  title="Reviews"
                  value={data.counts?.reviews || 0}
                  icon={Star}
                  gradient={CARD_GRADIENTS.yellow}
                  onClick={() => router.push("/admin/reviews")}
                  subtitle={`${data.counts?.pending_reviews || 0} pending`}
                />
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Subscribers"
                  value={data.counts?.newsletter_subscribers || 0}
                  icon={MessageSquare}
                  gradient={CARD_GRADIENTS.indigo}
                  onClick={() => router.push("/admin/newsletters")}
                  subtitle={`${data.counts?.new_signups_week || 0} this week`}
                />
                <MetricCard
                  title="Active Sessions"
                  value={data.counts?.total_active_sessions || 0}
                  icon={Eye}
                  gradient={CARD_GRADIENTS.teal}
                  onClick={() => router.push("/admin/analytics")}
                  subtitle="Online now"
                />
                <MetricCard
                  title="In Transit"
                  value={data.counts?.orders_in_transit || 0}
                  icon={Truck}
                  gradient={CARD_GRADIENTS.pink}
                  onClick={() => router.push("/admin/shipping")}
                  subtitle="Being delivered"
                />
              </div>

              {/* Recent Orders */}
              {data.recent_orders?.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-3xl font-black text-gray-900">Recent Orders</h3>
                    <Button
                      variant="ghost"
                      onClick={() => router.push("/admin/orders")}
                      className="text-blue-600 hover:bg-blue-50 font-bold text-lg"
                    >
                      View All <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {data.recent_orders.slice(0, 5).map((order: any) => (
                      <div
                        key={order.id}
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl hover:shadow-lg transition-all cursor-pointer border-2 border-blue-100 hover:border-blue-300"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-lg text-gray-900">{order.order_number || `Order #${order.id}`}</p>
                          <p className="text-sm text-gray-600 mt-1 font-semibold">{order.user_email}</p>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <span className="font-black text-2xl text-gray-900">${(order.total_amount || 0).toFixed(2)}</span>
                          <Badge className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Selling Products */}
              {data.best_selling_products?.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-3xl font-black text-gray-900">Top Sellers</h3>
                    <Button variant="ghost" onClick={() => router.push("/admin/products")} className="text-green-600 hover:bg-green-50 font-bold text-lg">
                      View All <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {data.best_selling_products.slice(0, 5).map((product: any) => (
                      <div
                        key={product.id}
                        onClick={() => router.push(`/admin/products/${product.id}`)}
                        className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl hover:shadow-lg transition-all cursor-pointer border-2 border-green-100 hover:border-green-300"
                      >
                        <div>
                          <p className="font-bold text-lg text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600 mt-1 font-semibold">{product.sales_count} sales</p>
                        </div>
                        <p className="font-black text-2xl text-green-600">${(product.revenue || 0).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Stock Alert */}
              {data.low_stock_products?.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 via-red-50 to-rose-50 rounded-3xl shadow-lg border-3 border-orange-300 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-orange-600 p-3 rounded-2xl">
                        <AlertTriangle className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-orange-900">Low Stock Alert</h3>
                        <p className="text-orange-700 font-bold mt-1">{data.counts?.low_stock_count} items need restocking</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push("/admin/inventory")}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl text-lg"
                    >
                      Manage Now
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.low_stock_products.slice(0, 4).map((product: any) => (
                      <div
                        key={product.id}
                        onClick={() => router.push(`/admin/products/${product.id}`)}
                        className="flex items-center justify-between p-4 bg-white/60 rounded-2xl hover:bg-white transition-all cursor-pointer border-2 border-orange-200"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-600 font-semibold">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg text-orange-600">{product.stock}</p>
                          <p className="text-xs text-gray-600">in stock</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* SALES TAB */}
            <TabsContent value="sales" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                  title="Weekly Sales"
                  value={`$${((data.sales?.weekly || 0) / 1000).toFixed(1)}K`}
                  icon={BarChart}
                  gradient={CARD_GRADIENTS.blue}
                  onClick={() => router.push("/admin/sales?period=weekly")}
                />
                <MetricCard
                  title="Monthly Sales"
                  value={`$${((data.sales?.monthly || 0) / 1000).toFixed(0)}K`}
                  icon={BarChart}
                  gradient={CARD_GRADIENTS.purple}
                  onClick={() => router.push("/admin/sales?period=monthly")}
                />
                <MetricCard
                  title="Yearly Sales"
                  value={`$${((data.sales?.yearly || 0) / 1000000).toFixed(1)}M`}
                  icon={BarChart}
                  gradient={CARD_GRADIENTS.green}
                  onClick={() => router.push("/admin/sales?period=yearly")}
                />
              </div>

              {data.sales_by_category?.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-8">
                  <h3 className="text-3xl font-black text-gray-900 mb-8">Sales by Category</h3>
                  <div className="space-y-5">
                    {data.sales_by_category.map((cat: any, idx: number) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-lg text-gray-700">{cat.category}</span>
                          <span className="font-black text-xl text-gray-900">${(cat.revenue || 0).toLocaleString()}</span>
                        </div>
                        <Progress
                          value={Math.min((cat.revenue / Math.max(...data.sales_by_category.map((c: any) => c.revenue), 1)) * 100, 100)}
                          className="h-4 rounded-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* CUSTOMERS TAB */}
            <TabsContent value="customers" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Total Customers"
                  value={data.counts?.users || 0}
                  icon={Users}
                  gradient={CARD_GRADIENTS.purple}
                  onClick={() => router.push("/admin/customers")}
                />
                <MetricCard
                  title="New This Week"
                  value={data.counts?.new_signups_week || 0}
                  icon={TrendingUp}
                  gradient={CARD_GRADIENTS.green}
                  onClick={() => router.push("/admin/customers?filter=new")}
                />
                <MetricCard
                  title="New Today"
                  value={data.counts?.new_signups_today || 0}
                  icon={Heart}
                  gradient={CARD_GRADIENTS.red}
                  onClick={() => router.push("/admin/customers?filter=today")}
                />
              </div>

              {data.recent_users?.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-8">
                  <h3 className="text-3xl font-black text-gray-900 mb-6">Recent Customers</h3>
                  <div className="space-y-3">
                    {data.recent_users.slice(0, 8).map((user: any) => (
                      <div
                        key={user.id}
                        onClick={() => router.push(`/admin/customers/${user.id}`)}
                        className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl hover:shadow-lg transition-all cursor-pointer border-2 border-purple-100 hover:border-purple-300"
                      >
                        <div>
                          <p className="font-bold text-lg text-gray-900">{user.name || user.username}</p>
                          <p className="text-sm text-gray-600 mt-1 font-semibold">{user.email}</p>
                        </div>
                        <Badge className="px-4 py-2 text-xs font-bold rounded-lg bg-purple-600 text-white">Customer</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* INVENTORY TAB */}
            <TabsContent value="inventory" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Products"
                  value={data.counts?.products || 0}
                  icon={Package}
                  gradient={CARD_GRADIENTS.cyan}
                  onClick={() => router.push("/admin/products")}
                />
                <MetricCard
                  title="Low Stock"
                  value={data.counts?.low_stock_count || 0}
                  icon={AlertTriangle}
                  gradient={CARD_GRADIENTS.orange}
                  onClick={() => router.push("/admin/inventory?filter=low")}
                  subtitle="Need reorder"
                />
                <MetricCard
                  title="Out of Stock"
                  value={data.counts?.out_of_stock_count || 0}
                  icon={AlertCircle}
                  gradient={CARD_GRADIENTS.red}
                  onClick={() => router.push("/admin/inventory?filter=out")}
                  subtitle="Urgent"
                />
                <MetricCard
                  title="Categories"
                  value={data.counts?.categories || 0}
                  icon={BarChart3}
                  gradient={CARD_GRADIENTS.emerald}
                  onClick={() => router.push("/admin/categories")}
                />
              </div>

              {data.low_stock_products?.length > 0 && (
                <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-8">
                  <h3 className="text-3xl font-black text-gray-900 mb-6">Low Stock Items</h3>
                  <div className="space-y-3">
                    {data.low_stock_products.map((product: any) => (
                      <div
                        key={product.id}
                        onClick={() => router.push(`/admin/products/${product.id}/inventory`)}
                        className="flex items-center justify-between p-5 bg-amber-50 rounded-2xl hover:shadow-lg transition-all cursor-pointer border-2 border-amber-200 hover:border-amber-400"
                      >
                        <div>
                          <p className="font-bold text-lg text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600 font-semibold">SKU: {product.sku}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-black text-xl text-amber-600">{product.stock}</p>
                            <p className="text-xs text-gray-600">in stock</p>
                          </div>
                          <Progress
                            value={Math.min(((product.stock || 0) / (product.min_stock || 20)) * 100, 100)}
                            className="w-24 h-3"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* MARKETING TAB */}
            <TabsContent value="marketing" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Subscribers"
                  value={data.counts?.newsletter_subscribers || 0}
                  icon={MessageSquare}
                  gradient={CARD_GRADIENTS.indigo}
                  onClick={() => router.push("/admin/newsletters")}
                  subtitle="Email subscribers"
                />
                <MetricCard
                  title="Active Coupons"
                  value={data.counts?.active_coupons || 0}
                  icon={Tag}
                  gradient={CARD_GRADIENTS.pink}
                  onClick={() => router.push("/admin/coupons")}
                  subtitle="Active promotions"
                />
                <MetricCard
                  title="Pending Reviews"
                  value={data.counts?.pending_reviews || 0}
                  icon={Star}
                  gradient={CARD_GRADIENTS.yellow}
                  onClick={() => router.push("/admin/reviews?status=pending")}
                  subtitle="Awaiting approval"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-lg p-8 text-white border-2 border-blue-400">
                  <Gauge className="h-8 w-8 mb-4" />
                  <p className="text-blue-100 font-bold text-sm uppercase">Email Campaigns</p>
                  <p className="text-5xl font-black mt-3">0</p>
                  <p className="text-blue-100 text-sm mt-2">Active campaigns</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-lg p-8 text-white border-2 border-green-400">
                  <Eye className="h-8 w-8 mb-4" />
                  <p className="text-green-100 font-bold text-sm uppercase">Open Rate</p>
                  <p className="text-5xl font-black mt-3">0%</p>
                  <p className="text-green-100 text-sm mt-2">Average open rate</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl shadow-lg p-8 text-white border-2 border-orange-400">
                  <Gauge className="h-8 w-8 mb-4" />
                  <p className="text-orange-100 font-bold text-sm uppercase">Conversion</p>
                  <p className="text-5xl font-black mt-3">0%</p>
                  <p className="text-orange-100 text-sm mt-2">Conversion rate</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
