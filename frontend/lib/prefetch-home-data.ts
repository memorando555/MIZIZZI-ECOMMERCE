// Prefetch critical home page data using batch API for instant loading
import { prefetchFlashSales } from "@/hooks/use-swr-flash-sales"
import { prefetchProductGrid } from "@/hooks/use-swr-product-grid"

let prefetchPromise: Promise<void> | null = null

export async function prefetchHomeData(): Promise<void> {
  // Prevent multiple concurrent prefetch calls
  if (prefetchPromise) {
    return prefetchPromise
  }

  prefetchPromise = (async () => {
    try {
      // Prefetch homepage batch API which contains all product sections
      // This single prefetch covers: flash sales, trending, top picks, new arrivals, daily finds, luxury deals
      const batchPrefetch = fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/homepage/batch`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      ).catch(() => {
        console.warn('[v0] Batch API prefetch failed')
      })

      // Also prefetch product grid as fallback
      const gridPrefetch = prefetchProductGrid(12)

      // Run all prefetches in parallel
      await Promise.all([
        batchPrefetch,
        gridPrefetch,
      ])

      console.log("[v0] Homepage batch data prefetched successfully")
    } catch (error) {
      console.warn("[v0] Failed to prefetch homepage data:", error)
    }
  })()

  return prefetchPromise
}

// Check if prefetch has been initiated
export function isPrefetchInitiated(): boolean {
  return prefetchPromise !== null
}

// Reset prefetch state (useful for testing)
export function resetPrefetch(): void {
  prefetchPromise = null
}
