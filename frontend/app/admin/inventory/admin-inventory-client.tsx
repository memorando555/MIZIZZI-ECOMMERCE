"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { motion } from "framer-motion"

// Icons
import {
  Package,
  Search,
  Plus,
  Edit,
  AlertTriangle,
  RefreshCw,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  Minus,
  SortAsc,
  SortDesc,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Grid3X3,
  List,
  Zap,
  Target,
  BarChart3,
  Settings,
} from "lucide-react"

// Services
import { inventoryService, type EnhancedInventoryItem } from "@/services/inventory-service"

// Types
interface InventoryFilters {
  search: string
  status: string
  stock_level: string
  category: string
  brand: string
  sort_by: string
  sort_dir: string
}

interface StockAdjustment {
  product_id: number
  variant_id?: number
  adjustment: number
  reason: string
}

interface InventoryStats {
  total_items: number
  in_stock: number
  low_stock: number
  out_of_stock: number
  total_value: number
  reserved_quantity: number
  needs_reorder: number
}

interface AdminInventoryClientProps {
  initialInventory: EnhancedInventoryItem[]
}

export default function AdminInventoryClient({ initialInventory }: AdminInventoryClientProps) {
  // State
  const [inventory, setInventory] = useState<EnhancedInventoryItem[]>(initialInventory)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total_pages: 1,
    total_items: initialInventory.length,
  })
  const [filters, setFilters] = useState<InventoryFilters>({
    search: "",
    status: "all",
    stock_level: "all",
    category: "all",
    brand: "all",
    sort_by: "product_name",
    sort_dir: "asc",
  })
  const [stats, setStats] = useState<InventoryStats>({
    total_items: 0,
    in_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
    total_value: 0,
    reserved_quantity: 0,
    needs_reorder: 0,
  })
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [selectedItemForAdjustment, setSelectedItemForAdjustment] = useState<EnhancedInventoryItem | null>(null)
  const [stockInputMode, setStockInputMode] = useState<"adjustment" | "absolute">("adjustment")
  const [newStockValue, setNewStockValue] = useState<number>(0)
  const [adjustmentData, setAdjustmentData] = useState<StockAdjustment>({
    product_id: 0,
    adjustment: 0,
    reason: "",
  })
  const [itemLoadingStates, setItemLoadingStates] = useState<Record<string, boolean>>({})
  const [operationLoading, setOperationLoading] = useState<{
    type: "adjust" | "bulk" | "sync" | "refresh" | null
    message: string
  }>({ type: null, message: "" })
  const [refreshing, setRefreshing] = useState(false)

  // Initialize stats from initial inventory on mount
  useEffect(() => {
    const calculatedStats = calculateStatsFromItems(initialInventory)
    setStats(calculatedStats)
  }, [])

  // Fetch inventory data
  const fetchInventory = async (page = 1, newFilters = filters) => {
    try {
      setLoading(page === 1)
      setError(null)

      const filterParams = {
        ...newFilters,
        status: newFilters.status === "all" ? "" : newFilters.status,
        category: newFilters.category === "all" ? "" : newFilters.category,
        brand: newFilters.brand === "all" ? "" : newFilters.brand,
        stock_level: newFilters.stock_level === "all" ? "" : newFilters.stock_level,
        ...(activeTab === "low_stock" && { low_stock: "true" }),
        ...(activeTab === "out_of_stock" && { out_of_stock: "true" }),
        ...(activeTab === "in_stock" && { status: "active" }),
        ...(activeTab === "needs_reorder" && { needs_reorder: "true" }),
      }

      const response = await inventoryService.getAllInventory(page, pagination.per_page, filterParams)

      const uniqueItems = response.items.filter(
        (item, index, self) =>
          index ===
          self.findIndex((i) => i.product_id === item.product_id && (i.variant_id || null) === (i.variant_id || null)),
      )

      setInventory(uniqueItems)
      setPagination({
        page: response.pagination.page,
        per_page: response.pagination.per_page,
        total_pages: response.pagination.total_pages,
        total_items: response.pagination.total_items,
      })

      if ("statistics" in response && (response as any).statistics) {
        setStats((response as any).statistics)
      } else {
        const calculatedStats = calculateStatsFromItems(uniqueItems)
        setStats(calculatedStats)
      }
    } catch (err: any) {
      console.error("[v0] API Error:", err)
      setError("Failed to load inventory data. Please check your connection.")
      setInventory([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const calculateStatsFromItems = (items: EnhancedInventoryItem[]) => {
    const stats = items.reduce(
      (acc, item) => {
        acc.total_items += 1
        acc.reserved_quantity += item.reserved_quantity || 0

        if (item.stock_level > 0) {
          acc.in_stock += 1
        }
        if (item.is_low_stock) {
          acc.low_stock += 1
        }
        if (item.stock_level <= 0) {
          acc.out_of_stock += 1
        }
        if (item.stock_level <= (item.reorder_level || 5)) {
          acc.needs_reorder += 1
        }

        const price = item.product?.sale_price || item.product?.price || 0
        acc.total_value += item.stock_level * price

        return acc
      },
      {
        total_items: 0,
        in_stock: 0,
        low_stock: 0,
        out_of_stock: 0,
        total_value: 0,
        reserved_quantity: 0,
        needs_reorder: 0,
      },
    )

    return stats
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof InventoryFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    fetchInventory(1, newFilters)
  }

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const resetFilters = { ...filters, status: "all", stock_level: "all" }
    setFilters(resetFilters)
    fetchInventory(1, resetFilters)
  }

  const handleQuickAdjustment = async (item: EnhancedInventoryItem, amount: number) => {
    const itemKey = `${item.product_id}-${item.variant_id || "default"}`

    try {
      setItemLoadingStates((prev) => ({ ...prev, [itemKey]: true }))

      setInventory((prev) =>
        prev.map((inv) =>
          inv.product_id === item.product_id && inv.variant_id === item.variant_id
            ? { ...inv, stock_level: Math.max(0, inv.stock_level + amount) }
            : inv,
        ),
      )

      await inventoryService.quickStockAdjustment(item.product_id, amount, item.variant_id || undefined)

      const response = await inventoryService.getAllInventory(pagination.page, pagination.per_page, {
        ...filters,
        status: filters.status === "all" ? "" : filters.status,
        category: filters.category === "all" ? "" : filters.category,
      })

      const uniqueItems = response.items.filter(
        (item, index, self) =>
          index ===
          self.findIndex((i) => i.product_id === item.product_id && (i.variant_id || null) === (i.variant_id || null)),
      )

      setInventory(uniqueItems)
      if ("statistics" in response && (response as any).statistics) {
        setStats((response as any).statistics)
      } else {
        setStats(calculateStatsFromItems(uniqueItems))
      }

      toast({
        title: "Stock Adjusted",
        description: `Stock ${amount > 0 ? "increased" : "decreased"} by ${Math.abs(amount)} units`,
      })
    } catch (err: any) {
      setInventory((prev) =>
        prev.map((inv) =>
          inv.product_id === item.product_id && inv.variant_id === item.variant_id
            ? { ...inv, stock_level: Math.max(0, inv.stock_level - amount) }
            : inv,
        ),
      )
      toast({
        title: "Error",
        description: "Failed to adjust stock. Please try again.",
        variant: "destructive",
      })
    } finally {
      setItemLoadingStates((prev) => ({ ...prev, [itemKey]: false }))
    }
  }

  const handleStockAdjustment = async () => {
    try {
      if (!selectedItemForAdjustment) {
        toast({
          title: "Error",
          description: "Please select an item to adjust",
          variant: "destructive",
        })
        return
      }

      setOperationLoading({ type: "adjust", message: "Adjusting stock level..." })

      let finalAdjustment = adjustmentData.adjustment

      if (stockInputMode === "absolute") {
        finalAdjustment = newStockValue - selectedItemForAdjustment.stock_level
      }

      if (finalAdjustment === 0) {
        toast({
          title: "Error",
          description: "No adjustment needed - stock level unchanged",
          variant: "destructive",
        })
        return
      }

      setInventory((prev) =>
        prev.map((inv) =>
          inv.product_id === selectedItemForAdjustment.product_id &&
          inv.variant_id === selectedItemForAdjustment.variant_id
            ? {
                ...inv,
                stock_level: Math.max(
                  0,
                  stockInputMode === "absolute" ? newStockValue : inv.stock_level + finalAdjustment,
                ),
              }
            : inv,
        ),
      )

      await inventoryService.adjustInventory(
        selectedItemForAdjustment.product_id,
        finalAdjustment,
        adjustmentData.variant_id,
        adjustmentData.reason ||
          `Stock ${stockInputMode === "absolute" ? "set to" : "adjusted by"} ${stockInputMode === "absolute" ? newStockValue : finalAdjustment}`,
      )

      setIsAdjustDialogOpen(false)
      setAdjustmentData({ product_id: 0, adjustment: 0, reason: "", variant_id: undefined })
      setSelectedItemForAdjustment(null)
      setNewStockValue(0)

      const response = await inventoryService.getAllInventory(pagination.page, pagination.per_page, {
        ...filters,
        status: filters.status === "all" ? "" : filters.status,
        category: filters.category === "all" ? "" : filters.category,
      })

      const uniqueItems = response.items.filter(
        (item, index, self) =>
          index ===
          self.findIndex((i) => i.product_id === item.product_id && (i.variant_id || null) === (i.variant_id || null)),
      )

      setInventory(uniqueItems)
      if ("statistics" in response && (response as any).statistics) {
        setStats((response as any).statistics)
      } else {
        setStats(calculateStatsFromItems(uniqueItems))
      }

      toast({
        title: "Success",
        description: `Stock ${stockInputMode === "absolute" ? "updated to" : "adjusted by"} ${stockInputMode === "absolute" ? newStockValue : finalAdjustment} units`,
      })
    } catch (err: any) {
      if (selectedItemForAdjustment) {
        setInventory((prev) =>
          prev.map((inv) =>
            inv.product_id === selectedItemForAdjustment.product_id &&
            inv.variant_id === selectedItemForAdjustment.variant_id
              ? selectedItemForAdjustment
              : inv,
          ),
        )
      }
      toast({
        title: "Error",
        description: err.message || "Failed to adjust stock",
        variant: "destructive",
      })
    } finally {
      setOperationLoading({ type: null, message: "" })
    }
  }

  const handleRefresh = async () => {
    setOperationLoading({ type: "refresh", message: "Refreshing inventory data..." })
    try {
      await fetchInventory(pagination.page)
    } finally {
      setOperationLoading({ type: null, message: "" })
    }
  }

  const handleSyncFromProducts = async () => {
    try {
      setOperationLoading({ type: "sync", message: "Syncing products with inventory..." })
      const result = await inventoryService.syncInventoryFromProducts()

      const response = await inventoryService.getAllInventory(pagination.page, pagination.per_page, {
        ...filters,
        status: filters.status === "all" ? "" : filters.status,
        category: filters.category === "all" ? "" : filters.category,
      })

      const uniqueItems = response.items.filter(
        (item, index, self) =>
          index ===
          self.findIndex((i) => i.product_id === item.product_id && (i.variant_id || null) === (i.variant_id || null)),
      )

      setInventory(uniqueItems)
      if ("statistics" in response && (response as any).statistics) {
        setStats((response as any).statistics)
      } else {
        setStats(calculateStatsFromItems(uniqueItems))
      }

      toast({
        title: "Sync Complete",
        description: `Created ${result.created} and updated ${result.updated} inventory items`,
      })
    } catch (err: any) {
      toast({
        title: "Sync Error",
        description: err.message || "Failed to sync inventory",
        variant: "destructive",
      })
    } finally {
      setOperationLoading({ type: null, message: "" })
    }
  }

  const getStatusBadge = (item: EnhancedInventoryItem) => {
    if (item.stock_level <= 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Out of Stock
        </Badge>
      )
    }
    if (item.is_low_stock) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        In Stock
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-gray-600">Manage your product inventory with powerful tools and real-time insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total_items}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.in_stock}</div>
              <div className="text-sm text-gray-600">In Stock</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.low_stock}</div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.out_of_stock}</div>
              <div className="text-sm text-gray-600">Out of Stock</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.reserved_quantity}</div>
              <div className="text-sm text-gray-600">Reserved</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">KSh {stats.total_value}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
        <Button onClick={handleSyncFromProducts} variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Sync from Products
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search by name, SKU..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange("sort_by", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product_name">Product Name</SelectItem>
                <SelectItem value="stock_level">Stock Level</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>{inventory.length} items found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : inventory.length > 0 ? (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-left font-medium">Product</th>
                    <th className="p-3 text-left font-medium">Stock</th>
                    <th className="p-3 text-left font-medium">Reserved</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={`${item.product_id}-${item.variant_id}`} className="border-b hover:bg-gray-50">
                      <td className="p-3">{item.product?.name || "Unknown"}</td>
                      <td className="p-3 font-medium">{item.stock_level}</td>
                      <td className="p-3">{item.reserved_quantity || 0}</td>
                      <td className="p-3">{getStatusBadge(item)}</td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItemForAdjustment(item)
                            setIsAdjustDialogOpen(true)
                          }}
                        >
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No inventory items found</div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Stock Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock Level</DialogTitle>
            <DialogDescription>
              {selectedItemForAdjustment?.product?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={stockInputMode === "adjustment" ? "default" : "outline"}
                onClick={() => setStockInputMode("adjustment")}
              >
                Adjustment
              </Button>
              <Button
                variant={stockInputMode === "absolute" ? "default" : "outline"}
                onClick={() => setStockInputMode("absolute")}
              >
                Set to Value
              </Button>
            </div>
            {stockInputMode === "adjustment" ? (
              <Input
                type="number"
                placeholder="Enter adjustment (positive or negative)"
                value={adjustmentData.adjustment}
                onChange={(e) =>
                  setAdjustmentData({ ...adjustmentData, adjustment: parseInt(e.target.value) || 0 })
                }
              />
            ) : (
              <Input
                type="number"
                placeholder="Enter new stock value"
                value={newStockValue}
                onChange={(e) => setNewStockValue(parseInt(e.target.value) || 0)}
              />
            )}
            <Textarea
              placeholder="Reason for adjustment"
              value={adjustmentData.reason}
              onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
            />
            <Button onClick={handleStockAdjustment} className="w-full">
              Save Adjustment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay */}
      {operationLoading.type && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 flex flex-col items-center gap-6 max-w-sm mx-4">
            <div className="w-12 h-12 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-gray-900 font-semibold text-lg">{operationLoading.message}</p>
              <p className="text-gray-500 text-sm mt-1">Please wait...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
