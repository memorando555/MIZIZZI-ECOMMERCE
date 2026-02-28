import { getAllInventory, type InventoryResponse } from "@/lib/server/get-all-inventory"
import AdminInventoryClient from "./admin-inventory-client"
import type { EnhancedInventoryItem } from "@/services/inventory-service"
import type { InventoryStats } from "@/lib/server/calculate-inventory-stats"

export const revalidate = 60 // ISR: revalidate every 60 seconds

export default async function AdminInventoryPage() {
  let initialInventory: EnhancedInventoryItem[] = []
  let initialStats: InventoryStats = {
    total_items: 0,
    in_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
    total_value: 0,
    reserved_quantity: 0,
    needs_reorder: 0,
  }

  try {
    // Fetch inventory server-side with pre-calculated stats for instant rendering
    const response: InventoryResponse = await getAllInventory(10000, 1)
    initialInventory = response.items
    initialStats = response.stats
  } catch (err: any) {
    console.error("Error fetching inventory:", err)
  }

  return <AdminInventoryClient initialInventory={initialInventory} initialStats={initialStats} />
}
