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

  // Convert string prices to numbers
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

/**
 * Server-side function to fetch flash sale products
 * This runs on the server before the page is sent to the browser
 * Similar to how Jumia pre-renders products for instant display
 *
 * Only returns products that are explicitly marked as flash sale
 */
export async function getFlashSaleProducts(limit = 50): Promise<Product[]> {
  try {
    const urls = [
      `${API_BASE_URL}/api/products/?is_flash_sale=true&per_page=${limit}`,
      `${API_BASE_URL}/api/products/?flash_sale=true&per_page=${limit}`,
    ]

    let allProducts: Product[] = []

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          next: {
            revalidate: 60, // Cache for 60 seconds on the server
            tags: ["flash-sales"], // Tag for on-demand revalidation
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

    // Normalize and enhance products
    const enhancedProducts = flashSaleProducts.map((product) => {
      product = normalizeProductPrices(product)

      return {
        ...product,
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

/**
 * Server-side function to fetch inventory for products
 */
export async function getProductsInventory(productIds: string[]): Promise<Record<string, number>> {
  if (!productIds.length) return {}

  const inventory: Record<string, number> = {}

  // For server-side, we'll use the stock from the products themselves
  // Real inventory API calls would happen here in production

  return inventory
}
