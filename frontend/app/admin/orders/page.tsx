import { Suspense } from "react"
import { getAdminOrders } from "@/lib/server/get-admin-orders"
import OrdersPageContent from "./orders-page-content"
import { Loader } from "@/components/ui/loader"

async function OrdersContent() {
  // Fetch initial orders data on the server
  const initialData = await getAdminOrders({
    page: 1,
    per_page: 20,
  })

  return <OrdersPageContent initialData={initialData} />
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersPageFallback />}>
      <OrdersContent />
    </Suspense>
  )
}

function OrdersPageFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader />
    </div>
  )
}
