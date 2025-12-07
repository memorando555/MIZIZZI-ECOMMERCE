import useSWR, { type SWRConfiguration, mutate as globalMutate } from "swr"
import type { Product } from "@/types"
import { productService } from "@/services/product"
import { cloudinaryService } from "@/services/cloudinary-service"

// In-memory cache for instant display
let luxuryDealsCache: Product[] | null = null
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
const luxuryDealsFetcher = async (): Promise<Product[]> => {
  try {
    const products = await productService.getLuxuryDealProducts()

    if (products && products.length > 0) {
      const processed = processProducts(products).slice(0, 12)
      luxuryDealsCache = processed
      lastFetchTime = Date.now()
      return processed
    }

    // Fallback to regular products if no luxury deals
    const regularProducts = await productService.getProducts({
      limit: 12,
      sort_by: "price",
      sort_order: "desc",
    })
    const processed = processProducts(regularProducts)
    luxuryDealsCache = processed
    lastFetchTime = Date.now()
    return processed
  } catch (error) {
    console.error("Error fetching luxury deals:", error)
    // Return cached data on error if available
    if (luxuryDealsCache) {
      return luxuryDealsCache
    }
    throw error
  }
}

// Default SWR configuration for luxury deals
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

export function useLuxuryDeals(config?: SWRConfiguration) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Product[]>("luxury-deals", luxuryDealsFetcher, {
    ...defaultConfig,
    // Return cached data immediately if available and fresh
    fallbackData: luxuryDealsCache && Date.now() - lastFetchTime < CACHE_DURATION ? luxuryDealsCache : undefined,
    ...config,
  })

  return {
    luxuryDeals: data || luxuryDealsCache || [],
    isLoading: isLoading && !luxuryDealsCache,
    isValidating,
    isError: error,
    mutate,
    // Helper to check if we have cached data
    hasCachedData: !!luxuryDealsCache,
  }
}

// Prefetch luxury deals - call this on app mount for instant loading
export async function prefetchLuxuryDeals(): Promise<void> {
  // If we have fresh cache, skip prefetch
  if (luxuryDealsCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return
  }

  try {
    const data = await luxuryDealsFetcher()
    // Populate SWR cache
    await globalMutate("luxury-deals", data, false)
  } catch (error) {
    console.warn("Failed to prefetch luxury deals:", error)
  }
}

// Invalidate cache - useful when admin updates luxury deals
export async function invalidateLuxuryDeals(): Promise<void> {
  luxuryDealsCache = null
  lastFetchTime = 0
  await globalMutate("luxury-deals")
}

// Get cached luxury deals without triggering fetch
export function getCachedLuxuryDeals(): Product[] | null {
  return luxuryDealsCache
}
