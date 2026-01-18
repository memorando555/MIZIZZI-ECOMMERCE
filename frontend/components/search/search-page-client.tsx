"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ProductFilters } from "@/components/products/product-filters"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp, Filter, Grid, List } from "lucide-react"
import Link from "next/link"
import { SearchProductImage } from "@/components/products/search-product-image"
import { imageBatchService } from "@/services/image-batch-service"

interface SearchResult {
  id: number
  name: string
  description: string
  price: number
  image: string
  category?: string | { name: string }
  brand?: string
  score?: number
}

interface CategoryResult {
  id: number
  name: string
  description: string
  slug: string
  image_url?: string
  banner_url?: string
  is_featured: boolean
  products_count: number
  subcategories_count?: number
}

interface SearchPageClientProps {
  initialQuery: string
  initialProducts: SearchResult[]
  initialCategories: CategoryResult[]
  initialSearchTime: number
  initialTotalProducts: number
  initialTotalCategories: number
}

function SearchProductGrid({ products, emptyMessage }: { products: SearchResult[]; emptyMessage: string }) {
  useEffect(() => {
    if (products.length > 0) {
      const productIds = products.map((p) => p.id.toString())
      imageBatchService.prefetchProductImages(productIds)
    }
  }, [products])

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-5 lg:gap-3">
      {products.map((product) => (
        <Link key={product.id} href={`/product/${product.id}`} className="group">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-[4/3] relative">
              <SearchProductImage
                productId={product.id}
                productName={product.name}
                className="w-full h-full object-cover"
              />
              {product.score && product.score > 0.8 && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  {Math.round(product.score * 100)}% match
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
              <p className="text-gray-600 text-xs line-clamp-1 mb-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">KSh {product.price.toLocaleString()}</span>
                {product.category && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {typeof product.category === "string" ? product.category : product.category.name || "Category"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function CategoryGrid({ categories }: { categories: CategoryResult[] }) {
  if (categories.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Grid className="h-5 w-5" />
        Categories ({categories.length})
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => (
          <Link key={category.id} href={`/category/${category.slug}`} className="group">
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square relative bg-gray-50">
                {category.image_url ? (
                  <img
                    src={category.image_url || "/placeholder.svg"}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Grid className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                {category.is_featured && (
                  <div className="absolute top-2 right-2 bg-cherry-500 text-white text-xs px-2 py-1 rounded">
                    Featured
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm line-clamp-1 mb-1">{category.name}</h4>
                <p className="text-gray-600 text-xs">
                  {category.products_count} product{category.products_count !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function SearchPageClient({
  initialQuery,
  initialProducts,
  initialCategories,
  initialSearchTime,
  initialTotalProducts,
  initialTotalCategories,
}: SearchPageClientProps) {
  const [results, setResults] = useState<SearchResult[]>(initialProducts)
  const [categories, setCategories] = useState<CategoryResult[]>(initialCategories)
  const [searchTime, setSearchTime] = useState(initialSearchTime)
  const [totalProducts, setTotalProducts] = useState(initialTotalProducts)
  const [totalCategories, setTotalCategories] = useState(initialTotalCategories)
  const [showFilters, setShowFilters] = useState(false)

  const [categoriesFilter] = useState<string[]>([
    "All Categories",
    "Jewelry",
    "Accessories",
    "Bags",
    "Clothing",
    "Shoes",
  ])
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories")
  const [priceRange] = useState<[number, number]>([0, 100000])
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number]>([0, 100000])

  // Apply client-side filtering
  const filteredResults = useMemo(() => {
    let filtered = [...results]

    // Category filter
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter((product) => {
        const productCategory =
          typeof product.category === "string" ? product.category : product.category?.name
        return productCategory?.toLowerCase() === selectedCategory.toLowerCase()
      })
    }

    // Price filter
    filtered = filtered.filter(
      (product) => product.price >= selectedPriceRange[0] && product.price <= selectedPriceRange[1]
    )

    return filtered
  }, [results, selectedCategory, selectedPriceRange])

  const totalResults = totalProducts + totalCategories

  const formatSearchTime = (time: number) => {
    if (typeof time !== "number" || isNaN(time)) return "0ms"
    return time < 1 ? `${Math.round(time * 1000)}ms` : `${time.toFixed(2)}s`
  }

  return (
    <div>
      {/* Search Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Search Results
              {initialQuery && <span className="text-cherry-600 ml-2">for "{initialQuery}"</span>}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {totalResults} result{totalResults !== 1 ? "s" : ""} found
                {totalCategories > 0 && (
                  <span className="ml-1">
                    ({totalProducts} product{totalProducts !== 1 ? "s" : ""}, {totalCategories} categor
                    {totalCategories !== 1 ? "ies" : "y"})
                  </span>
                )}
              </span>
              {searchTime > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatSearchTime(searchTime)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 flex-shrink-0">
            <ProductFilters
              categories={categoriesFilter}
              priceRange={priceRange}
              selectedCategory={selectedCategory}
              selectedPriceRange={selectedPriceRange}
              onCategoryChange={setSelectedCategory}
              onPriceRangeChange={setSelectedPriceRange}
            />
          </div>
        )}

        {/* Results */}
        <div className="flex-1">
          <CategoryGrid categories={categories} />

          {/* Products Section */}
          {(filteredResults.length > 0 || initialQuery) && (
            <div>
              {categories.length > 0 && (
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Products ({filteredResults.length})
                </h3>
              )}
              <SearchProductGrid
                products={filteredResults}
                emptyMessage={initialQuery ? `No products found for "${initialQuery}"` : "Enter a search term to find products"}
              />
            </div>
          )}

          {/* Empty state when no results at all */}
          {filteredResults.length === 0 && categories.length === 0 && initialQuery && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No results found for "{initialQuery}"</p>
              <p className="text-sm text-gray-400">Try different keywords or check your spelling</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
