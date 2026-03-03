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

export async function getDailyFinds(limit = 20): Promise<Product[]> {
  try {
    const url = `${API_BASE_URL}/api/products/?is_daily_find=true&per_page=${limit}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      next: {
        revalidate: 60,
        tags: ["daily-finds"],
      },
      headers: {
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[SSR] Failed to fetch daily finds: ${response.status}`)
      return await getFallbackDailyFinds(limit)
    }

    const data = await response.json()
    let products: Product[] = extractProducts(data)

    products = products.filter((p) => p.is_daily_find)

    if (products.length === 0) {
      return await getFallbackDailyFinds(limit)
    }

    const enhancedProducts = products.map((product) => {
      product = normalizeProductPrices(product)
      return {
        ...product,
        seller: product.seller || defaultSeller,
        product_type: "daily_find" as const,
      }
    })

    return enhancedProducts as unknown as Product[]
  } catch (error) {
    console.error("[SSR] Error fetching daily finds:", error)
    return await getFallbackDailyFinds(limit)
  }
}

async function getFallbackDailyFinds(limit = 20): Promise<Product[]> {
  try {
    const url = `${API_BASE_URL}/api/products/?has_sale=true&per_page=${limit}&sort_by=updated_at&sort_order=desc`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      next: {
        revalidate: 60,
        tags: ["daily-finds-fallback"],
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
        product_type: "daily_find" as const,
      }
    }) as unknown as Product[]
  } catch (error) {
    console.error("[SSR] Error fetching fallback daily finds:", error)
    return []
  }
}
