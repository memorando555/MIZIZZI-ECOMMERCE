import type { Product } from "@/types"
import { API_BASE_URL } from "../config"

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

export async function getTopPicks(limit = 20): Promise<Product[]> {
  try {
    const url = `${API_BASE_URL}/api/products/?is_top_pick=true&per_page=${limit}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      next: {
        revalidate: 60,
        tags: ["top-picks"],
      },
      headers: {
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[SSR] Failed to fetch top picks: ${response.status}`)
      return await getFallbackTopPicks(limit)
    }

    const data = await response.json()
    let products: Product[] = extractProducts(data)

    products = products.filter((p) => p.is_top_pick)

    if (products.length === 0) {
      return await getFallbackTopPicks(limit)
    }

    const enhancedProducts = products.map((product) => {
      product = normalizeProductPrices(product)
      return {
        ...product,
        seller: product.seller || defaultSeller,
        product_type: "top_pick" as unknown as Product["product_type"],
      }
    })

    return enhancedProducts
  } catch (error) {
    console.error("[SSR] Error fetching top picks:", error)
    return await getFallbackTopPicks(limit)
  }
}

async function getFallbackTopPicks(limit = 20): Promise<Product[]> {
  try {
    const url = `${API_BASE_URL}/api/products/?per_page=${limit}&sort_by=rating&sort_order=desc`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      next: {
        revalidate: 60,
        tags: ["top-picks-fallback"],
      },
      headers: {
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) return []

    const data = await response.json()
    const products: Product[] = extractProducts(data)

    return products.map((product) => {
      product = normalizeProductPrices(product)
      return {
        ...product,
        seller: product.seller || defaultSeller,
        product_type: "top_pick" as unknown as Product["product_type"],
      }
    })
  } catch (error) {
    console.error("[SSR] Error fetching fallback top picks:", error)
    return []
  }
}
