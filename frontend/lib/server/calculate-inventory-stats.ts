import type { EnhancedInventoryItem } from "@/services/inventory-service"

export interface InventoryStats {
  total_items: number
  in_stock: number
  low_stock: number
  out_of_stock: number
  total_value: number
  reserved_quantity: number
  needs_reorder: number
}

/**
 * Server-side function to calculate inventory statistics
 * Runs on the server during SSR for instant stat display
 */
export function calculateInventoryStats(items: EnhancedInventoryItem[]): InventoryStats {
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
