import type { EnhancedInventoryItem } from "@/services/inventory-service"
import { calculateInventoryStats, type InventoryStats } from "./calculate-inventory-stats"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

export interface InventoryResponse {
  items: EnhancedInventoryItem[]
  stats: InventoryStats
  error?: string
}

/**
 * Server-side function to fetch all inventory with statistics
 * This runs on the server before the page is sent to the browser
 * Uses caching with ISR (Incremental Static Regeneration)
 * Returns both inventory items and pre-calculated statistics
 */
export async function getAllInventory(limit = 10000, page = 1): Promise<InventoryResponse> {
  try {
    // Try the external API endpoint (backend API)
    const externalEndpoint = `${API_BASE_URL}/api/inventory?per_page=${limit}&page=${page}`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const response = await fetch(externalEndpoint, {
        signal: controller.signal,
        next: {
          revalidate: 60, // Cache for 60 seconds on the server (ISR)
          tags: ["all-inventory"], // Tag for on-demand revalidation
        },
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300", // Enhanced caching
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const items = (data?.data ?? data?.items ?? data) as EnhancedInventoryItem[]
        
        if (Array.isArray(items) && items.length > 0) {
          // Calculate stats server-side for instant display
          const stats = calculateInventoryStats(items)
          
          return {
            items,
            stats,
          }
        }
      }
    } catch (err) {
      console.error("[v0] getAllInventory: External API failed:", err)
    }

    // Fallback to empty response with zero stats
    return {
      items: [],
      stats: {
        total_items: 0,
        in_stock: 0,
        low_stock: 0,
        out_of_stock: 0,
        total_value: 0,
        reserved_quantity: 0,
        needs_reorder: 0,
      },
      error: "Failed to fetch inventory data",
    }
  } catch (error) {
    console.error("[v0] getAllInventory: Critical error:", error)
    return {
      items: [],
      stats: {
        total_items: 0,
        in_stock: 0,
        low_stock: 0,
        out_of_stock: 0,
        total_value: 0,
        reserved_quantity: 0,
        needs_reorder: 0,
      },
      error: "Critical error fetching inventory",
    }
  }
}
