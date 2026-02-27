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

/**
 * Server-side function to fetch luxury deal products
 * This runs on the server before the page is sent to the browser
 * Only returns products that are explicitly marked as luxury deals
 */
export async function getLuxuryProducts(limit = 12): Promise<Product[]> {
  const urls = [
    `${API_BASE_URL}/api/products/?is_luxury_deal=true&per_page=${limit}`,
    `${API_BASE_URL}/api/products/?is_luxury=true&per_page=${limit}`,
  ]

  let allProducts: Product[] = []

  // Try fetching from both endpoints with fast retries
  for (const url of urls) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

        const response = await fetch(url, {
          signal: controller.signal,
          next: {
            revalidate: 60, // Cache for 60 seconds on the server
            tags: ["luxury-deals"], // Tag for on-demand revalidation
          },
          headers: {
            "Content-Type": "application/json",
          },
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          const products: Product[] = extractProducts(data)
          allProducts = [...allProducts, ...products]
          break // Success, move to next URL
        } else if (attempt < 1) {
          const waitTime = 300 * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      } catch (e) {
        console.log(`[v0] getLuxuryProducts: Attempt ${attempt + 1} error for ${url}:`, e instanceof Error ? e.message : String(e))
        if (attempt < 1) {
          const waitTime = 300 * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }
  }

    const luxuryProducts = allProducts.filter((p) => {
      const anyP = p as any
      return anyP.is_luxury === true || anyP.is_luxury_deal === true || anyP.isLuxury === true
    })

    // Remove duplicates by ID
    const uniqueProducts = luxuryProducts.reduce((acc: Product[], current) => {
      const exists = acc.find((p) => p.id === current.id)
      if (!exists) {
        acc.push(current)
      }
      return acc
    }, [])

    if (uniqueProducts.length === 0) {
      console.log("[SSR] No luxury products found in database")
      return []
    }

    // Normalize and enhance products
    const enhancedProducts = uniqueProducts.slice(0, limit).map((product) => {
      product = normalizeProductPrices(product)

      return {
        ...product,
        seller: product.seller || defaultSeller,
        product_type: "luxury" as const,
      }
    })

  return enhancedProducts
}
