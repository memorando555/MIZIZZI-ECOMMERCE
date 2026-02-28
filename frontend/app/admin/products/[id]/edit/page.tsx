import { EditProductClient } from "./edit-product-client"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  // In Next.js 16, params is a Promise that needs to be awaited
  const resolvedParams = await params
  const id = resolvedParams.id

  // Pass the unwrapped id to the client component
  // Client component will handle data fetching with SWR hooks
  return <EditProductClient productId={id} />
}


