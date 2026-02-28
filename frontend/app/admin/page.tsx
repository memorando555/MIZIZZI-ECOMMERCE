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
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  MessageSquare,
  ArrowRight,
  Clock,
  AlertCircle,
  Mail,
  Star,
  Eye,
  Gift,
  CreditCard,
  Percent,
  HardDrive,
  Zap,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingDown,
  Truck,
  MapPin,
  Calendar,
  User,
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
  customerMetrics?: any
  reviewStats?: any
  inventoryStats?: any
  marketingStats?: any
  couponStats?: any
  shippingStats?: any
}

// Stat Card Component - Reusable colored card
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  bgColor, 
  textColor, 
  trend, 
  subtitle,
  onClick 
}: any) {
  return (
    <div 
      onClick={onClick}
      className={`${bgColor} rounded-2xl p-6 md:p-8 cursor-pointer transition-all hover:shadow-lg hover:scale-105 duration-300 transform`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className={`text-sm md:text-base font-semibold ${textColor} opacity-80 uppercase tracking-wide`}>
            {title}
          </p>
          <h3 className={`text-3xl md:text-4xl font-bold ${textColor} mt-3`}>
            {value}
          </h3>
          {subtitle && (
            <p className={`text-xs md:text-sm ${textColor} opacity-70 mt-2`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 md:p-4 ${textColor === "text-white" ? "bg-white bg-opacity-20" : "bg-opacity-20"}`}>
          <Icon className="w-6 h-6 md:w-8 md:h-8" />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs md:text-sm font-semibold ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
          {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{Math.abs(trend)}% from last period</span>
        </div>
      )}
    </div>
  )
}

// Data Row Component
function DataRow({ label, value, icon: Icon, color = "text-gray-900" }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${color === "text-blue-600" ? "bg-blue-100" : color === "text-green-600" ? "bg-green-100" : color === "text-orange-600" ? "bg-orange-100" : "bg-purple-100"}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAdminAuth()
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null)
  const [additionalStats, setAdditionalStats] = useState<AdditionalStats>({})
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Main dashboard data fetch
  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      
      const data = await adminService.getDashboardData()
      setDashboardData(data)

      // Fetch additional stats in parallel
      const [
        customerMetrics,
        inventoryStats,
        marketingStats,
        reviewStats,
        couponStats,
        shippingStats,
      ] = await Promise.allSettled([
        adminService.getCustomerMetrics().catch(() => ({})),
        adminService.getInventoryStats().catch(() => ({})),
        adminService.getMarketingStats().catch(() => ({})),
        adminService.getReviewStats().catch(() => ({})),
        adminService.getCouponStats().catch(() => ({})),
        adminService.getShippingStats().catch(() => ({})),
      ])

      setAdditionalStats({
        customerMetrics: customerMetrics.status === "fulfilled" ? customerMetrics.value : {},
        inventoryStats: inventoryStats.status === "fulfilled" ? inventoryStats.value : {},
        marketingStats: marketingStats.status === "fulfilled" ? marketingStats.value : {},
        reviewStats: reviewStats.status === "fulfilled" ? reviewStats.value : {},
        couponStats: couponStats.status === "fulfilled" ? couponStats.value : {},
        shippingStats: shippingStats.status === "fulfilled" ? shippingStats.value : {},
      })
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
      fetchDashboardData()
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <Loader />
          <p className="mt-3 text-sm text-gray-600 font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const data = dashboardData || adminService.getDefaultDashboardData()
  const salesGrowth = data.sales?.yesterday > 0 
    ? Math.round(((data.sales?.today - data.sales?.yesterday) / data.sales?.yesterday) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white w-full">
      <div className="w-full p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-600 mt-2 text-base font-medium">Welcome back, {user?.name || "Admin"}. Here's your complete store overview.</p>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : "bg-green-500"}`}></div>
                <span className="font-medium">System {error ? "error" : "healthy"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="rounded-lg border-gray-300 hover:bg-gray-100"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="ml-2">Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/admin/reports")}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Download className="h-4 w-4" />
              <span className="ml-2">Export</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50 rounded-xl">
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
              <p className="mt-3 text-sm text-gray-600 font-medium">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-100 rounded-xl p-1 mb-8">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
                Overview
              </TabsTrigger>
              <TabsTrigger value="sales" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
                Sales
              </TabsTrigger>
              <TabsTrigger value="customers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
                Customers
              </TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
                Inventory
              </TabsTrigger>
              <TabsTrigger value="marketing" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow">
                Marketing
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-8">
              {/* Primary KPIs - 4 Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                  title="Total Revenue"
                  value={`$${(data.sales?.total_revenue || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                  icon={DollarSign}
                  bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                  textColor="text-white"
                  trend={salesGrowth}
                />
                <StatCard
                  title="Today's Sales"
                  value={`$${((data.sales?.today || 0) / 1000).toFixed(1)}K`}
                  icon={TrendingUp}
                  bgColor="bg-gradient-to-br from-green-500 to-green-600"
                  textColor="text-white"
                  subtitle={`+${salesGrowth}% vs yesterday`}
                />
                <StatCard
                  title="Total Orders"
                  value={data.counts?.orders || 0}
                  icon={ShoppingCart}
                  bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
                  textColor="text-white"
                  subtitle={`${data.counts?.orders_in_transit || 0} in transit`}
                />
                <StatCard
                  title="Total Customers"
                  value={data.counts?.users || 0}
                  icon={Users}
                  bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
                  textColor="text-white"
                  subtitle={`+${data.counts?.new_signups_today || 0} today`}
                />
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                  title="Products"
                  value={data.counts?.products || 0}
                  icon={Package}
                  bgColor="bg-gradient-to-br from-cyan-100 to-cyan-50"
                  textColor="text-cyan-900"
                  subtitle={`${data.counts?.low_stock_count || 0} low stock`}
                />
                <StatCard
                  title="Categories"
                  value={data.counts?.categories || 0}
                  icon={BarChart3}
                  bgColor="bg-gradient-to-br from-emerald-100 to-emerald-50"
                  textColor="text-emerald-900"
                  subtitle={`${data.counts?.brands || 0} brands`}
                />
                <StatCard
                  title="Pending Orders"
                  value={data.counts?.pending_payments || 0}
                  icon={AlertTriangle}
                  bgColor="bg-gradient-to-br from-red-100 to-red-50"
                  textColor="text-red-900"
                  subtitle="Needs attention"
                />
                <StatCard
                  title="Reviews"
                  value={data.counts?.reviews || 0}
                  icon={Star}
                  bgColor="bg-gradient-to-br from-yellow-100 to-yellow-50"
                  textColor="text-yellow-900"
                  subtitle={`${data.counts?.pending_reviews || 0} pending`}
                />
              </div>

              {/* Recent Orders Section */}
              {data.recent_orders && data.recent_orders.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">Recent Orders</h3>
                    <Button variant="ghost" onClick={() => router.push("/admin/orders")} className="text-blue-600 hover:bg-blue-50">
                      View All <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {data.recent_orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{order.order_number || order.id}</p>
                          <p className="text-sm text-gray-600 mt-1">{order.user_email || "Customer"}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-900">${(order.total_amount || 0).toFixed(2)}</span>
                          <Badge className="bg-blue-100 text-blue-900">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Stock Alert */}
              {data.low_stock_products && data.low_stock_products.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-sm border border-orange-200 p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-orange-900">Low Stock Alert</h3>
                        <p className="text-orange-700 text-sm mt-1">{data.counts?.low_stock_count || 0} products need restocking</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {data.low_stock_products.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-white bg-opacity-60 rounded-xl">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600 text-lg">{product.stock}</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <StatCard
                  title="Weekly Sales"
                  value={`$${((data.sales?.weekly || 0) / 1000).toFixed(1)}K`}
                  icon={TrendingUp}
                  bgColor="bg-gradient-to-br from-indigo-500 to-indigo-600"
                  textColor="text-white"
                />
                <StatCard
                  title="Monthly Sales"
                  value={`$${((data.sales?.monthly || 0) / 1000).toFixed(0)}K`}
                  icon={BarChart3}
                  bgColor="bg-gradient-to-br from-pink-500 to-pink-600"
                  textColor="text-white"
                />
                <StatCard
                  title="Yearly Sales"
                  value={`$${((data.sales?.yearly || 0) / 1000000).toFixed(1)}M`}
                  icon={Zap}
                  bgColor="bg-gradient-to-br from-amber-500 to-amber-600"
                  textColor="text-white"
                />
              </div>

              {/* Sales by Category */}
              {data.sales_by_category && data.sales_by_category.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Sales by Category</h3>
                  <div className="space-y-4">
                    {data.sales_by_category.map((cat: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <span className="font-medium text-gray-700">{cat.category}</span>
                        <div className="flex items-center gap-4 flex-1 ml-4">
                          <Progress value={(cat.revenue / (data.sales?.total_revenue || 1)) * 100} className="flex-1" />
                          <span className="font-bold text-gray-900 min-w-20 text-right">${(cat.revenue || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Selling Products */}
              {data.best_selling_products && data.best_selling_products.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Top Selling Products</h3>
                  <div className="space-y-3">
                    {data.best_selling_products.slice(0, 8).map((product: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-blue-600">#{idx + 1}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.sales_count || 0} sold</p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900">${(product.revenue || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* CUSTOMERS TAB */}
            <TabsContent value="customers" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <StatCard
                  title="Total Customers"
                  value={additionalStats.customerMetrics?.total_customers || 0}
                  icon={Users}
                  bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                  textColor="text-white"
                  subtitle="Active accounts"
                />
                <StatCard
                  title="New This Week"
                  value={data.counts?.new_signups_week || 0}
                  icon={UserCheck}
                  bgColor="bg-gradient-to-br from-green-500 to-green-600"
                  textColor="text-white"
                  subtitle="Fresh signups"
                />
                <StatCard
                  title="Repeat Rate"
                  value={`${Math.round((additionalStats.customerMetrics?.repeat_customers || 0) * 100)}%`}
                  icon={TrendingUp}
                  bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
                  textColor="text-white"
                  subtitle="Returning customers"
                />
              </div>

              {/* Customer Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Customer Lifetime Value</h3>
                  <DataRow 
                    label="Average LTV" 
                    value={`$${(additionalStats.customerMetrics?.average_customer_lifetime_value || 0).toFixed(2)}`}
                    icon={DollarSign}
                    color="text-blue-600"
                  />
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Churn Rate</h3>
                  <DataRow 
                    label="Churn Rate" 
                    value={`${(additionalStats.customerMetrics?.churn_rate || 0).toFixed(2)}%`}
                    icon={TrendingDown}
                    color="text-red-600"
                  />
                </div>
              </div>

              {/* Recent Customers */}
              {data.recent_users && data.recent_users.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Recent Customers</h3>
                  <div className="space-y-3">
                    {data.recent_users.slice(0, 8).map((customer: any) => (
                      <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                            {customer.name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-600">{customer.email}</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-900">Customer</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Satisfaction Score */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-sm border border-yellow-200 p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Customer Satisfaction</p>
                    <p className="text-4xl font-bold text-yellow-900 mt-3">{(additionalStats.customerMetrics?.satisfaction_score || 0).toFixed(1)}/5</p>
                  </div>
                  <Star className="w-16 h-16 text-yellow-600" />
                </div>
              </div>
            </TabsContent>

            {/* INVENTORY TAB */}
            <TabsContent value="inventory" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                  title="Total Products"
                  value={additionalStats.inventoryStats?.total_products || data.counts?.products || 0}
                  icon={Package}
                  bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                  textColor="text-white"
                  subtitle="In inventory"
                />
                <StatCard
                  title="Low Stock"
                  value={additionalStats.inventoryStats?.low_stock || data.counts?.low_stock_count || 0}
                  icon={AlertTriangle}
                  bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
                  textColor="text-white"
                  subtitle="Needs restocking"
                />
                <StatCard
                  title="Out of Stock"
                  value={additionalStats.inventoryStats?.out_of_stock || 0}
                  icon={XCircle}
                  bgColor="bg-gradient-to-br from-red-500 to-red-600"
                  textColor="text-white"
                  subtitle="0 available"
                />
                <StatCard
                  title="Inventory Value"
                  value={`$${((additionalStats.inventoryStats?.total_value || 0) / 1000).toFixed(0)}K`}
                  icon={HardDrive}
                  bgColor="bg-gradient-to-br from-green-500 to-green-600"
                  textColor="text-white"
                  subtitle="Total value"
                />
              </div>

              {/* Inventory Metrics */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Inventory Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">In Stock Items</span>
                      <span className="font-bold text-gray-900">{(additionalStats.inventoryStats?.total_products || 0) - (additionalStats.inventoryStats?.low_stock || 0) - (additionalStats.inventoryStats?.out_of_stock || 0)}</span>
                    </div>
                    <Progress value={((((additionalStats.inventoryStats?.total_products || 0) - (additionalStats.inventoryStats?.low_stock || 0) - (additionalStats.inventoryStats?.out_of_stock || 0)) / (additionalStats.inventoryStats?.total_products || 1)) * 100)} className="h-3" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">Low Stock Items</span>
                      <span className="font-bold text-orange-600">{additionalStats.inventoryStats?.low_stock || 0}</span>
                    </div>
                    <Progress value={(((additionalStats.inventoryStats?.low_stock || 0) / (additionalStats.inventoryStats?.total_products || 1)) * 100)} className="h-3" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">Out of Stock Items</span>
                      <span className="font-bold text-red-600">{additionalStats.inventoryStats?.out_of_stock || 0}</span>
                    </div>
                    <Progress value={(((additionalStats.inventoryStats?.out_of_stock || 0) / (additionalStats.inventoryStats?.total_products || 1)) * 100)} className="h-3" />
                  </div>
                </div>
              </div>

              {/* Low Stock Products */}
              {data.low_stock_products && data.low_stock_products.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Products Needing Restocking</h3>
                  <div className="space-y-3">
                    {data.low_stock_products.slice(0, 10).map((product: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">{product.stock}</p>
                          <p className="text-xs text-gray-600">available</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* MARKETING TAB */}
            <TabsContent value="marketing" className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                  title="Newsletter Subscribers"
                  value={(additionalStats.marketingStats?.newsletter_subscribers || data.counts?.newsletter_subscribers || 0).toLocaleString()}
                  icon={Mail}
                  bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                  textColor="text-white"
                  subtitle="Active subscribers"
                />
                <StatCard
                  title="Active Coupons"
                  value={additionalStats.couponStats?.active_coupons || 0}
                  icon={Gift}
                  bgColor="bg-gradient-to-br from-green-500 to-green-600"
                  textColor="text-white"
                  subtitle="Running campaigns"
                />
                <StatCard
                  title="Total Discounts"
                  value={`$${((additionalStats.couponStats?.total_discounts || 0) / 1000).toFixed(1)}K`}
                  icon={Percent}
                  bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
                  textColor="text-white"
                  subtitle="Given out"
                />
                <StatCard
                  title="Campaign Lift"
                  value={`${(additionalStats.couponStats?.conversion_lift || 0).toFixed(1)}%`}
                  icon={TrendingUp}
                  bgColor="bg-gradient-to-br from-pink-500 to-pink-600"
                  textColor="text-white"
                  subtitle="Conversion boost"
                />
              </div>

              {/* Email Campaign Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Email Campaigns</h3>
                  <div className="space-y-4">
                    <DataRow 
                      label="Total Campaigns" 
                      value={additionalStats.marketingStats?.email_campaigns || 0}
                      icon={Mail}
                      color="text-blue-600"
                    />
                    <DataRow 
                      label="Open Rate" 
                      value={`${(additionalStats.marketingStats?.campaign_open_rate || 0).toFixed(1)}%`}
                      icon={Eye}
                      color="text-green-600"
                    />
                    <DataRow 
                      label="Click Rate" 
                      value={`${(additionalStats.marketingStats?.campaign_click_rate || 0).toFixed(1)}%`}
                      icon={MousePointer}
                      color="text-purple-600"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Social Media</h3>
                  <div className="space-y-4">
                    <DataRow 
                      label="Total Followers" 
                      value={(additionalStats.marketingStats?.social_followers || 0).toLocaleString()}
                      icon={Users}
                      color="text-blue-600"
                    />
                    <DataRow 
                      label="Subscribers" 
                      value={(additionalStats.marketingStats?.newsletter_subscribers || 0).toLocaleString()}
                      icon={Mail}
                      color="text-green-600"
                    />
                  </div>
                </div>
              </div>

              {/* Coupon Performance */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Coupon Performance</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                    <p className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Active Coupons</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{additionalStats.couponStats?.active_coupons || 0}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                    <p className="text-sm font-semibold text-green-900 uppercase tracking-wide">Total Used</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{additionalStats.couponStats?.total_used || 0}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                    <p className="text-sm font-semibold text-orange-900 uppercase tracking-wide">Total Discounts</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">${((additionalStats.couponStats?.total_discounts || 0) / 1000).toFixed(1)}K</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

// Missing icon import
import { MousePointer } from "lucide-react"
// Missing component reference
function UserCheck(props: any) {
  return <Users {...props} />
}
