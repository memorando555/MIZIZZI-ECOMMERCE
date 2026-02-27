import type { Product } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

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

export async function getTrendingProducts(limit = 20): Promise<Product[]> {
  try {
    const url = `${API_BASE_URL}/api/products/?is_trending=true&per_page=${limit}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 7000) // 7 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      next: {
        revalidate: 60,
        tags: ["trending-products"],
      },
      headers: {
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log(`[v0] getTrendingProducts: Failed with status ${response.status}`)
      return await getFallbackTrendingProducts(limit)
    }

    const data = await response.json()
    let products: Product[] = extractProducts(data).slice(0, limit)

    products = products.filter((p) => p.is_trending)

    if (products.length === 0) {
      return await getFallbackTrendingProducts(limit)
    }

    const enhancedProducts = products.map((product) => {
      product = normalizeProductPrices(product)
      return {
        ...product,
        seller: product.seller || defaultSeller,
        product_type: product.product_type ?? "regular",
      }
    })

    return enhancedProducts
  } catch (error) {
    console.log(`[v0] getTrendingProducts: Error:`, error instanceof Error ? error.message : String(error))
    return await getFallbackTrendingProducts(limit)
  }
}

async function getFallbackTrendingProducts(limit = 20): Promise<Product[]> {
  try {
    const url = `${API_BASE_URL}/api/products/?per_page=${limit}&sort_by=view_count&sort_order=desc`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 7000) // 7 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      next: {
        revalidate: 60,
        tags: ["trending-products-fallback"],
      },
      headers: {
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) return []

    const data = await response.json()
    const products: Product[] = extractProducts(data).slice(0, limit)

    return products.map((product) => {
      product = normalizeProductPrices(product)
      return {
        ...product,
        seller: product.seller || defaultSeller,
        product_type: product.product_type ?? "regular",
      }
    })
  } catch (error) {
    console.log(`[v0] getFallbackTrendingProducts: Error:`, error instanceof Error ? error.message : String(error))
    return []
  }
}
