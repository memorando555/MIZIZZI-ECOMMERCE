"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { inventoryService, type EnhancedInventoryItem } from "@/services/inventory-service"
import { InventoryFiltersBar } from "./inventory-filters-bar"
import { InventoryItemsTable } from "./inventory-items-table"

interface InventoryTableClientProps {
  initialInventory: EnhancedInventoryItem[]
  initialPagination: {
    page: number
    per_page: number
    total_pages: number
    total_items: number
  }
  initialStats: {
    total_items: number
    in_stock: number
    low_stock: number
    out_of_stock: number
    total_value: number
    reserved_quantity: number
    needs_reorder: number
  }
  initialFilters: {
    search: string
    status: string
    stock_level: string
    category: string
    brand: string
    sort_by: string
    sort_dir: string
  }
}

export function InventoryTableClient({
  initialInventory,
  initialPagination,
  initialStats,
  initialFilters,
}: InventoryTableClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [inventory, setInventory] = useState<EnhancedInventoryItem[]>(initialInventory)
  const [pagination, setPagination] = useState(initialPagination)
  const [stats, setStats] = useState(initialStats)
  const [filters, setFilters] = useState(initialFilters)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(initialFilters.search)
  const debouncedSearch = useDebounce(searchInput, 300)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [itemLoadingStates, setItemLoadingStates] = useState<Record<string, boolean>>({})

  // Handle URL search params for persistence
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    const params = new URLSearchParams(searchParams.toString())
    if (value === "all" || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.set("page", "1")

    router.push(`?${params.toString()}`)
  }

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      const params = new URLSearchParams(searchParams.toString())
      if (debouncedSearch) {
        params.set("search", debouncedSearch)
      } else {
        params.delete("search")
      }
      params.set("page", "1")
      router.push(`?${params.toString()}`)
    }
  }, [debouncedSearch])

  // Fetch inventory when URL changes
  useEffect(() => {
    const search = (searchParams.get("search") || "") as string
    const status = (searchParams.get("status") || "all") as string
    const stock_level = (searchParams.get("stock_level") || "all") as string
    const category = (searchParams.get("category") || "all") as string
    const brand = (searchParams.get("brand") || "all") as string
    const page = Number(searchParams.get("page")) || 1

    // Check if filters changed
    const currentSearch = filters.search
    const currentStatus = filters.status
    const currentStockLevel = filters.stock_level
    const currentCategory = filters.category
    const currentBrand = filters.brand
    const currentPage = pagination.page

    const shouldFetch =
      search !== currentSearch ||
      status !== currentStatus ||
      stock_level !== currentStockLevel ||
      category !== currentCategory ||
      brand !== currentBrand ||
      page !== currentPage

    if (shouldFetch && inventory.length > 0) {
      setLoading(true)
      setError(null)

      const filterParams = {
        search,
        status: status === "all" ? "" : status,
        stock_level: stock_level === "all" ? "" : stock_level,
        category: category === "all" ? "" : category,
        brand: brand === "all" ? "" : brand,
      }

      inventoryService
        .getAllInventory(page, 20, filterParams)
        .then((response) => {
          const uniqueItems = response.items.filter(
            (item, index, self) =>
              index ===
              self.findIndex(
                (i) => i.product_id === item.product_id && (i.variant_id || null) === (item.variant_id || null)
              )
          )

          setInventory(uniqueItems)
          setPagination(response.pagination)
          if ((response as any).statistics) {
            setStats((response as any).statistics)
          }
          setFilters({
            search,
            status,
            stock_level,
            category,
            brand,
            sort_by: "product_name",
            sort_dir: "asc",
          })
        })
        .catch((err) => {
          console.error("Error fetching inventory:", err)
          setError("Failed to load inventory data")
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [searchParams])

  const handleQuickAdjustment = async (item: EnhancedInventoryItem, amount: number) => {
    const itemKey = `${item.product_id}-${item.variant_id || "default"}`

    try {
      setItemLoadingStates((prev) => ({ ...prev, [itemKey]: true }))

      setInventory((prev) =>
        prev.map((inv) =>
          inv.product_id === item.product_id && inv.variant_id === item.variant_id
            ? { ...inv, stock_level: Math.max(0, inv.stock_level + amount) }
            : inv
        )
      )

      await inventoryService.quickStockAdjustment(item.product_id, amount, item.variant_id || undefined)

      toast({
        title: "Stock Adjusted",
        description: `Stock ${amount > 0 ? "increased" : "decreased"} by ${Math.abs(amount)} units`,
      })
    } catch (err: any) {
      setInventory((prev) =>
        prev.map((inv) =>
          inv.product_id === item.product_id && inv.variant_id === item.variant_id
            ? { ...inv, stock_level: Math.max(0, inv.stock_level - amount) }
            : inv
        )
      )
      toast({
        title: "Error",
        description: "Failed to adjust stock",
        variant: "destructive",
      })
    } finally {
      setItemLoadingStates((prev) => ({ ...prev, [itemKey]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <InventoryFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <InventoryItemsTable
        inventory={inventory}
        pagination={pagination}
        loading={loading}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        onQuickAdjustment={handleQuickAdjustment}
        itemLoadingStates={itemLoadingStates}
        onPageChange={(page) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set("page", page.toString())
          router.push(`?${params.toString()}`)
        }}
      />
    </div>
  )
}
