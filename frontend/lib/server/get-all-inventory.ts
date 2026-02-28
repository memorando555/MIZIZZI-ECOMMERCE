import type { EnhancedInventoryItem } from "@/services/inventory-service"
import { calculateInventoryStats, type InventoryStats } from "./calculate-inventory-stats"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"
const ADMIN_INVENTORY_BASE = "/api/inventory/admin"

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
    // Build the full endpoint URL with query parameters
    const params = new URLSearchParams()
    params.append("page", page.toString())
    params.append("per_page", limit.toString())
    params.append("include_product_details", "true")
    
    const externalEndpoint = `${API_BASE_URL}${ADMIN_INVENTORY_BASE}/?${params.toString()}`
    
    console.log("[v0] getAllInventory: Fetching from", externalEndpoint)
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

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
        
        console.log("[v0] getAllInventory: Response structure -", {
          hasSuccess: !!data?.success,
          hasInventory: !!data?.inventory,
          inventoryLength: Array.isArray(data?.inventory) ? data.inventory.length : 0,
        })
        
        // Parse the response according to the backend structure
        let items: EnhancedInventoryItem[] = []
        
        if (data?.success && data?.inventory && Array.isArray(data.inventory)) {
          items = data.inventory.map((item: any) => ({
            ...item,
            is_in_stock: item.available_quantity > 0,
            is_low_stock: item.available_quantity > 0 && item.available_quantity <= (item.low_stock_threshold || 5),
            available_quantity: Math.max(0, (item.stock_level || 0) - (item.reserved_quantity || 0)),
            product: item.product
              ? {
                  id: item.product.id,
                  name: item.product.name,
                  slug: item.product.slug,
                  price: item.product.price,
                  sale_price: item.product.sale_price,
                  thumbnail_url: item.product.thumbnail_url || (item.product.image_urls && item.product.image_urls[0]),
                  image_urls: item.product.image_urls || [],
                  category: item.product.category,
                  brand: item.product.brand,
                  sku: item.product.sku,
                }
              : undefined,
          }))
        }
        
        // Calculate stats server-side for instant display
        const stats = calculateInventoryStats(items)
        
        console.log("[v0] getAllInventory: Successfully fetched", items.length, "items")
        
        return {
          items,
          stats,
        }
      } else {
        console.warn("[v0] getAllInventory: API returned", response.status, response.statusText)
        const body = await response.text().catch(() => "")
        console.warn("[v0] getAllInventory: Response body:", body.substring(0, 200))
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.warn("[v0] getAllInventory: Request timeout after 5 seconds")
      } else {
        console.error("[v0] getAllInventory: API request failed:", err?.message || String(err))
      }
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
              : undefined,
          }))
        }
        
        // Calculate stats server-side for instant display
        const stats = calculateInventoryStats(items)
        
        return {
          items,
          stats,
        }
      } else {
        console.warn("[v0] getAllInventory: API returned", response.status, response.statusText)
      }
    } catch (err) {
      console.error("[v0] getAllInventory: API request failed:", err instanceof Error ? err.message : String(err))
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
