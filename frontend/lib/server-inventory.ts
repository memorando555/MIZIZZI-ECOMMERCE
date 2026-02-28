import { inventoryService } from "@/services/inventory-service"

export interface ServerInventoryData {
  stats: {
    total_items: number
    in_stock: number
    low_stock: number
    out_of_stock: number
    total_value: number
    reserved_quantity: number
    needs_reorder: number
  }
  inventory: any[]
  pagination: {
    page: number
    per_page: number
    total_pages: number
    total_items: number
  }
}

export async function getInventoryServerData(
  page = 1,
  perPage = 20,
  filters: Record<string, any> = {}
): Promise<ServerInventoryData> {
  try {
    const filterParams = {
      ...filters,
      status: filters.status === "all" ? "" : filters.status,
      category: filters.category === "all" ? "" : filters.category,
      brand: filters.brand === "all" ? "" : filters.brand,
      stock_level: filters.stock_level === "all" ? "" : filters.stock_level,
    }

    const response = await inventoryService.getAllInventory(page, perPage, filterParams)

    const uniqueItems = response.items.filter(
      (item: any, index: number, self: any[]) =>
        index ===
        self.findIndex(
          (i) => i.product_id === item.product_id && (i.variant_id || null) === (item.variant_id || null)
        )
    )

    return {
      stats: (response as any).statistics || {
        total_items: 0,
        in_stock: 0,
        low_stock: 0,
        out_of_stock: 0,
        total_value: 0,
        reserved_quantity: 0,
        needs_reorder: 0,
      },
      inventory: uniqueItems,
      pagination: response.pagination,
    }
  } catch (error) {
    console.error("Error fetching server inventory data:", error)
    return {
      stats: {
        total_items: 0,
        in_stock: 0,
        low_stock: 0,
        out_of_stock: 0,
        total_value: 0,
        reserved_quantity: 0,
        needs_reorder: 0,
      },
      inventory: [],
      pagination: {
        page: 1,
        per_page: perPage,
        total_pages: 1,
        total_items: 0,
      },
    }
  }
}

export async function getInventoryStats() {
  try {
    return await inventoryService.getStatistics()
  } catch (error) {
    console.error("Error fetching inventory stats:", error)
    return {
      total_items: 0,
      in_stock: 0,
      low_stock: 0,
      out_of_stock: 0,
      total_value: 0,
      reserved_quantity: 0,
      needs_reorder: 0,
    }
  }
}
