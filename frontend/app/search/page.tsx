import { Suspense } from "react"
import { searchProducts, searchCategories } from "@/lib/server/search-actions"
import { SearchPageClient } from "@/components/search/search-page-client"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import Link from "next/link"

// Server component that fetches data instantly
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  // Sanitize and clean the query - remove any special characters or encoding issues
  const rawQuery = searchParams?.q || ""
  const query = typeof rawQuery === 'string' 
    ? rawQuery.trim().replace(/[^\w\s\-]/g, '') // Only allow alphanumeric, spaces, and hyphens
    : ""
  
  // Fetch search results on the server for instant display
  const [productsData, categoriesData] = await Promise.all([
    query ? searchProducts(query, { limit: 50 }) : Promise.resolve({ results: [], total: 0, search_time: 0 }),
    query ? searchCategories(query, { limit: 10 }) : Promise.resolve({ results: [], total: 0 }),
  ])

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/search">Search</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="font-medium text-foreground">{query || "Results"}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <SearchPageClient
        initialQuery={query}
        initialProducts={productsData.results}
        initialCategories={categoriesData.results}
        initialSearchTime={productsData.search_time}
        initialTotalProducts={productsData.total}
        initialTotalCategories={categoriesData.total}
      />
    </div>
  )
}
