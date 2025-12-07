import useSWR, { type SWRConfiguration, mutate as globalMutate } from "swr"
import type { Product } from "@/types"
import { productService } from "@/services/product"
import { cloudinaryService } from "@/services/cloudinary-service"

// In-memory cache for instant display
let newArrivalsCache: Product[] | null = null
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
const newArrivalsFetcher = async (): Promise<Product[]> => {
  try {
    const products = await productService.getNewArrivalProducts(12)

    if (products && products.length > 0) {
      const processed = processProducts(products).slice(0, 12)
      newArrivalsCache = processed
      lastFetchTime = Date.now()
      return processed
    }

    // Fallback to regular products if no new arrivals
    const regularProducts = await productService.getProducts({
      limit: 12,
      sort_by: "created_at",
      sort_order: "desc",
    })
    const processed = processProducts(regularProducts)
    newArrivalsCache = processed
    lastFetchTime = Date.now()
    return processed
  } catch (error) {
    console.error("Error fetching new arrivals:", error)
    if (newArrivalsCache) {
      return newArrivalsCache
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

export function useNewArrivals(config?: SWRConfiguration) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Product[]>("new-arrivals", newArrivalsFetcher, {
    ...defaultConfig,
    fallbackData: newArrivalsCache && Date.now() - lastFetchTime < CACHE_DURATION ? newArrivalsCache : undefined,
    ...config,
  })

  return {
    newArrivals: data || newArrivalsCache || [],
    isLoading: isLoading && !newArrivalsCache,
    isValidating,
    isError: error,
    mutate,
    hasCachedData: !!newArrivalsCache,
  }
}

export async function prefetchNewArrivals(): Promise<void> {
  if (newArrivalsCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return
  }

  try {
    const data = await newArrivalsFetcher()
    await globalMutate("new-arrivals", data, false)
  } catch (error) {
    console.warn("Failed to prefetch new arrivals:", error)
  }
}

export async function invalidateNewArrivals(): Promise<void> {
  newArrivalsCache = null
  lastFetchTime = 0
  await globalMutate("new-arrivals")
}

export function getCachedNewArrivals(): Product[] | null {
  return newArrivalsCache
}
