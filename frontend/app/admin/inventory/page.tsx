import { getAllInventory } from "@/lib/server/get-all-inventory"
import AdminInventoryClient from "./admin-inventory-client"
import type { EnhancedInventoryItem } from "@/services/inventory-service"

export const revalidate = 60 // ISR: revalidate every 60 seconds

export default async function AdminInventoryPage() {
  let initialInventory: EnhancedInventoryItem[] = []
  let error: string | null = null

  try {
    // Fetch inventory server-side for instant rendering
    initialInventory = await getAllInventory(10000, 1)
  } catch (err: any) {
    console.error("Error fetching inventory:", err)
    error = err?.message || "Failed to load inventory"
  }

  return <AdminInventoryClient initialInventory={initialInventory} />
}
