import useSWR, { type SWRConfiguration, mutate as globalMutate } from "swr"
import type { Product } from "@/types"
import { productService } from "@/services/product"
import { cloudinaryService } from "@/services/cloudinary-service"

// In-memory cache for instant display
let productsGridCache: Product[] | null = null
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
const productsGridFetcher = async (): Promise<Product[]> => {
  try {
    const products = await productService.getProducts({
      limit: 24,
      sort_by: "created_at",
      sort_order: "desc",
    })

    if (products && products.length > 0) {
      const processed = processProducts(products).slice(0, 24)
      productsGridCache = processed
      lastFetchTime = Date.now()
      return processed
    }

    return []
  } catch (error) {
    console.error("Error fetching products grid:", error)
    if (productsGridCache) {
      return productsGridCache
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

export function useProductsGrid(config?: SWRConfiguration) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Product[]>("products-grid", productsGridFetcher, {
    ...defaultConfig,
    fallbackData: productsGridCache && Date.now() - lastFetchTime < CACHE_DURATION ? productsGridCache : undefined,
    ...config,
  })

  return {
    products: data || productsGridCache || [],
    isLoading: isLoading && !productsGridCache,
    isValidating,
    isError: error,
    mutate,
    hasCachedData: !!productsGridCache,
  }
}

export async function prefetchProductsGrid(): Promise<void> {
  if (productsGridCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return
  }

  try {
    const data = await productsGridFetcher()
    await globalMutate("products-grid", data, false)
  } catch (error) {
    console.warn("Failed to prefetch products grid:", error)
  }
}

export async function invalidateProductsGrid(): Promise<void> {
  productsGridCache = null
  lastFetchTime = 0
  await globalMutate("products-grid")
}

export function getCachedProductsGrid(): Product[] | null {
  return productsGridCache
}
