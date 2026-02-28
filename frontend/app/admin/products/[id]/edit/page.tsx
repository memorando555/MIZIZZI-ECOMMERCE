import { EditProductClient } from "./edit-product-client"
import { getProductEditData } from "@/lib/server/get-product-data"
import { redirect } from "next/navigation"

export const revalidate = 30 // ISR: revalidate every 30 seconds for fresh product data

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  // Await params in Next.js 16
  const resolvedParams = await params
  const productId = resolvedParams.id

  // Fetch all product data server-side before rendering
  const { product, categories, brands, images, error } = await getProductEditData(productId)

  // Redirect if product not found
  if (error || !product) {
    redirect("/admin/products")
  }

  // Render client component with server-fetched data
  return (
    <EditProductClient
      productId={productId}
      initialProduct={product}
      initialCategories={categories}
      initialBrands={brands}
      initialImages={images}
    />
  )
}
