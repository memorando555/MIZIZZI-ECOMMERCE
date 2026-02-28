"use server"

import { EditProductClient } from "./edit-product-client"
import { getProductData } from "./server-data"
import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage(props: PageProps) {
  const params = await props.params
  const id = params.id

  // Fetch product data server-side only - no browser APIs
  const result = await getProductData(id)

  if (result.error || !result.product) {
    redirect("/admin/products")
  }

  return (
    <EditProductClient
      productId={id}
      initialProduct={result.product}
      initialCategories={result.categories}
      initialBrands={result.brands}
      initialImages={result.images}
    />
  )
}


