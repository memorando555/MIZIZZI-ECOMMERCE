import type { Product } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

/**
 * Server-side function to fetch a single product by ID for editing
 * This runs on the server with authentication token from cookies
 */
export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const localEndpoint = `/api/admin/products/${productId}`
    const endpoint = `${API_BASE_URL}/api/admin/products/${productId}`

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        next: {
          revalidate: 30, // Cache for 30 seconds
          tags: [`product-${productId}`],
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data?.data || data || null
      }
    } catch (err) {
      console.error(`[v0] getProductById: Failed to fetch product ${productId}:`, err)
    }

    return null
  } catch (error) {
    console.error("[v0] getProductById: Critical error:", error)
    return null
  }
}

/**
 * Server-side function to fetch all categories for product editing
 */
export async function getAdminCategories(): Promise<any[]> {
  try {
    const endpoint = `${API_BASE_URL}/api/admin/categories?per_page=10000`

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for authentication
      next: {
        revalidate: 60, // Cache for 60 seconds
        tags: ["admin-categories"],
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data?.data || data?.items || data || []
    }

    return []
  } catch (error) {
    console.error("[v0] getAdminCategories: Error fetching categories:", error)
    return []
  }
}

/**
 * Server-side function to fetch all brands for product editing
 */
export async function getAdminBrands(): Promise<any[]> {
  try {
    const endpoint = `${API_BASE_URL}/api/admin/brands?per_page=10000`

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for authentication
      next: {
        revalidate: 60, // Cache for 60 seconds
        tags: ["admin-brands"],
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data?.data || data?.items || data || []
    }

    return []
  } catch (error) {
    console.error("[v0] getAdminBrands: Error fetching brands:", error)
    return []
  }
}

/**
 * Server-side function to fetch product images
 */
export async function getProductImagesById(productId: string): Promise<any[]> {
  try {
    const endpoint = `${API_BASE_URL}/api/admin/products/${productId}/images`

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for authentication
      next: {
        revalidate: 30, // Cache for 30 seconds
        tags: [`product-images-${productId}`],
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data?.data || data?.images || data || []
    }

    return []
  } catch (error) {
    console.error(`[v0] getProductImagesById: Error fetching images for product ${productId}:`, error)
    return []
  }
}

/**
 * Server-side function to fetch all product data needed for editing
 * Fetches product, categories, brands, and images in parallel
 */
export async function getProductEditData(productId: string) {
  try {
    // Fetch all data in parallel for best performance
    const [product, categories, brands, images] = await Promise.all([
      getProductById(productId),
      getAdminCategories(),
      getAdminBrands(),
      getProductImagesById(productId),
    ])

    return {
      product,
      categories,
      brands,
      images,
      error: null,
    }
  } catch (error: any) {
    console.error("[v0] getProductEditData: Error:", error)
    return {
      product: null,
      categories: [],
      brands: [],
      images: [],
      error: error?.message || "Failed to load product data",
    }
  }
}
