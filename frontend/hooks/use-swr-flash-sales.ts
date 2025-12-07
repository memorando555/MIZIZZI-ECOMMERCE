import useSWR, { type SWRConfiguration, mutate as globalMutate } from "swr"
import type { Product } from "@/types"
import { productService } from "@/services/product"
import { cloudinaryService } from "@/services/cloudinary-service"

// In-memory cache for instant display
let flashSalesCache: Product[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

// Process product images
const processProducts = (products: Product[]): Product[] => {
  return products.map((product) => ({
    ...product,
    image_urls: (product.image_urls || []).map((url) => {
      if (typeof url === "string" && !url.startsWith("http")) {
        return cloudinaryService.generateOptimizedUrl(url)
      }
      return url
    }),
  }))
}

// Fetcher function with instant cache return
const flashSalesFetcher = async (): Promise<Product[]> => {
  try {
    const products = await productService.getFlashSaleProducts()

    if (products && products.length > 0) {
      const processed = processProducts(products).slice(0, 12)
      flashSalesCache = processed
      lastFetchTime = Date.now()
      return processed
    }

    // Fallback to regular products if no flash sales
    const regularProducts = await productService.getProducts({
      limit: 12,
      sort_by: "price",
      sort_order: "asc",
    })
    const processed = processProducts(regularProducts)
    flashSalesCache = processed
    lastFetchTime = Date.now()
    return processed
  } catch (error) {
    console.error("Error fetching flash sales:", error)
    // Return cached data on error if available
    if (flashSalesCache) {
      return flashSalesCache
    }
    throw error
  }
}

// Default SWR configuration for flash sales
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute - deduplicate identical requests
  focusThrottleInterval: 300000, // 5 minutes - throttle focus revalidation
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  // Show cached data immediately while revalidating
  revalidateIfStale: true,
  // Keep previous data while fetching new
  keepPreviousData: true,
}

export function useFlashSales(config?: SWRConfiguration) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Product[]>("flash-sales", flashSalesFetcher, {
    ...defaultConfig,
    // Return cached data immediately if available and fresh
    fallbackData: flashSalesCache && Date.now() - lastFetchTime < CACHE_DURATION ? flashSalesCache : undefined,
    ...config,
  })

  return {
    flashSales: data || flashSalesCache || [],
    isLoading: isLoading && !flashSalesCache,
    isValidating,
    isError: error,
    mutate,
    // Helper to check if we have cached data
    hasCachedData: !!flashSalesCache,
  }
}

// Prefetch flash sales - call this on app mount for instant loading
export async function prefetchFlashSales(): Promise<void> {
  // If we have fresh cache, skip prefetch
  if (flashSalesCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return
  }

  try {
    const data = await flashSalesFetcher()
    // Populate SWR cache
    await globalMutate("flash-sales", data, false)
  } catch (error) {
    console.warn("Failed to prefetch flash sales:", error)
  }
}

// Invalidate cache - useful when admin updates flash sales
export async function invalidateFlashSales(): Promise<void> {
  flashSalesCache = null
  lastFetchTime = 0
  await globalMutate("flash-sales")
}

// Get cached flash sales without triggering fetch
export function getCachedFlashSales(): Product[] | null {
  return flashSalesCache
}
