"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Grid3X3 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Loader } from "@/components/ui/loader"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { categoryService, type Category } from "@/services/category"
import { websocketService } from "@/services/websocket"
import { CategoryBanner } from "@/components/categories/category-banner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CategoriesPageClientProps {
  allCategories: Category[]
}

export default function CategoriesPageClient({ allCategories: initialCategories }: CategoriesPageClientProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState("name")

  useEffect(() => {
    const fetchCategories = async () => {
      if (categories.length === 0) {
        setIsLoading(true)
        try {
          const allCats = await categoryService.getCategories()
          setCategories(allCats)
        } catch (error) {
          console.error("Failed to fetch categories:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchCategories()
  }, [categories.length])

  useEffect(() => {
    const handleCategoryUpdate = async () => {
      categoryService.clearCache()
      setIsLoading(true)
      try {
        const updatedCategories = await categoryService.getCategories()
        setCategories([...updatedCategories])
      } catch (error) {
        console.error("Failed to refresh categories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const unsubscribe1 = websocketService.on("category_updated", handleCategoryUpdate)
    const unsubscribe2 = websocketService.on("category_created", handleCategoryUpdate)

    return () => {
      unsubscribe1()
      unsubscribe2()
    }
  }, [])

  const filteredCategories = categories
    .filter(
      (category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "products") return (b.products_count || 0) - (a.products_count || 0)
      return 0
    })

  const handleCategoryClick = (category: Category) => {
    router.push(`/category/${category.slug}`)
  }

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex justify-center py-32">
        <Loader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">Categories</h1>
              <Grid3X3 className="h-6 w-6 text-neutral-600" />
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-neutral-200 text-neutral-700 px-4 py-2 rounded-full">
              <span className="text-sm font-medium">Browse All</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto sm:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-4 w-full rounded-full border-neutral-200 bg-white focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
            {searchQuery && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearchQuery("")}>
                <X className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <CategoryBanner />
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            <span className="font-medium text-neutral-900">{filteredCategories.length}</span> categories available
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-[160px] text-sm rounded-full border-neutral-200">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Alphabetical</SelectItem>
              <SelectItem value="products">Most Products</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="h-8 w-8 text-neutral-300" />
            </div>
            <p className="text-neutral-600 mb-4">
              {searchQuery ? "No categories match your search." : "No categories available."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm text-neutral-900 underline hover:no-underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            <AnimatePresence mode="popLayout">
              {filteredCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, delay: index * 0.015 }}
                >
                  <div
                    onClick={() => handleCategoryClick(category)}
                    className="group cursor-pointer h-full overflow-hidden bg-white border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 rounded-lg"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#f5f5f7]">
                      {category.image_url ? (
                        <OptimizedImage
                          src={category.image_url}
                          alt={category.name}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-50">
                          <Grid3X3 className="w-8 h-8 text-neutral-300" />
                        </div>
                      )}
                      {category.products_count && category.products_count > 0 && (
                        <div className="absolute left-0 top-1.5 bg-neutral-900 text-white text-[9px] font-semibold px-1.5 py-0.5">
                          {category.products_count}
                        </div>
                      )}
                    </div>
                    <div className="p-1.5 sm:p-2 space-y-0.5">
                      <span className="inline-block rounded-sm bg-neutral-100 px-1 py-0.5 text-[8px] sm:text-[9px] font-medium text-neutral-600">
                        CATEGORY
                      </span>
                      <h3 className="line-clamp-2 text-[10px] sm:text-xs font-medium text-gray-900 leading-tight group-hover:text-neutral-600 transition-colors">
                        {category.name}
                      </h3>
                      {category.products_count && category.products_count > 0 && (
                        <p className="text-[9px] sm:text-[10px] text-neutral-400">
                          {category.products_count.toLocaleString()} items
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
