import { notFound } from "next/navigation"
import type { Product } from "@/types"
import { productService } from "@/services/product"
import { adminService } from "@/services/admin"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

async function getProduct(id: string): Promise<Product | null> {
  try {
    // Try local API first
    const localEndpoint = `/api/products/${id}`
    const response = await fetch(
      `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}${localEndpoint}`,
      {
        next: {
          revalidate: 60, // ISR cache for 60 seconds
          tags: [`product-${id}`],
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      const product = data.data || data
      return normalizeProduct(product)
    }
  } catch (error) {
    console.error("[v0] Failed to fetch from local API:", error)
  }

  try {
    // Fallback to external API
    const response = await fetch(`${API_BASE_URL}/api/products/${id}/`, {
      next: {
        revalidate: 60,
        tags: [`product-${id}`],
      },
    })

    if (response.ok) {
      const data = await response.json()
      const product = data.data || data
      return normalizeProduct(product)
    }
  } catch (error) {
    console.error("[v0] Failed to fetch from external API:", error)
  }

  return null
}

function normalizeProduct(product: any): Product {
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
  } as Product
}

export const metadata = {
  title: "Product Details - Mizizzi Admin",
  description: "Manage product details, pricing, inventory, and features",
  robots: "noindex, nofollow", // Admin pages should not be indexed
}

export const revalidate = 60 // ISR: revalidate every 60 seconds

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

}
