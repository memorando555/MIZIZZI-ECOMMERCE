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

export async function getNewArrivals(limit = 20): Promise<Product[]> {
  // Try up to 2 times with exponential backoff (no excessive retries)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = `${API_BASE_URL}/api/products/?is_new_arrival=true&per_page=${limit}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        next: {
          revalidate: 60,
          tags: ["new-arrivals"],
        },
        headers: {
          "Content-Type": "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.log(`[v0] getNewArrivals: Attempt ${attempt + 1} failed with status ${response.status}`)
        
        // Wait before retry
        if (attempt < 1) {
          const waitTime = 300 * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
        continue
      }

    const data = await response.json()
    let products: Product[] = extractProducts(data)

    products = products.filter((p) => p.is_new_arrival).slice(0, limit)

    if (products.length === 0) {
      return await getFallbackNewArrivals(limit)
    }

    const enhancedProducts = products.map((product) => {
      product = normalizeProductPrices(product)
      return {
        ...product,
        seller: product.seller || defaultSeller,
      } as Product
    })

      return enhancedProducts
    } catch (error) {
      console.log(`[v0] getNewArrivals: Attempt ${attempt + 1} error:`, error instanceof Error ? error.message : String(error))
      
      // Wait before retry
      if (attempt < 1) {
        const waitTime = 300 * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  // After all retries fail, try fallback
  return await getFallbackNewArrivals(limit)
}

async function getFallbackNewArrivals(limit = 20): Promise<Product[]> {
  // Try fallback with 1 retry (fast fail)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = `${API_BASE_URL}/api/products/?per_page=${limit}&sort_by=created_at&sort_order=desc`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        next: {
          revalidate: 60,
          tags: ["new-arrivals-fallback"],
        },
        headers: {
          "Content-Type": "application/json",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (attempt < 1) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }
        continue
      }

      const data = await response.json()
      const products: Product[] = extractProducts(data).slice(0, limit)

      return products.map((product) => {
        product = normalizeProductPrices(product)
        return {
          ...product,
          seller: product.seller || defaultSeller,
        } as Product
      })
    } catch (error) {
      console.log(`[v0] getFallbackNewArrivals: Attempt ${attempt + 1} error:`, error instanceof Error ? error.message : String(error))
      if (attempt < 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
  }
  
  return []
}
