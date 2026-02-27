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

export interface FlashSaleEvent {
  id: number
  name: string
  description?: string
  start_time: string
  end_time: string
  is_active: boolean
  is_live: boolean
  time_remaining: number
  banner_color?: string
}

export interface FlashSaleProduct extends Product {
  flash_sale_stock: number
  flash_sale_sold: number
  items_left: number
  progress_percentage: number
  is_almost_gone: boolean
  is_sold_out: boolean
}

export interface FlashSaleData {
  products: FlashSaleProduct[]
  event: FlashSaleEvent | null
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

function isFlashSaleProduct(product: Product): boolean {
  return !!(
    product.is_flash_sale === true ||
    (product as any).isFlashSale === true ||
    (product as any).is_flash_sale_deal === true ||
    (product as any).flash_sale === true
  )
}

function enhanceWithFlashSaleData(product: Product): FlashSaleProduct {
  const flashStock = (product as any).flash_sale_stock || (product as any).flashSaleStock || product.stock || 100
  const flashSold = (product as any).flash_sale_sold || (product as any).flashSaleSold || 0

  // If items_left is already provided by backend, use it
  const itemsLeft = (product as any).items_left ?? Math.max(0, flashStock - flashSold)

  // If progress_percentage is already provided by backend, use it
  const progressPercentage =
    (product as any).progress_percentage ?? (flashStock > 0 ? (itemsLeft / flashStock) * 100 : 0)

  return {
    ...product,
    flash_sale_stock: flashStock,
    flash_sale_sold: flashSold,
    items_left: itemsLeft,
    progress_percentage: Math.round(progressPercentage * 10) / 10,
    is_almost_gone: (product as any).is_almost_gone ?? itemsLeft <= 5,
    is_sold_out: (product as any).is_sold_out ?? itemsLeft === 0,
  }
}

function getDefaultEvent(): FlashSaleEvent {
  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  if (endOfDay <= now) {
    endOfDay.setDate(endOfDay.getDate() + 1)
  }

  const timeRemaining = Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000))

  return {
    id: 1,
    name: "Flash Sales | Live Now",
    description: "Limited time offers!",
    start_time: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
    end_time: endOfDay.toISOString(),
    is_active: true,
    is_live: true,
    time_remaining: timeRemaining,
    banner_color: "#8B1538",
  }
}

/**
 * Server-side function to fetch flash sale products with event timing
 * Returns products with items_left, progress bar data, and countdown timer info
 */
export async function getFlashSaleProducts(limit = 50): Promise<FlashSaleProduct[]> {
  try {
    // Try the dedicated flash sale endpoint first (has stock tracking data)
    const flashSaleEndpoint = `${API_BASE_URL}/api/flash-sale/products?limit=${limit}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 7000) // 7 second timeout

      const response = await fetch(flashSaleEndpoint, {
        signal: controller.signal,
        next: {
          revalidate: 60,
          tags: ["flash-sales"],
        },
        headers: {
          "Content-Type": "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()

        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          // Map products without waiting for images - images will load separately
          const products = data.items.slice(0, limit).map((p: Product) => {
            const product = normalizeProductPrices(p)

            return {
              ...product,
              items_left: (p as any).items_left,
              flash_sale_stock: (p as any).flash_sale_stock,
              flash_sale_sold: (p as any).flash_sale_sold,
              progress_percentage: (p as any).progress_percentage,
              is_almost_gone: (p as any).is_almost_gone,
              is_sold_out: (p as any).is_sold_out,
              seller: (p as any).seller || defaultSeller,
              product_type: "flash_sale" as const,
            }
          })

          return products
        }
      }
    } catch (err) {
      console.log("[v0] getFlashSaleProducts: Dedicated endpoint failed, trying fallback")
    }

    // Fallback to featured routes endpoint
    const featuredEndpoint = `${API_BASE_URL}/featured/fast/flash-sale?limit=${limit}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 7000) // 7 second timeout

      const response = await fetch(featuredEndpoint, {
        signal: controller.signal,
        next: {
          revalidate: 60,
          tags: ["flash-sales"],
        },
        headers: {
          "Content-Type": "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const products = (data.items || []).slice(0, limit)

        if (products.length > 0) {
          // Map products without waiting for images - images will load separately
          const mappedProducts = products.map((p: Product) => {
            const product = normalizeProductPrices(p)

            return {
              ...product,
              items_left: (p as any).items_left,
              flash_sale_stock: (p as any).flash_sale_stock,
              flash_sale_sold: (p as any).flash_sale_sold,
              progress_percentage: (p as any).progress_percentage,
              is_almost_gone: (p as any).is_almost_gone,
              is_sold_out: (p as any).is_sold_out,
              seller: (p as any).seller || defaultSeller,
              product_type: "flash_sale" as const,
            }
          })

          return mappedProducts
        }
      }
    } catch (err) {
      console.log("[v0] getFlashSaleProducts: Featured endpoint failed, trying generic fallback")
    }

    // Final fallback: query products with is_flash_sale=true
    const urls = [
      `${API_BASE_URL}/api/products/?is_flash_sale=true&per_page=${limit}`,
      `${API_BASE_URL}/api/products/?flash_sale=true&per_page=${limit}`,
    ]

    let allProducts: Product[] = []

    for (const url of urls) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 7000) // 7 second timeout

        const response = await fetch(url, {
          signal: controller.signal,
          next: {
            revalidate: 60,
            tags: ["flash-sales"],
          },
          headers: {
            "Content-Type": "application/json",
          },
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          const products = extractProducts(data)
          allProducts = [...allProducts, ...products]
        }
      } catch (err) {
        console.log(`[v0] getFlashSaleProducts: Generic fallback error:`, err instanceof Error ? err.message : String(err))
      }
    }

    // Filter for flash sale products only
    let flashSaleProducts = allProducts.filter(isFlashSaleProduct)

    // Remove duplicates
    const seenIds = new Set<string | number>()
    flashSaleProducts = flashSaleProducts.filter((p) => {
      if (seenIds.has(p.id)) return false
      seenIds.add(p.id)
      return true
    })

    // Map products without waiting for images - images will load separately
    const enhancedProducts = flashSaleProducts
      .slice(0, limit)
      .map((product: Product) => {
        const p = normalizeProductPrices(product)
        const enhanced = enhanceWithFlashSaleData(p)

        return {
          ...enhanced,
          seller: p.seller || defaultSeller,
          product_type: "flash_sale" as const,
        }
      })

    return enhancedProducts
  } catch (error) {
    console.log("[v0] getFlashSaleProducts: Error:", error instanceof Error ? error.message : String(error))
    return []
  }
}

export async function getFlashSaleEvent(): Promise<FlashSaleEvent> {
  console.log("[v0] getFlashSaleEvent: Fetching event data")

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/api/flash-sale/event`, {
      signal: controller.signal,
      next: {
        revalidate: 30,
        tags: ["flash-sale-event"],
      },
      headers: {
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    console.log("[v0] getFlashSaleEvent: Response status:", response.status)

    if (response.ok) {
      const data = await response.json()
      console.log("[v0] getFlashSaleEvent: Got event data:", {
        id: data.id,
        name: data.name,
        time_remaining: data.time_remaining,
        is_live: data.is_live,
      })
      return data
    }
  } catch (error) {
    console.error("[v0] getFlashSaleEvent: Error:", error)
  }

  console.log("[v0] getFlashSaleEvent: Using default event")
  return getDefaultEvent()
}

export async function getFlashSaleData(limit = 50): Promise<FlashSaleData> {
  const [products, event] = await Promise.all([getFlashSaleProducts(limit), getFlashSaleEvent()])

  console.log("[v0] getFlashSaleData: Final result -", products.length, "products, event:", event?.name)

  return {
    products,
    event,
  }
}
