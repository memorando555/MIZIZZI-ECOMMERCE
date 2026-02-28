import useSWR, { type SWRConfiguration, mutate as globalMutate } from "swr"
import type { Product, ProductImage } from "@/types"
import { productService } from "@/services/product"
import api from "@/lib/api"
import { adminService } from "@/services/admin"
import { imageBatchService } from "@/services/image-batch-service"

// Create a cache for admin data to avoid CORS issues
const adminDataCache = new Map<string, any>()

// Create a cache for product images to avoid duplicate requests
const imageCache = new Map<string, ProductImage[]>()

// Create a request deduplication set to track in-flight requests
const inFlightRequests = new Set<string>()

const getTokenFromStorageOrCookie = (): string | null => {
  try {
    if (typeof window !== "undefined") {
      const keys = ["access_token", "token", "mizizzi_token", "mizizzi_jwt", "jwt", "auth_token"]
      for (const k of keys) {
        const t = localStorage.getItem(k)
        if (t) return t
      }
      // Fallback: read common cookie names
      const cookieKeys = ["access_token", "token", "mizizzi_token", "mizizzi_jwt", "jwt", "auth_token"]
      for (const ck of cookieKeys) {
        const re = new RegExp("(?:^|; )" + ck + "=([^;]+)")
        const m = document.cookie.match(re)
        if (m) return decodeURIComponent(m[1])
      }
    }
  } catch (e) {
    console.warn("Token read failed", e)
  }
  return null
}

const fetcher = async (url: string): Promise<any> => {
  // Check if this is an admin endpoint
  if (url.includes("/api/admin/")) {
    // Check cache first for admin endpoints
    if (adminDataCache.has(url)) {
      console.log(`Using cached admin data for ${url}`)
      return adminDataCache.get(url)
    }

    // For admin endpoints, use appropriate service
    try {
      let data: any = []

      if (url.includes("/shop-categories/categories")) {
        console.log("Fetching categories from shop-categories API")

        // Prefer adminService if it exposes a shop-categories method
        try {
          if (adminService && typeof (adminService as any).getShopCategories === "function") {
            const resp = await (adminService as any).getShopCategories()
            data = resp?.items || resp || []
          } else if (adminService && typeof (adminService as any).getCategories === "function") {
            // Some adminService implementations expose getCategories instead
            const resp = await (adminService as any).getCategories()
            data = resp?.items || resp || []
          } else {
            // Fallback to fetch with credentials and Authorization header
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
            const token = getTokenFromStorageOrCookie()
            const headers: Record<string, string> = {
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
            }
            if (token) headers["Authorization"] = `Bearer ${token}`

            const response = await fetch(`${baseUrl}${url}`, {
              method: "GET",
              credentials: "include",
              headers,
            })

            if (!response.ok) {
              console.error(`Failed to fetch categories: ${response.status}`)
              // If unauthorized, try adminService.getCategories as a last-resort fallback
              if (
                response.status === 401 &&
                adminService &&
                typeof (adminService as any).getCategories === "function"
              ) {
                try {
                  const fallbackResp = await (adminService as any).getCategories()
                  data = fallbackResp?.items || fallbackResp || []
                } catch (er) {
                  console.error("Fallback adminService.getCategories also failed", er)
                  return [] as any
                }
              } else {
                return [] as any
              }
            } else {
              const result = await response.json()
              data = result.items || result || []
            }
          }
        } catch (err) {
          console.error("Error fetching shop-categories (admin fallback):", err)
          // Final attempt: try adminService.getCategories if available
          if (adminService && typeof (adminService as any).getCategories === "function") {
            try {
              const resp = await (adminService as any).getCategories()
              data = resp?.items || resp || []
            } catch (er) {
              console.error("Final fallback adminService.getCategories failed", er)
              return [] as any
            }
          } else {
            return [] as any
          }
        }
      } else if (url.includes("/categories")) {
        console.log("Fetching categories using adminService")
        const response = await adminService.getCategories()
        data = response?.items || []
      } else if (url.includes("/brands")) {
        console.log("Fetching brands using adminService")
        const response = await adminService.getBrands()
        data = response?.items || []
      }

      // Cache the result
      adminDataCache.set(url, data)
      return data
    } catch (error) {
      console.error(`Error fetching admin data from ${url}:`, error)
      return [] as any
    }
  }

  // For non-admin endpoints, use regular API
  const response = await api.get(url)
  return response.data
}

// Product fetcher that handles the productService call
const productFetcher = async (url: string): Promise<Product> => {
  // Check if this request is already in flight
  if (inFlightRequests.has(url)) {
    console.log(`Request already in flight: ${url}, waiting for completion`)

    // Wait for the in-flight request to complete
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!inFlightRequests.has(url)) {
          clearInterval(checkInterval)
          resolve(true)
        }
      }, 100)
    })

    // Get the result from cache if available
    const cachedData = await globalMutate<Product>(url)
    if (cachedData) return cachedData
  }

  try {
    // Mark this request as in flight
    inFlightRequests.add(url)

    const id = url.split("/").pop() // Extract ID from URL
    if (!id) throw new Error("Invalid product ID")

    const product = await productService.getProduct(id)
    if (!product) throw new Error("Product not found")

    return product
  } finally {
    // Remove from in-flight requests when done
    inFlightRequests.delete(url)
  }
}

// Extract product ID from URL like /api/products/123/images
const extractProductId = (url: string): string | null => {
  // Use regex to extract the ID from URLs like /api/products/123/images
  const match = url.match(/\/products\/([^/]+)\//)
  return match ? match[1] : null
}

// Product images fetcher with batching and caching
const productImagesFetcher = async (url: string): Promise<ProductImage[]> => {
  // Check if this request is already in flight
  if (inFlightRequests.has(url)) {
    console.log(`Image request already in flight: ${url}, waiting for completion`)

    // Wait for the in-flight request to complete
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!inFlightRequests.has(url)) {
          clearInterval(checkInterval)
          resolve(true)
        }
      }, 100)
    })

    // Get the result from cache if available
    const cachedData = await globalMutate<ProductImage[]>(url)
    if (cachedData) return cachedData
  }

  try {
    // Mark this request as in flight
    inFlightRequests.add(url)

    // Check cache first
    if (imageCache.has(url)) {
      console.log(`Using cached images for ${url}`)
      return imageCache.get(url) || []
    }

    const id = extractProductId(url)
    if (!id) return []

    try {
      console.log(`Fetching images for product ${id} (not cached)`)

      // Use the batch service instead of direct API call
      const images = await imageBatchService.fetchProductImages(id)

      // Cache the result
      imageCache.set(url, images)
      return images
    } catch (error) {
      console.error(`Error fetching images for product ${id}:`, error)
      return []
    }
  } finally {
    // Remove from in-flight requests when done
    inFlightRequests.delete(url)
  }
}

// Special handler for the problematic images/images endpoint
const specialImagesFetcher = async (url: string): Promise<ProductImage[]> => {
  // Check for the problematic pattern BEFORE any API call is made
  if (url.includes("/images/images")) {
    console.warn(`Detected problematic endpoint: ${url}, returning empty array instead of making API call`)
    return []
  }

  // Extract the ID from the URL to check if it's valid
  const id = extractProductId(url)

  // If no ID found or it's not a valid product ID, return empty array
  if (!id || id === "images" || isNaN(Number(id))) {
    console.warn(`Invalid product ID in URL: ${url}, returning empty array`)
    return []
  }

  return productImagesFetcher(url)
}

// Default SWR configuration
const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 30000, // Reduced from 60s to 30s for faster updates
  revalidateInterval: 120000, // 2 minutes for edit page optimization
  errorRetryCount: 2, // Limit retries to avoid flooding
  shouldRetryOnError: (err) => {
    // Don't retry on 404 errors
    if (err.status === 404) return false
    return true
  },
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Custom retry logic with exponential backoff
    if (retryCount >= (config.errorRetryCount || 3)) return

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)
    setTimeout(() => revalidate({ retryCount }), delay)
  },
}

// Use the public categories endpoint (fetch all with a large per_page).
const CATEGORIES_CACHE_KEY = "/api/categories?per_page=1000"

// Add other keys that various parts of the app may use
const CATEGORY_CACHE_KEYS = Array.from(
  new Set([
    CATEGORIES_CACHE_KEY,
    "/api/categories",
    "/api/admin/shop-categories/categories",
    "/api/admin/categories",
    "/api/admin/categories?per_page=1000",
  ]),
)

const categoriesFetcher = async (): Promise<any[]> => {
  try {
    // Try public endpoint first (use /api/categories to avoid 404)
    const resp = await api.get("/api/categories", { params: { per_page: 1000 } })
    const items = resp?.data?.items ?? resp?.data ?? []
    if (Array.isArray(items) && items.length > 0) {
      return items
    }

    // If no categories returned, try adminService.getCategories if available (admin UI)
    if (adminService && typeof (adminService as any).getCategories === "function") {
      try {
        const adminResp = await (adminService as any).getCategories()
        return adminResp?.items || adminResp || []
      } catch (e) {
        console.warn("adminService.getCategories fallback failed", e)
      }
    }

    // Last resort: try admin API directly using token (browser-only)
    try {
      if (typeof window !== "undefined") {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        const token = getTokenFromStorageOrCookie()
        const headers: Record<string, string> = { Accept: "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`
        const r = await fetch(`${baseUrl}/api/admin/shop-categories/categories`, {
          method: "GET",
          credentials: "include",
          headers,
        })
        if (r.ok) {
          const json = await r.json()
          return json?.items || json || []
        }
      }
    } catch (e) {
      // ignore
    }

    return []
  } catch (err) {
    console.error("categoriesFetcher error:", err)
    return []
  }
}

export function useProduct(productId: string | undefined, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<Product>(
    productId ? `/api/products/${productId}` : null,
    productFetcher,
    {
      ...defaultSWRConfig,
      ...config,
    },
  )

  return {
    product: data,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useProductImages(productId: string | undefined, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<ProductImage[]>(
    productId ? `/api/products/${productId}/images` : null,
    specialImagesFetcher,
    {
      ...defaultSWRConfig,
      ...config,
      fallbackData: [], // Provide fallback data to avoid undefined errors
    },
  )

  return {
    images: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// For categories, use public endpoint first with admin fallback to avoid auth 401s by default.
export function useCategories(config?: SWRConfiguration) {
  // Use the public categories endpoint (not /api/admin/*) to avoid auth 401s by default.
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    CATEGORIES_CACHE_KEY,
    // Use the local dedicated fetcher instead of the generic fetcher
    () => categoriesFetcher(),
    {
      ...defaultSWRConfig,
      revalidateOnFocus: true, // revalidate on focus so newly added categories show up when user focuses the tab
      dedupingInterval: 300000, // 5 minutes
      errorRetryCount: 1, // Only retry once for admin endpoints
      fallbackData: [], // Provide fallback data to avoid undefined errors
      ...config,
    },
  )

  return {
    categories: data || [],
    isLoading,
    isError: error,
    mutate, // Export mutate to allow cache invalidation
  }
}

export async function invalidateCategories() {
  // Invalidate all known category-related cache keys so any page using a different key will refresh.
  try {
    // Deduplicate keys in case duplicates exist
    const dedupedKeys = Array.from(new Set(CATEGORY_CACHE_KEYS))

    for (const key of dedupedKeys) {
      // Remove any local cache entries
      adminDataCache.delete(key)
      imageCache.delete(key)
      // Trigger SWR revalidation for the key (fire-and-forget but await to ensure sequence when needed)
      try {
        await globalMutate(key)
      } catch (e) {
        // ignore individual mutate failures
      }
    }
  } catch (e) {
    console.warn("invalidateCategories error:", e)
  }
}

// For brands, use adminService directly to avoid CORS
export function useBrands(config?: SWRConfiguration) {
  const { data, error, isLoading } = useSWR<any[]>("/api/admin/brands", fetcher, {
    ...defaultSWRConfig,
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 1, // Only retry once for admin endpoints
    fallbackData: [], // Provide fallback data to avoid undefined errors
    ...config,
  })

  return {
    brands: data || [],
    isLoading,
    isError: error,
  }
}

// Add a function to clear the cache when needed
export function clearSWRCache() {
  imageCache.clear()
  adminDataCache.clear()
  inFlightRequests.clear()
  console.log("SWR cache cleared")
}

// Add a function to invalidate a specific product's images
export function invalidateProductImages(productId: string) {
  const cacheKey = `/api/products/${productId}/images`
  imageCache.delete(cacheKey)
  console.log(`Cache invalidated for ${cacheKey}`)
}

// Prefetch product data
export async function prefetchProduct(productId: string): Promise<void> {
  const url = `/api/products/${productId}`
  await globalMutate(url, productFetcher(url))
}

// Prefetch product images
export async function prefetchProductImages(productId: string): Promise<void> {
  const url = `/api/products/${productId}/images`
  const images = await imageBatchService.fetchProductImages(productId)
  await globalMutate(url, images)
}

// Prefetch multiple products and their images
export function prefetchProducts(productIds: string[]): void {
  // Prefetch products
  productIds.forEach((id) => {
    prefetchProduct(id).catch((err) => {
      console.warn(`Failed to prefetch product ${id}:`, err)
    })
  })

  // Prefetch images using batch service
  imageBatchService.prefetchProductImages(productIds)
}
// Best-effort: subscribe to socket events to auto-invalidate categories cache when backend emits changes.
// This uses runtime-only lookups to avoid bundler resolution errors for optional socket module.
;(async function initCategorySocketListeners() {
  try {
    // Only run in browser
    if (typeof window === "undefined") return
    const win = window as any

    const attachListeners = (socket: any) => {
      if (!socket || typeof socket.on !== "function") return
      const handleInvalidate = () => {
        try {
          // Use centralized helper to clear & revalidate category-related keys
          invalidateCategories().catch(() => {})
        } catch (e) {
          /* ignore */
        }
      }
      socket.on("category_created", handleInvalidate)
      socket.on("category_updated", handleInvalidate)
      socket.on("category_deleted", handleInvalidate)
      console.log("Category socket listeners attached")
    }

    // 1) Check common global socket instances (already connected)
    const possibleGlobals = [
      win.__MIZIZZI_SOCKET__,
      win.__MIZIZZI_IO__,
      win.socket,
      win._socket,
      win.$socket,
      win.ioSocket,
      win.io, // could be factory or instance
    ]
    for (const candidate of possibleGlobals) {
      if (!candidate) continue
      try {
        // If candidate is an instance with .on
        if (typeof candidate.on === "function") {
          attachListeners(candidate)
          return
        }
        // If candidate is a factory (like io), try calling it
        if (typeof candidate === "function") {
          const maybeSocket = candidate()
          if (maybeSocket && typeof maybeSocket.on === "function") {
            attachListeners(maybeSocket)
            return
          }
        }
      } catch (e) {
        // ignore candidate errors and try next
      }
    }

    // 2) If window.io exists as a factory, attempt to create a socket
    if (typeof win.io === "function") {
      try {
        const s = win.io()
        if (s && typeof s.on === "function") {
          attachListeners(s)
          return
        }
      } catch (e) {
        // ignore
      }
    }

    // 3) Try dynamic import of a configured socket module (NEXT_PUBLIC_SOCKET_MODULE or default)
    const modulePath = (process.env.NEXT_PUBLIC_SOCKET_MODULE as string) || "@/lib/socket"
    try {
      // Use eval to avoid static bundler resolution
      // @ts-ignore
      const mod = await eval("import(modulePath)").catch(() => null)
      const socketExport = (mod && (mod.default || mod.socket || mod.io || mod)) || null
      if (socketExport) {
        if (typeof socketExport === "function") {
          try {
            const s = socketExport()
            if (s && typeof s.on === "function") {
              attachListeners(s)
              return
            }
          } catch (e) {
            // ignore
          }
        } else if (typeof socketExport.on === "function") {
          attachListeners(socketExport)
          return
        }
      }
    } catch (e) {
      // import failed, continue to fallback
    }

    // 4) Final fallback: try to dynamic import socket.io-client and connect to same origin
    try {
      // @ts-ignore
      const mod = await eval('import("socket.io-client")').catch(() => null)
      const ioClient = (mod && (mod.default || mod)) || null
      if (typeof ioClient === "function") {
        try {
          const s = ioClient()
          if (s && typeof s.on === "function") {
            attachListeners(s)
            return
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }

    // If we reach here, no socket could be attached; non-fatal.
    console.warn("Category socket listeners not attached: no socket found")
  } catch (e) {
    // Any unexpected error should not break app
    console.error("initCategorySocketListeners error:", e)
  }
})()
