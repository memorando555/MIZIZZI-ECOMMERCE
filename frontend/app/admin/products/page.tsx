import { getAllProducts } from "@/lib/server/get-all-products"
import AdminProductsClient from "./admin-products-client"
import type { Product } from "@/types"

export const revalidate = 60 // ISR: revalidate every 60 seconds

export default async function AdminProductsPage() {
  let initialProducts: Product[] = []
  let error: string | null = null

  try {
    // Fetch products server-side for instant rendering
    initialProducts = await getAllProducts(10000, 1)
  } catch (err: any) {
    console.error("Error fetching products:", err)
    error = err?.message || "Failed to load products"
  }

  return <AdminProductsClient initialProducts={initialProducts} />
}
