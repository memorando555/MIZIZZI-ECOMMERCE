import { getAdminProductEditData } from "@/lib/server-product-fetch"
import { EditProductClient } from "./edit-product-client"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Loading skeleton while data is being fetched
function EditProductSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-96" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const productId = resolvedParams.id

  // Fetch initial data server-side for instant display
  const initialData = await getAdminProductEditData(productId)

  if (!initialData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Product Not Found</h1>
          <p className="text-gray-600 mt-2">The product you're trying to edit doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<EditProductSkeleton />}>
      <EditProductClient
        productId={productId}
        initialData={initialData}
      />
    </Suspense>
  )
}

