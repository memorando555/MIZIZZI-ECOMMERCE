import { getInventoryServerData } from "@/lib/server-inventory"
import { InventoryTableClient } from "./inventory-table-client"

interface InventoryDataServerProps {
  searchParams?: Record<string, string | string[] | undefined>
}

export async function InventoryDataServer({ searchParams }: InventoryDataServerProps) {
  const page = Number(searchParams?.page) || 1
  const search = (searchParams?.search as string) || ""
  const status = (searchParams?.status as string) || "all"
  const stock_level = (searchParams?.stock_level as string) || "all"
  const category = (searchParams?.category as string) || "all"
  const brand = (searchParams?.brand as string) || "all"

  const filters = {
    search,
    status,
    stock_level,
    category,
    brand,
    sort_by: "product_name",
    sort_dir: "asc",
  }

  const data = await getInventoryServerData(page, 20, filters)

  return (
    <InventoryTableClient
      initialInventory={data.inventory}
      initialPagination={data.pagination}
      initialStats={data.stats}
      initialFilters={filters}
    />
  )
}
