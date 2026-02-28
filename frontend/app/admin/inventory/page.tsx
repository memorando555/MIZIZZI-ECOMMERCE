"use client"

import { useState, useEffect, useRef } from "react"
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
import { useDebounce } from "@/hooks/use-debounce"
import { inventoryService } from "@/services/inventory-service"
import { InventoryStatsSkeleton } from "@/components/inventory/inventory-skeletons"

interface EnhancedInventoryItem {
  id: number
  product_id: number
  variant_id?: number | null
  stock_level: number
  reserved_quantity: number
  low_stock_threshold: number
  created_at: string
  updated_at: string
  is_in_stock: boolean
  is_low_stock: boolean
  available_quantity: number
  product?: {
    id: number
    name: string
    slug: string
    price: number
    sale_price?: number
    thumbnail_url?: string
    image_urls?: string[]
    category?: string
    brand?: string
    sku?: string
  }
}

interface InventoryFilters {
  search: string
  status: string
  stock_level: string
  category: string
  brand: string
  sort_by: string
  sort_dir: string
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

interface StockAdjustment {
  product_id: number
  adjustment: number
  reason: string
  variant_id?: number
}

export default function InventoryPage() {
  // State
  const [inventory, setInventory] = useState<EnhancedInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total_pages: 1,
    total_items: 0,
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
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [adjustmentData, setAdjustmentData] = useState<StockAdjustment>({
    product_id: 0,
    adjustment: 0,
    reason: "",
  })
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<EnhancedInventoryItem | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [selectedItemForAdjustment, setSelectedItemForAdjustment] = useState<EnhancedInventoryItem | null>(null)
  const [stockInputMode, setStockInputMode] = useState<"adjustment" | "absolute">("adjustment")
  const [newStockValue, setNewStockValue] = useState<number>(0)
  const [itemLoadingStates, setItemLoadingStates] = useState<Record<string, boolean>>({})
  const [operationLoading, setOperationLoading] = useState<{
    type: "adjust" | "bulk" | "sync" | "refresh" | null
    message: string
  }>({ type: null, message: "" })

  // Helper function to calculate stats from items
  const calculateStatsFromItems = (items: EnhancedInventoryItem[]): InventoryStats => {
    return {
      total_items: items.length,
      in_stock: items.filter((i) => i.stock_level > 0).length,
      low_stock: items.filter((i) => i.is_low_stock).length,
      out_of_stock: items.filter((i) => i.stock_level === 0).length,
      total_value: items.reduce((sum, i) => sum + (i.product?.price || 0) * i.stock_level, 0),
      reserved_quantity: items.reduce((sum, i) => sum + (i.reserved_quantity || 0), 0),
      needs_reorder: items.filter((i) => i.stock_level <= (i.low_stock_threshold || 5)).length,
    }
  }

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
      setStats({
        total_items: 0,
        in_stock: 0,
        low_stock: 0,
        out_of_stock: 0,
        total_value: 0,
        reserved_quantity: 0,
        needs_reorder: 0,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch stats independently for faster initial render
  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const statsData = await inventoryService.getStatistics()
      setStats(statsData)
    } catch (err) {
      console.error("[v0] Failed to fetch stats:", err)
      // Stats will show zeros but won't block the page
    } finally {
      setStatsLoading(false)
    }
  }

  // Initial load: fetch stats immediately, then fetch inventory
  useEffect(() => {
    // Start fetching stats and inventory in parallel
    Promise.all([fetchStats(), fetchInventory(1)])
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      const newFilters = { ...filters, search: debouncedSearch }
      setFilters(newFilters)
      fetchInventory(1, newFilters)
    }
  }, [debouncedSearch])

  // Stats cards component
  const StatsCard = ({ title, value, icon: Icon, bgColor, textColor }: any) => (
    <Card className={`${bgColor} border-none shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${textColor}`}>{title}</p>
            <p className={`text-3xl font-bold ${textColor} mt-2`}>{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${bgColor === "bg-blue-50" ? "bg-blue-100" : bgColor === "bg-green-50" ? "bg-green-100" : bgColor === "bg-orange-50" ? "bg-orange-100" : bgColor === "bg-red-50" ? "bg-red-100" : bgColor === "bg-purple-50" ? "bg-purple-100" : "bg-purple-100"}`}>
            <Icon className={`w-6 h-6 ${textColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <main className="flex-1 overflow-auto">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Inventory Management</h1>
          <p className="text-slate-600">Manage your product inventory with powerful tools and real-time insights</p>
        </div>

        {/* Stats Section with Skeleton Fallback */}
        {statsLoading ? (
          <InventoryStatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <StatsCard title="Total Items" value={stats.total_items} bgColor="bg-blue-50" textColor="text-blue-600" />
            <StatsCard title="In Stock" value={stats.in_stock} bgColor="bg-green-50" textColor="text-green-600" />
            <StatsCard title="Low Stock" value={stats.low_stock} bgColor="bg-orange-50" textColor="text-orange-600" />
            <StatsCard title="Out of Stock" value={stats.out_of_stock} bgColor="bg-red-50" textColor="text-red-600" />
            <StatsCard title="Reserved" value={stats.reserved_quantity} bgColor="bg-purple-50" textColor="text-purple-600" />
            <StatsCard title="Total Value" value={`KSh ${stats.total_value.toLocaleString()}`} bgColor="bg-purple-50" textColor="text-purple-600" />
          </div>
        )}

        {/* Loading State */}
        {loading && inventory.length === 0 ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Search and Filter Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filters & Controls</CardTitle>
                <CardDescription>Search, filter, and manage your inventory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <Label className="mb-2 block">Search Products</Label>
                    <div className="relative">
                      <Input
                        placeholder="Search by name, SKU..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-10 h-11 border-2 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Status</Label>
                    <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block">Stock Level</Label>
                    <Select value={filters.stock_level} onValueChange={(v) => handleFilterChange("stock_level", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="low_stock">Low Stock</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Items Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Inventory Items</CardTitle>
                    <CardDescription>{inventory.length} items found</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold">Product</th>
                        <th className="text-left p-4 font-semibold">Stock</th>
                        <th className="text-left p-4 font-semibold">Reserved</th>
                        <th className="text-left p-4 font-semibold">Status</th>
                        <th className="text-left p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-slate-50">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              {item.product?.thumbnail_url ? (
                                <img src={item.product.thumbnail_url} alt={item.product.name} className="w-10 h-10 rounded object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-slate-200" />
                              )}
                              <div>
                                <p className="font-medium">{item.product?.name}</p>
                                <p className="text-xs text-slate-500">{item.product?.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">{item.stock_level}</td>
                          <td className="p-4">{item.reserved_quantity}</td>
                          <td className="p-4">
                            <Badge variant={item.is_in_stock ? "default" : "destructive"}>
                              {item.is_in_stock ? "In Stock" : "Out"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAdjustment(item, 1)}
                              disabled={itemLoadingStates[item.id]}
                            >
                              +1
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  )

  function handleFilterChange(key: string, value: string): void {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    fetchInventory(1, newFilters)
  }

  async function handleQuickAdjustment(item: EnhancedInventoryItem, amount: number) {
    const itemKey = `${item.product_id}-${item.variant_id || "default"}`

    try {
      setItemLoadingStates((prev) => ({ ...prev, [itemKey]: true }))

      // Optimistic update
      setInventory((prev) =>
        prev.map((inv) =>
          inv.product_id === item.product_id && inv.variant_id === item.variant_id
            ? { ...inv, stock_level: Math.max(0, inv.stock_level + amount) }
            : inv,
        ),
      )

      await inventoryService.quickStockAdjustment(item.product_id, amount, item.variant_id || undefined)

      toast({
        title: "Stock Adjusted",
        description: `Stock ${amount > 0 ? "increased" : "decreased"} by ${Math.abs(amount)} units`,
      })
    } catch (err: any) {
      // Revert optimistic update on error
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
}
