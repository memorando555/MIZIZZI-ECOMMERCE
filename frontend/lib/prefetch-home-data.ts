// Prefetch critical home page data for instant loading
import { prefetchFlashSales } from "@/hooks/use-swr-flash-sales"
import { prefetchLuxuryDeals } from "@/hooks/use-swr-luxury-deals"
import { prefetchTopPicks } from "@/hooks/use-swr-top-picks"
import { prefetchTrending } from "@/hooks/use-swr-trending"
import { prefetchNewArrivals } from "@/hooks/use-swr-new-arrivals"
import { prefetchProductsGrid } from "@/hooks/use-swr-products-grid"

let prefetchPromise: Promise<void> | null = null

// Call this once on app initialization to prefetch critical data
export async function prefetchHomeData(): Promise<void> {
  // Prevent multiple concurrent prefetch calls
  if (prefetchPromise) {
    return prefetchPromise
  }

  prefetchPromise = (async () => {
    try {
      await Promise.all([
        prefetchFlashSales(),
        prefetchLuxuryDeals(),
        prefetchTopPicks(),
        prefetchTrending(),
        prefetchNewArrivals(),
        prefetchProductsGrid(),
      ])
      console.log("[v0] Home data prefetched successfully")
    } catch (error) {
      console.warn("[v0] Failed to prefetch home data:", error)
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
