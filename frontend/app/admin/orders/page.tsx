import OrdersDisplay from "./orders-display"
import { getAdminOrders } from "@/lib/server/get-admin-orders"

/**
 * Orders management page - Server-Side Rendered
 * Fetches data on the server and renders instantly without loaders
 */
export const metadata = {
  title: "Order Management | Mizizzi Admin",
  description: "Manage and track all customer orders",
}

export const revalidate = 30 // Revalidate every 30 seconds

export default async function OrdersPage() {
  // Fetch orders server-side - this happens during SSR
  const ordersData = await getAdminOrders({
    page: 1,
    per_page: 20,
  })

  // Pass pre-fetched data to client component
  // No loading spinners needed since data is already here
  return <OrdersDisplay initialData={ordersData} />
}

