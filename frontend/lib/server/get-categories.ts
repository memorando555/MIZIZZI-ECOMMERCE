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

// Normalize image URLs to ensure they're valid
function normalizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url || url === "null" || url === "undefined" || url.trim() === "") {
    return undefined
  }
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url
  }
  if (url.startsWith("/")) {
    return `${BASE_URL}${url}`
  }
  return url
}

// Server-side category fetcher with React cache for deduplication
export const getCategories = cache(async (limit = 20): Promise<Category[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/categories?parent_id=null&per_page=${limit}`, {
      next: { revalidate: 300, tags: ["categories"] },
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    let categories = data?.items ?? data ?? []

    if (!Array.isArray(categories)) {
      return []
    }

    // Normalize image URLs and filter active categories
    categories = categories
      .filter((cat: any) => cat.is_active !== false)
      .map((cat: any) => ({
        ...cat,
        image_url: normalizeImageUrl(cat.image_url),
        banner_url: normalizeImageUrl(cat.banner_url),
      }))

    return categories
  } catch (error) {
    return []
  }
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
