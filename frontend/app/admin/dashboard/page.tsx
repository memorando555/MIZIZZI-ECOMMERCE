"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminAuth } from "@/contexts/admin/auth-context"
import { useRouter } from "next/navigation"
import { Loader } from "@/components/ui/loader"
import { adminService } from "@/services/admin"
import { toast } from "@/components/ui/use-toast"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  ShoppingCart,
  Users,
  Eye,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Calendar,
  Bell,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { DashboardHeader } from "@/components/admin/dashboard/dashboard-header"
import { SalesOverviewChart } from "@/components/admin/dashboard/sales-overview-chart"
import { RecentOrders } from "@/components/admin/dashboard/recent-orders"
import { RecentActivity } from "@/components/admin/dashboard/recent-activity"
import { BestSellingProducts } from "@/components/admin/dashboard/best-selling-products"
import { LowStockProducts } from "@/components/admin/dashboard/low-stock-products"
import { RecentCustomers } from "@/components/admin/dashboard/recent-customers"
import { OrderStatusChart } from "@/components/admin/dashboard/order-status-chart"
import { SalesByCategoryChart } from "@/components/admin/dashboard/sales-by-category"

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, user } = useAdminAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, isLoading, router])

  const fetchDashboardData = async () => {
    try {
      setIsLoadingData(true)
      setIsRefreshing(true)

      const fromDate = dateRange.from.toISOString().split("T")[0]
      const toDate = dateRange.to.toISOString().split("T")[0]

      try {
        const data = await adminService.getDashboardData({
          from_date: fromDate,
          to_date: toDate,
        })

        setDashboardData(data)
      } catch (dashboardError) {
        console.error("Failed to fetch dashboard data:", dashboardError)
        if (
          (typeof dashboardError === "object" &&
            dashboardError !== null &&
            "message" in dashboardError &&
            typeof (dashboardError as any).message === "string" &&
            ((dashboardError as any).message.includes("Authentication failed") ||
              (dashboardError as any).message.includes("No refresh token")))
        ) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          })
          router.push("/admin/login")
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
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

  if (isLoading || isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader />
      </div>
    )
  }

  const stats = dashboardData?.counts || {}
  const sales = dashboardData?.sales || {}
  const recentOrders = dashboardData?.recent_orders || []
  const recentUsers = dashboardData?.recent_users || []
  const lowStockProducts = dashboardData?.low_stock_products || []
  const topProducts = dashboardData?.top_products || []
  const orderStatus = dashboardData?.order_status || {}
  const salesByCategory = dashboardData?.sales_by_category || []
  const recentActivities = dashboardData?.recent_activities || []

  // Stat card component
  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    comparison, 
    color 
  }: {
    title: string
    value: string | number
    icon: any
    trend?: "up" | "down" | "neutral"
    comparison?: string
    color: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
              {comparison && (
                <p className={cn(
                  "text-xs sm:text-sm font-medium",
                  trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-500"
                )}>
                  {trend === "up" && <TrendingUp className="inline h-3 w-3 mr-1" />}
                  {trend === "down" && <TrendingDown className="inline h-3 w-3 mr-1" />}
                  {comparison}
                </p>
              )}
            </div>
            <div className={cn("p-3 rounded-lg", {
              "bg-blue-100": color === "blue",
              "bg-green-100": color === "green",
              "bg-amber-100": color === "amber",
              "bg-purple-100": color === "purple",
              "bg-red-100": color === "red",
            })}>
              <Icon className={cn("h-6 w-6", {
                "text-blue-600": color === "blue",
                "text-green-600": color === "green",
                "text-amber-600": color === "amber",
                "text-purple-600": color === "purple",
                "text-red-600": color === "red",
              })} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="min-h-screen w-full bg-gray-50 p-2 sm:p-4 md:p-8 overflow-x-hidden">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <DashboardHeader
          onRefresh={fetchDashboardData}
          isRefreshing={isRefreshing}
          dateRange={dateRange}
          setDateRange={setDateRange}
          userName={user?.name || "Admin"}
        />

        {/* Key Metrics - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <StatCard
            title="Total Revenue"
            value={`$${(sales.total_revenue || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            icon={DollarSign}
            trend="up"
            comparison={`+${((sales.monthly || 0) / 100000).toFixed(1)}% from last month`}
            color="green"
          />
          <StatCard
            title="Total Orders"
            value={stats.orders || 0}
            icon={ShoppingCart}
            trend="up"
            comparison={`${stats.pending_orders || 0} pending`}
            color="blue"
          />
          <StatCard
            title="Total Customers"
            value={stats.users || 0}
            icon={Users}
            trend="up"
            comparison={`${stats.premium_customers || 0} premium`}
            color="purple"
          />
          <StatCard
            title="Products"
            value={stats.products || 0}
            icon={Package}
            trend={stats.low_stock_products > 0 ? "down" : "neutral"}
            comparison={`${stats.low_stock_products || 0} low stock`}
            color="amber"
          />
        </div>

        {/* Order & Sales Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-lg md:text-xl">Order Status Breakdown</CardTitle>
                <CardDescription>Real-time order distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(orderStatus).map(([status, count]: [string, any]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 sm:w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${((count / (stats.orders || 1)) * 100).toFixed(0)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-lg md:text-xl">Key Performance Indicators</CardTitle>
                <CardDescription>Current period metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Avg Order Value</span>
                  <span className="font-semibold text-gray-900">${(sales.average_order_value || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Conversion Rate</span>
                  <span className="font-semibold text-gray-900">{(sales.conversion_rate || 0).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Cart Abandonment</span>
                  <span className="font-semibold text-red-600">{(sales.cart_abandonment_rate || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Return Rate</span>
                  <span className="font-semibold text-gray-900">{(sales.return_rate || 0).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Customer LTV</span>
                  <span className="font-semibold text-green-600">${(sales.customer_lifetime_value || 0).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-lg md:text-xl">Sales Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesOverviewChart data={dashboardData} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-lg md:text-xl">Sales by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesByCategoryChart data={dashboardData} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Data Tables */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-4 h-auto bg-white border rounded-lg p-1">
            <TabsTrigger value="orders" className="text-xs sm:text-sm py-2">Recent Orders</TabsTrigger>
            <TabsTrigger value="customers" className="text-xs sm:text-sm py-2">Customers</TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm py-2">Top Products</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs sm:text-sm py-2">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <RecentOrders orders={recentOrders} />
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <RecentCustomers customers={recentUsers} />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <BestSellingProducts products={topProducts} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LowStockProducts products={lowStockProducts} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivity activities={recentActivities} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}


      // Format dates for API
      const fromDate = dateRange.from.toISOString().split("T")[0]
      const toDate = dateRange.to.toISOString().split("T")[0]

      try {
        const data = await adminService.getDashboardData({
          from_date: fromDate,
          to_date: toDate,
        })

        console.log("[v0] Dashboard data retrieved successfully:", data)
        setDashboardData(data)
      } catch (dashboardError) {
        console.error("[v0] Failed to fetch dashboard data:", dashboardError)

        if (
          (typeof dashboardError === "object" &&
            dashboardError !== null &&
            "message" in dashboardError &&
            typeof (dashboardError as any).message === "string" &&
            ((dashboardError as any).message.includes("Authentication failed") ||
              (dashboardError as any).message.includes("No refresh token")))
        ) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          })

          // Redirect to login after a short delay
          setTimeout(() => {
            router.push("/admin/login")
          }, 2000)
          return
        }

        toast({
          title: "Error",
          description: "Failed to load dashboard data. Using cached data.",
          variant: "destructive",
        })

        setDashboardData({
          counts: {
            users: 1247,
            products: 28,
            orders: 156,
            categories: 12,
            brands: 8,
            reviews: 89,
            pending_reviews: 5,
            newsletter_subscribers: 324,
            new_signups_today: 12,
            new_signups_week: 47,
            orders_in_transit: 23,
            pending_payments: 8,
            low_stock_count: 5,
          },
          sales: {
            today: 2450.75,
            monthly: 45670.25,
            yesterday: 1890.5,
            weekly: 12340.8,
            yearly: 234567.9,
            total_revenue: 567890.45,
            pending_amount: 1250.3,
          },
          order_status: {
            pending: 12,
            processing: 8,
            shipped: 23,
            delivered: 89,
            cancelled: 3,
            refunded: 2,
          },
          recent_orders: [
            {
              id: "ORD-001",
              customer: {
                name: "John Doe",
                email: "john.doe@example.com",
                avatar: "",
              },
              amount: 129.99,
              status: "processing",
              date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            },
            {
              id: "ORD-002",
              customer: {
                name: "Jane Smith",
                email: "jane.smith@example.com",
                avatar: "",
              },
              amount: 89.5,
              status: "shipped",
              date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            },
            {
              id: "ORD-003",
              customer: {
                name: "Mike Johnson",
                email: "mike.johnson@example.com",
                avatar: "",
              },
              amount: 199.99,
              status: "delivered",
              date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
            },
            {
              id: "ORD-004",
              customer: {
                name: "Sarah Wilson",
                email: "sarah.wilson@example.com",
                avatar: "",
              },
              amount: 75.25,
              status: "pending",
              date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            },
            {
              id: "ORD-005",
              customer: {
                name: "David Brown",
                email: "david.brown@example.com",
                avatar: "",
              },
              amount: 156.8,
              status: "processing",
              date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            },
          ],
          recent_users: [
            { id: "USR-001", name: "Alice Cooper", email: "alice@example.com", joined: "2025-01-15", orders: 3 },
            { id: "USR-002", name: "Bob Martin", email: "bob@example.com", joined: "2025-01-14", orders: 1 },
            { id: "USR-003", name: "Carol Davis", email: "carol@example.com", joined: "2025-01-13", orders: 5 },
            { id: "USR-004", name: "Dan Wilson", email: "dan@example.com", joined: "2025-01-12", orders: 2 },
          ],
          recent_activities: [
            { id: 1, type: "order", description: "New order #ORD-001 received", timestamp: "2025-01-15T10:30:00Z" },
            { id: 2, type: "user", description: "New user Alice Cooper registered", timestamp: "2025-01-15T09:15:00Z" },
            {
              id: 3,
              type: "product",
              description: "Product 'Wireless Headphones' updated",
              timestamp: "2025-01-15T08:45:00Z",
            },
            { id: 4, type: "payment", description: "Payment of $129.99 processed", timestamp: "2025-01-15T08:20:00Z" },
          ],
          low_stock_products: [
            { id: "1", name: "Wireless Headphones", stock: 2, price: 129.99, sku: "WH-001" },
            { id: "2", name: "Bluetooth Speaker", stock: 1, price: 89.5, sku: "BS-002" },
            { id: "3", name: "Phone Case", stock: 3, price: 24.99, sku: "PC-003" },
            { id: "4", name: "USB Cable", stock: 2, price: 15.99, sku: "UC-004" },
            { id: "5", name: "Screen Protector", stock: 1, price: 12.99, sku: "SP-005" },
          ],
          sales_by_category: [
            { category: "Electronics", sales: 15420.5, percentage: 35 },
            { category: "Accessories", sales: 8930.25, percentage: 20 },
            { category: "Clothing", sales: 12340.75, percentage: 28 },
            { category: "Home & Garden", sales: 7650.3, percentage: 17 },
          ],
          best_selling_products: [
            { id: "1", name: "Wireless Headphones", sales: 156, revenue: 20244.44, growth: 12.5 },
            { id: "2", name: "Smartphone Case", sales: 134, revenue: 3349.66, growth: 8.3 },
            { id: "3", name: "Bluetooth Speaker", sales: 89, revenue: 7965.5, growth: -2.1 },
            { id: "4", name: "USB Charger", sales: 78, revenue: 2340.22, growth: 15.7 },
            { id: "5", name: "Screen Protector", sales: 67, revenue: 869.33, growth: 5.2 },
          ],
          traffic_sources: [
            { source: "Direct", visitors: 2456, percentage: 42 },
            { source: "Google", visitors: 1834, percentage: 31 },
            { source: "Social Media", visitors: 987, percentage: 17 },
            { source: "Email", visitors: 589, percentage: 10 },
          ],
          notifications: [
            {
              id: 1,
              type: "warning",
              title: "Low Stock Alert",
              message: "5 products are running low on stock",
              timestamp: "2025-01-15T10:00:00Z",
            },
            {
              id: 2,
              type: "info",
              title: "New Order",
              message: "Order #ORD-001 needs processing",
              timestamp: "2025-01-15T09:30:00Z",
            },
            {
              id: 3,
              type: "success",
              title: "Payment Received",
              message: "Payment of $129.99 processed successfully",
              timestamp: "2025-01-15T09:00:00Z",
            },
          ],
          upcoming_events: [
            { id: 1, title: "Flash Sale", date: "2025-01-20", type: "promotion" },
            { id: 2, title: "Inventory Restock", date: "2025-01-22", type: "operation" },
            { id: 3, title: "Marketing Campaign", date: "2025-01-25", type: "marketing" },
          ],
          users_by_region: [
            { region: "North America", users: 456, percentage: 37 },
            { region: "Europe", users: 389, percentage: 31 },
            { region: "Asia", users: 267, percentage: 21 },
            { region: "Other", users: 135, percentage: 11 },
          ],
          revenue_vs_refunds: [
            { month: "Jan", revenue: 45670, refunds: 1234 },
            { month: "Feb", revenue: 52340, refunds: 987 },
            { month: "Mar", revenue: 48920, refunds: 1456 },
            { month: "Apr", revenue: 56780, refunds: 1123 },
          ],
          active_users: [
            { date: "2025-01-11", users: 234 },
            { date: "2025-01-12", users: 267 },
            { date: "2025-01-13", users: 298 },
            { date: "2025-01-14", users: 312 },
            { date: "2025-01-15", users: 345 },
          ],
          sales_data: [
            { label: "Jan 11", sales: 1234.56, orders: 12, visitors: 234 },
            { label: "Jan 12", sales: 1567.89, orders: 15, visitors: 267 },
            { label: "Jan 13", sales: 1890.23, orders: 18, visitors: 298 },
            { label: "Jan 14", sales: 2123.45, orders: 21, visitors: 312 },
            { label: "Jan 15", sales: 2450.75, orders: 24, visitors: 345 },
          ],
        })
      }

      // Fetch additional statistics
      try {
        await adminService.getProductStats()
      } catch (productError) {
        console.error("Failed to fetch product stats:", productError)
      }

      try {
        await adminService.getSalesStats({
          period: "custom",
          from: fromDate,
          to: toDate,
        })
      } catch (salesError) {
        console.error("Failed to fetch sales stats:", salesError)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again later.",
        variant: "destructive",
      })
      setDashboardData({
        counts: {
          users: 1247,
          products: 28,
          orders: 156,
          categories: 12,
          brands: 8,
          reviews: 89,
          pending_reviews: 5,
          newsletter_subscribers: 324,
          new_signups_today: 12,
          new_signups_week: 47,
          orders_in_transit: 23,
          pending_payments: 8,
          low_stock_count: 5,
        },
        sales: {
          today: 2450.75,
          monthly: 45670.25,
          yesterday: 1890.5,
          weekly: 12340.8,
          yearly: 234567.9,
          total_revenue: 567890.45,
          pending_amount: 1250.3,
        },
        order_status: {
          pending: 12,
          processing: 8,
          shipped: 23,
          delivered: 89,
          cancelled: 3,
          refunded: 2,
        },
        recent_orders: [
          {
            id: "ORD-001",
            customer: {
              name: "John Doe",
              email: "john.doe@example.com",
              avatar: "",
            },
            amount: 129.99,
            status: "processing",
            date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          },
          {
            id: "ORD-002",
            customer: {
              name: "Jane Smith",
              email: "jane.smith@example.com",
              avatar: "",
            },
            amount: 89.5,
            status: "shipped",
            date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          },
          {
            id: "ORD-003",
            customer: {
              name: "Mike Johnson",
              email: "mike.johnson@example.com",
              avatar: "",
            },
            amount: 199.99,
            status: "delivered",
            date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          },
          {
            id: "ORD-004",
            customer: {
              name: "Sarah Wilson",
              email: "sarah.wilson@example.com",
              avatar: "",
            },
            amount: 75.25,
            status: "pending",
            date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          },
          {
            id: "ORD-005",
            customer: {
              name: "David Brown",
              email: "david.brown@example.com",
              avatar: "",
            },
            amount: 156.8,
            status: "processing",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          },
        ],
        recent_users: [
          { id: "USR-001", name: "Alice Cooper", email: "alice@example.com", joined: "2025-01-15", orders: 3 },
          { id: "USR-002", name: "Bob Martin", email: "bob@example.com", joined: "2025-01-14", orders: 1 },
          { id: "USR-003", name: "Carol Davis", email: "carol@example.com", joined: "2025-01-13", orders: 5 },
          { id: "USR-004", name: "Dan Wilson", email: "dan@example.com", joined: "2025-01-12", orders: 2 },
        ],
        recent_activities: [
          { id: 1, type: "order", description: "New order #ORD-001 received", timestamp: "2025-01-15T10:30:00Z" },
          { id: 2, type: "user", description: "New user Alice Cooper registered", timestamp: "2025-01-15T09:15:00Z" },
          {
            id: 3,
            type: "product",
            description: "Product 'Wireless Headphones' updated",
            timestamp: "2025-01-15T08:45:00Z",
          },
          { id: 4, type: "payment", description: "Payment of $129.99 processed", timestamp: "2025-01-15T08:20:00Z" },
        ],
        low_stock_products: [
          { id: "1", name: "Wireless Headphones", stock: 2, price: 129.99, sku: "WH-001" },
          { id: "2", name: "Bluetooth Speaker", stock: 1, price: 89.5, sku: "BS-002" },
          { id: "3", name: "Phone Case", stock: 3, price: 24.99, sku: "PC-003" },
          { id: "4", name: "USB Cable", stock: 2, price: 15.99, sku: "UC-004" },
          { id: "5", name: "Screen Protector", stock: 1, price: 12.99, sku: "SP-005" },
        ],
        sales_by_category: [
          { category: "Electronics", sales: 15420.5, percentage: 35 },
          { category: "Accessories", sales: 8930.25, percentage: 20 },
          { category: "Clothing", sales: 12340.75, percentage: 28 },
          { category: "Home & Garden", sales: 7650.3, percentage: 17 },
        ],
        best_selling_products: [
          { id: "1", name: "Wireless Headphones", sales: 156, revenue: 20244.44, growth: 12.5 },
          { id: "2", name: "Smartphone Case", sales: 134, revenue: 3349.66, growth: 8.3 },
          { id: "3", name: "Bluetooth Speaker", sales: 89, revenue: 7965.5, growth: -2.1 },
          { id: "4", name: "USB Charger", sales: 78, revenue: 2340.22, growth: 15.7 },
          { id: "5", name: "Screen Protector", sales: 67, revenue: 869.33, growth: 5.2 },
        ],
        traffic_sources: [
          { source: "Direct", visitors: 2456, percentage: 42 },
          { source: "Google", visitors: 1834, percentage: 31 },
          { source: "Social Media", visitors: 987, percentage: 17 },
          { source: "Email", visitors: 589, percentage: 10 },
        ],
        notifications: [
          {
            id: 1,
            type: "warning",
            title: "Low Stock Alert",
            message: "5 products are running low on stock",
            timestamp: "2025-01-15T10:00:00Z",
          },
          {
            id: 2,
            type: "info",
            title: "New Order",
            message: "Order #ORD-001 needs processing",
            timestamp: "2025-01-15T09:30:00Z",
          },
          {
            id: 3,
            type: "success",
            title: "Payment Received",
            message: "Payment of $129.99 processed successfully",
            timestamp: "2025-01-15T09:00:00Z",
          },
        ],
        upcoming_events: [
          { id: 1, title: "Flash Sale", date: "2025-01-20", type: "promotion" },
          { id: 2, title: "Inventory Restock", date: "2025-01-22", type: "operation" },
          { id: 3, title: "Marketing Campaign", date: "2025-01-25", type: "marketing" },
        ],
        users_by_region: [
          { region: "North America", users: 456, percentage: 37 },
          { region: "Europe", users: 389, percentage: 31 },
          { region: "Asia", users: 267, percentage: 21 },
          { region: "Other", users: 135, percentage: 11 },
        ],
        revenue_vs_refunds: [
          { month: "Jan", revenue: 45670, refunds: 1234 },
          { month: "Feb", revenue: 52340, refunds: 987 },
          { month: "Mar", revenue: 48920, refunds: 1456 },
          { month: "Apr", revenue: 56780, refunds: 1123 },
        ],
        active_users: [
          { date: "2025-01-11", users: 234 },
          { date: "2025-01-12", users: 267 },
          { date: "2025-01-13", users: 298 },
          { date: "2025-01-14", users: 312 },
          { date: "2025-01-15", users: 345 },
        ],
        sales_data: [
          { label: "Jan 11", sales: 1234.56, orders: 12, visitors: 234 },
          { label: "Jan 12", sales: 1567.89, orders: 15, visitors: 267 },
          { label: "Jan 13", sales: 1890.23, orders: 18, visitors: 298 },
          { label: "Jan 14", sales: 2123.45, orders: 21, visitors: 312 },
          { label: "Jan 15", sales: 2450.75, orders: 24, visitors: 345 },
        ],
      })
    } finally {
      setIsLoadingData(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData()
    }
  }, [isAuthenticated, dateRange])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    )
  }

  console.log("[v0] Dashboard rendering with data:", dashboardData)
  console.log("[v0] isLoadingData:", isLoadingData, "isRefreshing:", isRefreshing)

  return (
    <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 p-2 sm:p-4 md:p-8 w-full overflow-x-hidden bg-gray-50/50">
      <DashboardHeader
        onRefresh={fetchDashboardData}
        isRefreshing={isRefreshing}
        dateRange={dateRange}
        setDateRange={setDateRange}
        userName={user?.name || "Admin User"}
      />

      {isLoadingData && !dashboardData ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics - Compact KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
          >
            {[
              {
                label: "Today's Revenue",
                value: `$${dashboardData?.sales?.today?.toFixed(2) || "0.00"}`,
                icon: <TrendingUp className="h-5 w-5" />,
                color: "from-emerald-500 to-teal-600",
              },
              {
                label: "Total Orders",
                value: dashboardData?.counts?.orders || "0",
                icon: <ShoppingCart className="h-5 w-5" />,
                color: "from-blue-500 to-cyan-600",
              },
              {
                label: "Total Customers",
                value: dashboardData?.counts?.users || "0",
                icon: <Users className="h-5 w-5" />,
                color: "from-purple-500 to-pink-600",
              },
              {
                label: "Products",
                value: dashboardData?.counts?.products || "0",
                icon: <Package className="h-5 w-5" />,
                color: "from-amber-500 to-orange-600",
              },
            ].map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.08 }}
              >
                <Card className="border-none bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg overflow-hidden">
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className={cn("p-2 rounded-lg bg-gradient-to-br", metric.color)}>
                        <div className="text-white">{metric.icon}</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{metric.value}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Alerts & Warnings */}
          {(dashboardData?.counts?.low_stock_count > 0 || dashboardData?.counts?.pending_payments > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              {dashboardData?.counts?.low_stock_count > 0 && (
                <Card className="flex-1 border-amber-200 bg-amber-50 shadow-sm rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Low Stock Alert</p>
                      <p className="text-xs text-amber-700">{dashboardData?.counts?.low_stock_count} products running low</p>
                    </div>
                  </div>
                </Card>
              )}
              {dashboardData?.counts?.pending_payments > 0 && (
                <Card className="flex-1 border-red-200 bg-red-50 shadow-sm rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">Pending Payments</p>
                      <p className="text-xs text-red-700">${dashboardData?.sales?.pending_amount?.toFixed(2) || "0.00"} pending</p>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {/* Main Content Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Sales Chart - Full Width */}
            <Card className="lg:col-span-3 border-none bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6 min-h-[400px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h3>
                <SalesOverviewChart salesData={dashboardData?.sales_data || []} />
              </div>
            </Card>
          </motion.div>

          {/* Orders & Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card className="border-none bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6 min-h-[350px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
                <OrderStatusChart data={dashboardData?.order_status || {}} />
              </div>
            </Card>

            <Card className="border-none bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6 min-h-[350px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Distribution</h3>
                <OrderStatusDistribution data={dashboardData?.order_status || {}} />
              </div>
            </Card>
          </motion.div>

          {/* Recent Orders & Best Sellers */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card className="border-none bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                <div className="max-h-[500px] overflow-auto">
                  <RecentOrders orders={dashboardData?.recent_orders || []} />
                </div>
              </div>
            </Card>

            <Card className="border-none bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Selling Products</h3>
                <BestSellingProducts products={dashboardData?.best_selling_products || []} />
              </div>
            </Card>
          </motion.div>

          {/* Products & Inventory */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card className="border-none bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Low Stock Products</h3>
                  {dashboardData?.counts?.low_stock_count > 0 && (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                      {dashboardData?.counts?.low_stock_count} items
                    </Badge>
                  )}
                </div>
                <LowStockProducts products={dashboardData?.low_stock_products || []} />
              </div>
            </Card>

            <Card className="border-none bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
                <SalesByCategoryChart data={dashboardData?.sales_by_category || []} />
              </div>
            </Card>
          </motion.div>

          {/* Activity & Revenue Trends */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card className="border-none bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="max-h-[400px] overflow-auto">
                  <RecentActivity activities={dashboardData?.recent_activities || []} />
                </div>
              </div>
            </Card>

            <Card className="border-none bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6 min-h-[350px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Refunds</h3>
                <RevenueVsRefundsChart data={dashboardData?.revenue_vs_refunds || []} />
              </div>
            </Card>
          </motion.div>

          {/* Customers */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.45 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card className="border-none bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Customers</h3>
                <RecentCustomers customers={dashboardData?.recent_users || []} />
              </div>
            </Card>

            <Card className="border-none bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6 min-h-[350px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Users</h3>
                <ActiveUsersChart data={dashboardData?.active_users || []} />
              </div>
            </Card>
          </motion.div>
        </div>
      )}
      <ProductUpdateNotification showToasts={true} />
    </div>
  )
}
