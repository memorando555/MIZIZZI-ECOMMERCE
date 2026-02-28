"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { OrdersResponse } from "@/lib/server/get-admin-orders"
import {
  RefreshCw,
  Eye,
  MoreHorizontal,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Loader2,
  AlertCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { adminService } from "@/services/admin"
import { toast } from "@/components/ui/use-toast"
import { useAdminAuth } from "@/contexts/admin/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define Order type for better type safety
interface Order {
  id: number | string
  order_number: string
  user_id: string
  customer_name: string
  customer_email: string
  created_at: string
  updated_at: string
  status: string
  payment_status: string
  payment_method: string
  tracking_number?: string | null
  tracking_url?: string | null
  notes?: string | null
  return_reason?: string | null
  total_amount: number
  subtotal_amount?: number
  shipping_amount?: number
  tax_amount?: number
  user?: {
    name: string
    email: string
    phone?: string
  }
  items: Array<{
    id: number | string
    product_name: string
    name: string
    quantity: number
    price: number
    image_url?: string
  }>
}

export default function OrdersPageContent({ initialData }: { initialData?: OrdersResponse }) {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()

  // State management
  const [orders, setOrders] = useState<Order[]>(initialData?.items || [])
  const [isLoading, setIsLoading] = useState(!initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialData?.pagination?.total_pages || 1)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("all")

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
    revenue: 0,
  })

  // Calculate stats from initial data
  useEffect(() => {
    if (initialData?.items) {
      calculateStats(initialData.items)
    }
  }, [initialData])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, authLoading, router])

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await adminService.getOrders({
        page: currentPage,
        per_page: 20,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      })

      setOrders(response.items || [])
      setTotalPages(response.pagination?.total_pages || 1)
      calculateStats(response.items || [])
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch orders when relevant filters change
  useEffect(() => {
    if (isAuthenticated && !initialData) {
      fetchOrders()
    }
  }, [isAuthenticated, currentPage, statusFilter, searchQuery])

  // Calculate statistics from orders
  const calculateStats = (ordersList: Order[]) => {
    const newStats = {
      total: ordersList.length,
      pending: ordersList.filter((o) => o.status === "pending").length,
      processing: ordersList.filter((o) => o.status === "processing").length,
      shipped: ordersList.filter((o) => o.status === "shipped").length,
      delivered: ordersList.filter((o) => o.status === "delivered").length,
      cancelled: ordersList.filter((o) => o.status === "cancelled" || o.status === "canceled").length,
      returned: ordersList.filter((o) => o.status === "returned").length,
      revenue: ordersList.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    }
    setStats(newStats)
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchOrders()
    toast({
      title: "Refreshed",
      description: "Orders list has been updated.",
    })
  }

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    const configs: Record<string, { icon: React.ElementType; className: string }> = {
      pending: {
        icon: Clock,
        className: "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200",
      },
      processing: {
        icon: Package,
        className: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200",
      },
      shipped: {
        icon: RefreshCw,
        className: "bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-purple-200",
      },
      delivered: {
        icon: CheckCircle2,
        className: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200",
      },
      cancelled: {
        icon: XCircle,
        className: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200",
      },
      canceled: {
        icon: XCircle,
        className: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200",
      },
      returned: {
        icon: RotateCcw,
        className: "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200",
      },
    }

    const config = configs[statusLower] || {
      icon: AlertCircleIcon,
      className: "bg-gray-50 text-gray-700 border-gray-200",
    }

    const Icon = config.icon

    return (
      <Badge className={`${config.className} border font-medium px-3 py-1 flex items-center gap-1.5 w-fit`}>
        <Icon className="h-3.5 w-3.5" />
        {status}
      </Badge>
    )
  }

  // View order details
  const viewOrderDetails = (order: Order) => {
    router.push(`/admin/orders/${order.id}`)
  }

  // Filter orders by tab
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders
    return orders.filter((order) => order.status.toLowerCase() === activeTab)
  }, [orders, activeTab])

  if (!isAuthenticated && !authLoading) {
    return null
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-1 text-gray-600">Manage and track all customer orders</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="icon" className="h-10 w-10">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{formatCurrency(stats.revenue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.processing}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.delivered}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tabs for status filtering */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="processing">Processing ({stats.processing})</TabsTrigger>
              <TabsTrigger value="shipped">Shipped ({stats.shipped})</TabsTrigger>
              <TabsTrigger value="delivered">Delivered ({stats.delivered})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({stats.cancelled})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.user?.name || order.customer_name}</p>
                          <p className="text-sm text-gray-500">{order.user?.email || order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.payment_status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => viewOrderDetails(order)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
