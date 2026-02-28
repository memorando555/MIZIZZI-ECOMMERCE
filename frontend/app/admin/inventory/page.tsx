import { Suspense } from "react"
import { InventoryStatsServer } from "@/components/inventory/inventory-stats-server"
import { InventoryDataServer } from "@/components/inventory/inventory-data-server"
import { InventoryStatsSkeleton, InventoryTableSkeleton, InventoryFiltersSkeletion } from "@/components/inventory/inventory-skeletons"

interface InventoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = {
  title: "Inventory Management | Mizizzi Admin",
  description: "Manage your product inventory with real-time insights and stock tracking",
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams

  return (
    <main className="flex-1 overflow-auto">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Inventory Management</h1>
          <p className="text-slate-600">Manage your product inventory with powerful tools and real-time insights</p>
        </div>

        {/* Stats Section - Server Rendered with Fallback */}
        <Suspense fallback={<InventoryStatsSkeleton />}>
          <InventoryStatsServer />
        </Suspense>

        {/* Filters and Table Section - Server Rendered with Fallback */}
        <Suspense fallback={<InventoryFiltersSkeletion />}>
          <div className="mb-6"></div>
        </Suspense>

        <Suspense fallback={<InventoryTableSkeleton />}>
          <InventoryDataServer searchParams={params} />
        </Suspense>
      </div>
    </main>
  )
}
