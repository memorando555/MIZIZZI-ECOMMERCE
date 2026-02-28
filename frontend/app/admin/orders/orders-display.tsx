"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { Order, OrdersResponse } from "@/lib/server/get-admin-orders"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface OrdersDisplayProps {
  initialData: OrdersResponse
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "processing":
      return <Package className="h-4 w-4 text-blue-600" />
    case "shipped":
      return <TrendingUp className="h-4 w-4 text-purple-600" />
    case "delivered":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case "cancelled":
      return <XCircle className="h-4 w-4 text-red-600" />
    case "returned":
      return <RotateCcw className="h-4 w-4 text-orange-600" />
    default:
      return <ShoppingBag className="h-4 w-4 text-gray-600" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
    case "processing":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>
    case "shipped":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Shipped</Badge>
    case "delivered":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>
    case "cancelled":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>
    case "returned":
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Returned</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getPaymentBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return <Badge className="bg-green-600">Paid</Badge>
    case "pending":
      return <Badge className="bg-yellow-600">Pending</Badge>
    case "failed":
      return <Badge className="bg-red-600">Failed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function OrdersDisplay({ initialData }: OrdersDisplayProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Calculate stats from initial data
  const stats = useMemo(() => {
    const items = initialData.items || []
    return {
      total: items.length,
      pending: items.filter((o) => o.status?.toLowerCase() === "pending").length,
      processing: items.filter((o) => o.status?.toLowerCase() === "processing").length,
      shipped: items.filter((o) => o.status?.toLowerCase() === "shipped").length,
      delivered: items.filter((o) => o.status?.toLowerCase() === "delivered").length,
      cancelled: items.filter((o) => o.status?.toLowerCase() === "cancelled").length,
      returned: items.filter((o) => o.status?.toLowerCase() === "returned").length,
      revenue: items.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    }
  }, [initialData.items])

  // Filter orders based on active tab and search
  const filteredOrders = useMemo(() => {
    let filtered = initialData.items || []

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter((order) => order.status?.toLowerCase() === activeTab.toLowerCase())
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.order_number?.toLowerCase().includes(query) ||
          order.customer_name?.toLowerCase().includes(query) ||
          order.customer_email?.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [activeTab, searchQuery, initialData.items])

  const handleViewOrder = (orderId: number | string) => {
    router.push(`/admin/orders/${orderId}`)
  }

  const handleDeleteOrder = async (orderId: number | string) => {
    try {
      await adminService.deleteOrder(orderId)
      toast({
        title: "Success",
        description: "Order deleted successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Orders</CardTitle>
            </div>
            <Input
              placeholder="Search by order number, customer..."
              className="md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="processing">
                Processing ({stats.processing})
              </TabsTrigger>
              <TabsTrigger value="shipped">
                Shipped ({stats.shipped})
              </TabsTrigger>
              <TabsTrigger value="delivered">
                Delivered ({stats.delivered})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({stats.cancelled})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Orders Table */}
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.customer_name}</span>
                          <span className="text-xs text-gray-500">{order.customer_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          {getStatusBadge(order.status)}
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchQuery ? "No orders match your search" : "No orders found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
