import type { Product } from "@/types"

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
  const flashStock = (product as any).flash_sale_stock || product.stock || 100
  const flashSold = (product as any).flash_sale_sold || 0
  const itemsLeft = Math.max(0, flashStock - flashSold)
  const progressPercentage = flashStock > 0 ? (itemsLeft / flashStock) * 100 : 0

  return {
    ...product,
    flash_sale_stock: flashStock,
    flash_sale_sold: flashSold,
    items_left: itemsLeft,
    progress_percentage: Math.round(progressPercentage * 10) / 10,
    is_almost_gone: itemsLeft <= 5,
    is_sold_out: itemsLeft === 0,
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
    const newEndpointUrl = `${API_BASE_URL}/api/flash-sale/products?limit=${limit}`

    try {
      const response = await fetch(newEndpointUrl, {
        next: {
          revalidate: 60,
          tags: ["flash-sales"],
        },
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.items && Array.isArray(data.items)) {
          return data.items.map((p: Product) => ({
            ...normalizeProductPrices(p),
            seller: (p as any).seller || defaultSeller,
            product_type: "flash_sale" as const,
          }))
        }
      }
    } catch (err) {
      console.error(`[SSR] New flash sale endpoint failed:`, err)
    }

    // Fallback to existing endpoints
    const urls = [
      `${API_BASE_URL}/api/products/?is_flash_sale=true&per_page=${limit}`,
      `${API_BASE_URL}/api/products/?flash_sale=true&per_page=${limit}`,
    ]

    let allProducts: Product[] = []

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          next: {
            revalidate: 60,
            tags: ["flash-sales"],
          },
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          const products = extractProducts(data)
          allProducts = [...allProducts, ...products]
        }
      } catch (err) {
        console.error(`[SSR] Failed to fetch from ${url}:`, err)
      }
    }

    let flashSaleProducts = allProducts.filter(isFlashSaleProduct)

    const seenIds = new Set<string | number>()
    flashSaleProducts = flashSaleProducts.filter((p) => {
      if (seenIds.has(p.id)) return false
      seenIds.add(p.id)
      return true
    })

    const enhancedProducts = flashSaleProducts.map((product) => {
      product = normalizeProductPrices(product)
      const enhanced = enhanceWithFlashSaleData(product)

      return {
        ...enhanced,
        seller: product.seller || defaultSeller,
        product_type: "flash_sale" as const,
      }
    })

    return enhancedProducts
  } catch (error) {
    console.error("[SSR] Error fetching flash sale products:", error)
    return []
  }
}

export async function getFlashSaleEvent(): Promise<FlashSaleEvent> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flash-sale/event`, {
      next: {
        revalidate: 30,
        tags: ["flash-sale-event"],
      },
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data
    }
  } catch (error) {
    console.error("[SSR] Error fetching flash sale event:", error)
  }

  return getDefaultEvent()
}

export async function getFlashSaleData(limit = 50): Promise<FlashSaleData> {
  const [products, event] = await Promise.all([getFlashSaleProducts(limit), getFlashSaleEvent()])

  return {
    products,
    event,
  }
}

/**
 * Server-side function to fetch inventory for products
 */
export async function getProductsInventory(productIds: string[]): Promise<Record<string, number>> {
  if (!productIds.length) return {}
  const inventory: Record<string, number> = {}
  return inventory
}
