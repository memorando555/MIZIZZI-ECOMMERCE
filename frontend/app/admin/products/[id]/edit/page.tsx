import { EditProductClient } from "./edit-product-client"
import { getProductData } from "./server-data"
import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  // In Next.js 16, params is a Promise that needs to be awaited
  const resolvedParams = await params
  const id = resolvedParams.id

  // Fetch all data server-side before rendering using proper server-side API calls
  const { product, categories, brands, images, error } = await getProductData(id)

  // Redirect if product not found
  if (error || !product) {
    redirect("/admin/products")
  }

  // Pass the data to the client component
  return (
    <EditProductClient
      productId={id}
      initialProduct={product}
      initialCategories={categories}
      initialBrands={brands}
      initialImages={images}
    />
  )
}

