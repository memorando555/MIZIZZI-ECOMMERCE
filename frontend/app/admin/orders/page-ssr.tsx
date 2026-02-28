import type React from "react"
import type { Metadata } from "next"
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  FileText,
  Truck,
  MoreHorizontal,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  DollarSign,
  ShoppingBag,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

export const metadata: Metadata = {
  title: "Order Management | Admin Dashboard",
  description: "Manage and track all customer orders",
}

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
  total_amount: number
  items: Array<{
    id: number | string
    product_name: string
    quantity: number
    price: number
  }>
}

interface ApiResponse {
  items: Order[]
  pagination: {
    total_items: number
    total_pages: number
    current_page: number
  }
  stats?: {
    total: number
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
    revenue: number
  }
}

// Mock data for demonstration - Replace with actual API call
const mockOrders: Order[] = [
  {
    id: 1,
    order_number: "363105797",
    user_id: "user1",
    customer_name: "GILBERT BAGENI",
    customer_email: "bagenilbert@gmail.com",
    created_at: "2026-02-25T10:30:00Z",
    updated_at: "2026-02-25T10:30:00Z",
    status: "pending",
    payment_status: "pending",
    payment_method: "card",
    total_amount: 5200,
    items: [
      {
        id: 1,
        product_name: "Product 1",
        quantity: 1,
        price: 5200,
      },
    ],
  },
  {
    id: 2,
    order_number: "365968128",
    user_id: "user2",
    customer_name: "GILBERT BAGENI",
    customer_email: "bagenilbert@gmail.com",
    created_at: "2026-02-25T09:15:00Z",
    updated_at: "2026-02-25T09:15:00Z",
    status: "pending",
    payment_status: "pending",
    payment_method: "card",
    total_amount: 1000,
    items: [
      {
        id: 2,
        product_name: "Product 2",
        quantity: 1,
        price: 1000,
      },
    ],
  },
  {
    id: 3,
    order_number: "338716273",
    user_id: "user3",
    customer_name: "GILBERT BAGENI",
    customer_email: "bagenilbert@gmail.com",
    created_at: "2026-02-25T08:00:00Z",
    updated_at: "2026-02-25T08:00:00Z",
    status: "pending",
    payment_status: "pending",
    payment_method: "card",
    total_amount: 1000,
    items: [
      {
        id: 3,
        product_name: "Product 3",
        quantity: 1,
        price: 1000,
      },
    ],
  },
]

const mockStats = {
  total: 36,
  pending: 11,
  processing: 0,
  shipped: 1,
  delivered: 2,
  cancelled: 2,
  revenue: 39800,
}

// Server-side function to fetch orders
async function fetchOrdersData() {
  try {
    // Replace with actual API call if needed
    // const response = await fetch(`${process.env.API_BASE_URL}/api/admin/orders`, {
    //   headers: {
    //     Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
    //   },
    //   next: { revalidate: 60 } // ISR: revalidate every 60 seconds
    // })
    // const data = await response.json()
    // return data

    // For now, using mock data
    return {
      items: mockOrders,
      pagination: {
        total_items: mockStats.total,
        total_pages: 2,
        current_page: 1,
      },
      stats: mockStats,
    }
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return {
      items: mockOrders,
      pagination: {
        total_items: mockStats.total,
        total_pages: 2,
        current_page: 1,
      },
      stats: mockStats,
    }
  }
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500 dark:bg-blue-600",
    green: "bg-green-500 dark:bg-green-600",
    yellow: "bg-yellow-500 dark:bg-yellow-600",
    purple: "bg-purple-500 dark:bg-purple-600",
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
          </div>
          <div className={`${colorClasses[color] || colorClasses.blue} p-3 rounded-lg text-white`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { icon: React.ElementType; className: string }> = {
    pending: {
      icon: Clock,
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    processing: {
      icon: Package,
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    shipped: {
      icon: Truck,
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },
    delivered: {
      icon: CheckCircle2,
      className: "bg-green-50 text-green-700 border-green-200",
    },
    cancelled: {
      icon: XCircle,
      className: "bg-red-50 text-red-700 border-red-200",
    },
    returned: {
      icon: RotateCcw,
      className: "bg-orange-50 text-orange-700 border-orange-200",
    },
  }

  const config = configs[status.toLowerCase()] || configs.pending
  const Icon = config.icon

  return (
    <Badge className={`${config.className} border font-medium px-3 py-1 flex items-center gap-1.5 w-fit`}>
      <Icon className="h-3.5 w-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export default async function OrderManagementPage() {
  const data = await fetchOrdersData()
  const orders = data.items || []
  const stats = data.stats || mockStats

  return (
    <div className="w-full">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Order Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage and track all customer orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ShoppingBag} label="Total Orders" value={stats.total} color="blue" />
          <StatCard icon={DollarSign} label="Total Revenue" value={`Ksh ${stats.revenue.toLocaleString()}`} color="green" />
          <StatCard icon={Clock} label="Pending Orders" value={stats.pending} color="yellow" />
          <StatCard icon={Package} label="Processing" value={stats.processing} color="purple" />
        </div>

        {/* Orders Section */}
        <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">Orders</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  View and manage all customer orders
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by order number, customer name, or email..."
                  className="pl-10 dark:bg-slate-700 dark:border-slate-600"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-slate-100 dark:bg-slate-700">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending (11)</TabsTrigger>
                <TabsTrigger value="processing">Processing (0)</TabsTrigger>
                <TabsTrigger value="shipped">Shipped (1)</TabsTrigger>
                <TabsTrigger value="delivered">Delivered (2)</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled (2)</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200 dark:border-slate-700">
                        <TableHead className="w-12">
                          <Checkbox />
                        </TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Order</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Customer</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Date</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Payment</TableHead>
                        <TableHead className="text-right text-slate-600 dark:text-slate-400">Total</TableHead>
                        <TableHead className="text-center text-slate-600 dark:text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <TableCell>
                            <Checkbox />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-900 dark:text-white">{order.order_number}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-900 dark:text-white">{order.customer_name}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{order.customer_email}</div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {formatDate(order.created_at)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {order.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-900 dark:text-white">
                            Ksh {order.total_amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Truck className="h-4 w-4 mr-2" />
                                  Update Status
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


