import useSWR, { type SWRConfiguration, mutate as globalMutate } from "swr"
import type { Product } from "@/types"
import { productService } from "@/services/product"
import { cloudinaryService } from "@/services/cloudinary-service"

// In-memory cache for instant display
let topPicksCache: Product[] | null = null
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
const topPicksFetcher = async (): Promise<Product[]> => {
  try {
    const products = await productService.getTopPicks(12)

    if (products && products.length > 0) {
      const processed = processProducts(products).slice(0, 12)
      topPicksCache = processed
      lastFetchTime = Date.now()
      return processed
    }

    // Fallback to regular products if no top picks
    const regularProducts = await productService.getProducts({
      limit: 12,
      sort_by: "rating",
      sort_order: "desc",
    })
    const processed = processProducts(regularProducts)
    topPicksCache = processed
    lastFetchTime = Date.now()
    return processed
  } catch (error) {
    console.error("Error fetching top picks:", error)
    if (topPicksCache) {
      return topPicksCache
    }
    throw error
  }
}

// Default SWR configuration
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000,
  focusThrottleInterval: 300000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  revalidateIfStale: true,
  keepPreviousData: true,
}

export function useTopPicks(config?: SWRConfiguration) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Product[]>("top-picks", topPicksFetcher, {
    ...defaultConfig,
    fallbackData: topPicksCache && Date.now() - lastFetchTime < CACHE_DURATION ? topPicksCache : undefined,
    ...config,
  })

  return {
    topPicks: data || topPicksCache || [],
    isLoading: isLoading && !topPicksCache,
    isValidating,
    isError: error,
    mutate,
    hasCachedData: !!topPicksCache,
  }
}

export async function prefetchTopPicks(): Promise<void> {
  if (topPicksCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return
  }

  try {
    const data = await topPicksFetcher()
    await globalMutate("top-picks", data, false)
  } catch (error) {
    console.warn("Failed to prefetch top picks:", error)
  }
}

export async function invalidateTopPicks(): Promise<void> {
  topPicksCache = null
  lastFetchTime = 0
  await globalMutate("top-picks")
}

export function getCachedTopPicks(): Product[] | null {
  return topPicksCache
}
