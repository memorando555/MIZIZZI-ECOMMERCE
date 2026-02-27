import { cache } from "react"

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  image_url?: string
  banner_url?: string
  parent_id?: number | null
  product_count?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface CategoryWithSubcategories extends Category {
  subcategories?: Category[]
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://mizizzi-ecommerce-1.onrender.com"

// Fast image URL normalization - same pattern as flash-sales
// Returns valid URLs immediately without additional transformation
function normalizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url || url === "null" || url === "undefined" || url.trim() === "") {
    return undefined
  }
  // Already a full URL - return immediately
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url
  }
  // Relative URL - prepend base URL
  if (url.startsWith("/")) {
    return `${BASE_URL}${url}`
  }
  // Return as-is - will be optimized by Cloudinary service on client
  return url
}

// Server-side category fetcher with React cache for deduplication
// Fast caching pattern same as flash-sales (60s revalidate + real-time product counts)
export const getCategories = cache(async (limit = 20): Promise<Category[]> => {
  let lastError: Error | null = null

  // Try up to 2 times with fast backoff
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = `${BASE_URL}/api/categories?parent_id=null&per_page=${limit}&include_product_count=true`
      console.log(`[v0] getCategories: Attempt ${attempt + 1}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      // Fetch with include_product_count to get real-time item counts
      const response = await fetch(url, {
        signal: controller.signal,
        next: { revalidate: 30, tags: ["categories"] }, // Even faster cache + real-time counts
        headers: {
          "Content-Type": "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.log(`[v0] getCategories: Attempt ${attempt + 1} failed with status ${response.status}`)
        lastError = new Error(`HTTP ${response.status}`)
        
        // Wait before retry
        if (attempt < 1) {
          const waitTime = 300 * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
        continue
      }

    const data = await response.json()
    let categories = data?.items ?? data ?? []

    if (!Array.isArray(categories)) {
      console.warn("[v0] getCategories: Response is not an array")
      return []
    }

    console.log("[v0] getCategories: Raw API response (first item):", JSON.stringify(categories[0], null, 2))

    // Normalize image URLs, filter active categories, and map products_count from API
    categories = categories
      .filter((cat: any) => cat.is_active !== false)
      .map((cat: any) => {
        const mapped = {
          ...cat,
          image_url: normalizeImageUrl(cat.image_url),
          banner_url: normalizeImageUrl(cat.banner_url),
          product_count: cat.products_count ?? cat.product_count ?? 0,
        }
        console.log(`[v0] getCategories: ${cat.name} - API products_count=${cat.products_count}, mapped product_count=${mapped.product_count}`)
        return mapped
      })

      console.log("[v0] getCategories: Fetched", categories.length, "categories with real product counts")
      return categories
    } catch (error) {
      lastError = error as Error
      console.error(`[v0] getCategories: Attempt ${attempt + 1} error:`, error)
      
      // Wait before retry
      if (attempt < 2) {
        const waitTime = 500 * Math.pow(2, attempt) // 500ms, 1000ms
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  console.error("[v0] getCategories: All retry attempts failed:", lastError)
  return []
})

// Get featured/popular categories (for homepage display)
export const getFeaturedCategories = cache(async (limit = 12): Promise<Category[]> => {
  const categories = await getCategories(100)

  // Sort by product_count (most products first) and take top N
  return categories.sort((a, b) => (b.product_count || 0) - (a.product_count || 0)).slice(0, limit)
})

/**
 * Get categories with subcategories for mobile nav
 * Fetches in parallel with Next.js caching for instant delivery
 */
export const getCategoriesWithSubcategories = cache(
  async (limit = 15): Promise<CategoryWithSubcategories[]> => {
    try {
      // Fetch top-level categories
      const response = await fetch(`${BASE_URL}/api/categories?parent_id=null&per_page=${limit}`, {
        next: { revalidate: 300, tags: ["categories"] },
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) return []

      const data = await response.json()
      const categories = (data?.items ?? data ?? []).filter((cat: any) => cat.is_active !== false)

      if (!Array.isArray(categories) || categories.length === 0) {
        return []
      }

      // Fetch subcategories in parallel
      const categoriesWithSubs = await Promise.all(
        categories.slice(0, limit).map(async (category: Category) => {
          try {
            const subResponse = await fetch(`${BASE_URL}/api/categories?parent_id=${category.id}&per_page=20`, {
              next: { revalidate: 300, tags: ["categories"] },
              headers: { "Content-Type": "application/json" },
            })

            if (subResponse.ok) {
              const subData = await subResponse.json()
              const subcategories = (subData?.items ?? subData ?? []).filter(
                (cat: any) => cat.is_active !== false,
              )
              return {
                ...category,
                image_url: normalizeImageUrl(category.image_url),
                subcategories: Array.isArray(subcategories) ? subcategories : [],
              }
            }
          } catch (error) {
            // Silently handle errors
          }

          return {
            ...category,
            image_url: normalizeImageUrl(category.image_url),
            subcategories: [],
          }
        }),
      )

      return categoriesWithSubs
    } catch (error) {
      return []
    }
  },
)
