// Server-side product fetching module for hybrid rendering
// This module handles initial SSR rendering of products

import type { Product } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

/**
 * Server-side product fetcher for SSR
 * Fetches initial products on the server for faster FCP (First Contentful Paint)
 */
export async function getServerSideProducts(
  limit: number = 12,
  categorySlug?: string,
): Promise<Product[]> {
  try {
    const params = new URLSearchParams()
    params.append("limit", limit.toString())
    params.append("page", "1")

    if (categorySlug) {
      params.append("category_slug", categorySlug)
    }

    const url = `${API_BASE_URL}/api/products?${params.toString()}`
    console.log("[SSR] Fetching products from:", url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      // Don't cache on the server side - let the client handle caching
      cache: "no-store",
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[SSR] Failed to fetch products: ${response.status}`)
      return []
    }

    const data = await response.json()
    const products = extractProducts(data)

    console.log(`[SSR] Fetched ${products.length} products for SSR`)
    return products
  } catch (error) {
    console.error("[SSR] Error fetching products:", error)
    return []
  }
}

/**
 * Extract products from diverse response formats
 */
function extractProducts(payload: any): Product[] {
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.products)) return data.products
  if (Array.isArray(data?.data)) return data.data
  return []
}

/**
 * Server-side fetcher for admin product edit page (hybrid SSR + client)
 * Fetches product data with full details for immediate rendering
 */
export async function getAdminProductEditData(productId: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    // Fetch all required data in parallel for optimal performance
    const [product, categories, brands, images] = await Promise.all([
      fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      }).then(r => r.json()).catch(() => null),
      
      fetch(`${API_BASE_URL}/api/categories`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      }).then(r => r.json()).catch(() => ({ categories: [] })),
      
      fetch(`${API_BASE_URL}/api/brands`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      }).then(r => r.json()).catch(() => ({ brands: [] })),
      
      fetch(`${API_BASE_URL}/api/products/${productId}/images`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      }).then(r => r.json()).catch(() => ({ images: [] })),
    ])

    clearTimeout(timeoutId)

    if (!product) {
      console.error(`[v0] Product not found: ${productId}`)
      return null
    }

    return {
      product,
      categories: categories?.categories || categories?.data || [],
      brands: brands?.brands || brands?.data || [],
      images: images?.images || images?.data || [],
      fetchedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[v0] Failed to fetch admin product edit data:', error)
    return null
  }
}
