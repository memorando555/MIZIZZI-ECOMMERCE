import type { Product } from "@/types"
import { productService } from "@/services/product"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

// Default seller information
const defaultSeller = {
  id: 1,
  name: "Mizizzi Store",
  rating: 4.8,
  verified: true,
  store_name: "Mizizzi Official Store",
  logo_url: "/logo.png",
}

function extractProducts(payload: any): Product[] {
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.products)) return data.products
  if (Array.isArray(data?.data)) return data.data
  return []
}

function normalizeProductPrices(product: Product): Product {
  let price = product.price
  let salePrice = product.sale_price

  if (typeof price === "string") {
    price = Number.parseFloat(price) || 0
  }
  if (typeof salePrice === "string") {
    salePrice = Number.parseFloat(salePrice) || null
  }

  return {
    ...product,
    price: price || 0,
    sale_price: salePrice || null,
  }
}

/**
 * Server-side function to fetch all products with pagination
 * This runs on the server before the page is sent to the browser
 * Uses caching with ISR (Incremental Static Regeneration)
 */
export async function getAllProducts(limit = 12, page = 1): Promise<Product[]> {
  console.log("[v0] getAllProducts: Starting fetch from", API_BASE_URL, "limit:", limit, "page:", page)

  try {
    // Try the main products endpoint
    const productsEndpoint = `${API_BASE_URL}/api/products/?per_page=${limit}&page=${page}`
    console.log("[v0] getAllProducts: Trying endpoint:", productsEndpoint)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(productsEndpoint, {
        signal: controller.signal,
        next: {
          revalidate: 60, // Cache for 60 seconds on the server
          tags: ["all-products"], // Tag for on-demand revalidation
        },
        headers: {
          "Content-Type": "application/json",
        },
      })

      clearTimeout(timeoutId)

      console.log("[v0] getAllProducts: Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] getAllProducts: Got data:", {
          hasItems: !!data.items,
          itemCount: data.items?.length || 0,
          hasProducts: !!data.products,
          productCount: data.products?.length || 0,
          sampleItem: data.items?.[0]?.name || data.products?.[0]?.name,
        })

        let products = extractProducts(data)

        if (products.length > 0) {
          // Normalize and enhance products with images
          const enhancedProducts: Product[] = await Promise.all(
            products.map(async (product: any) => {
              const p = normalizeProductPrices(product)

              console.log(`[v0] getAllProducts: Processing product ${p.id}, has image_urls: ${!!p.image_urls?.length}`)

              // Fetch product images if they're not already included
              if ((!p.image_urls || p.image_urls.length === 0) && p.id) {
                try {
                  const images = await productService.getProductImages(p.id.toString())
                  console.log(`[v0] getAllProducts: Product ${p.id} fetched ${images?.length || 0} images`)
                  
                  if (images && images.length > 0) {
                    p.image_urls = images.map((img) => img.url)

                    // Set thumbnail_url to the primary image if it exists
                    const primaryImage = images.find((img) => img.is_primary)
                    if (primaryImage) {
                      p.thumbnail_url = primaryImage.url
                    } else if (images[0]) {
                      p.thumbnail_url = images[0].url
                    }
                    
                    console.log(`[v0] getAllProducts: Product ${p.id} now has ${p.image_urls.length} image urls, thumbnail: ${p.thumbnail_url}`)
                  }
                } catch (error) {
                  console.error(`[v0] Error fetching images for product ${p.id}:`, error)
                }
              }

              return {
                ...p,
                seller: p.seller || defaultSeller,
                product_type: (p.product_type ?? "regular") as Product["product_type"],
              } as Product
            }),
          )

          // Prefetch images for remaining products in the background
          productService.prefetchProductImages(enhancedProducts.slice(5).map((p) => p.id.toString()))

          console.log("[v0] getAllProducts: Returning", enhancedProducts.length, "enhanced products")
          return enhancedProducts
        }
      }
    } catch (err) {
      console.error("[v0] getAllProducts: Endpoint failed:", err)
    }

    // Fallback to empty array
    console.log("[v0] getAllProducts: Returning empty array - fetch failed")
    return []
  } catch (error) {
    console.error("[v0] getAllProducts: Critical error:", error)
    return []
  }
}

/**
 * Get initial products for home page with pagination info
 */
export async function getAllProductsForHome(limit = 12): Promise<{ products: Product[]; hasMore: boolean }> {
  const products = await getAllProducts(limit, 1)
  return {
    products,
    hasMore: products.length >= limit,
  }
}
