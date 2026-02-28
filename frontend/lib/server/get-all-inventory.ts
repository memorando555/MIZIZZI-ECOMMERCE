import type { EnhancedInventoryItem } from "@/services/inventory-service"

/**
 * Server-side function to fetch all inventory with pagination
 * This runs on the server before the page is sent to the browser
 * Uses caching with ISR (Incremental Static Regeneration)
 */
export async function getAllInventory(limit = 10000, page = 1): Promise<EnhancedInventoryItem[]> {
  try {
    // Try the local API endpoint first (running on the same Next.js server)
    const localEndpoint = `/api/inventory?per_page=${limit}&page=${page}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(
        `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}${localEndpoint}`,
        {
          signal: controller.signal,
          next: {
            revalidate: 60, // Cache for 60 seconds on the server
            tags: ["all-inventory"], // Tag for on-demand revalidation
          },
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const items = data?.data ?? data?.items ?? data
        
        if (Array.isArray(items)) {
          return items
        }
      }
    } catch (err) {
      console.error("[v0] getAllInventory: Local API failed:", err)
    }

    // Fallback to empty array
    return []
  } catch (error) {
    console.error("[v0] getAllInventory: Critical error:", error)
    return []
  }
}
