import type { Product } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

interface ProductsResponse {
  products: Product[]
  hasMore: boolean
  total: number
}

export async function getAllProducts(limit = 12): Promise<ProductsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products?limit=${limit}&page=1`, {
      next: { revalidate: 60, tags: ["all-products"] },
    })

    if (!response.ok) {
      console.error("Failed to fetch all products:", response.status)
      return { products: [], hasMore: false, total: 0 }
    }

    const data = await response.json()
    const products = Array.isArray(data) ? data : data.products || []

    const normalizedProducts = products.map((product: Product) => ({
      ...product,
      price: typeof product.price === "number" ? product.price : Number.parseFloat(product.price) || 0,
      sale_price: product.sale_price
        ? typeof product.sale_price === "number"
          ? product.sale_price
          : Number.parseFloat(product.sale_price)
        : null,
    }))

    return {
      products: normalizedProducts,
      hasMore: normalizedProducts.length >= limit,
      total: data.total || normalizedProducts.length,
    }
  } catch (error) {
    console.error("Error fetching all products:", error)
    return { products: [], hasMore: false, total: 0 }
  }
}
