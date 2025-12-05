 "use client"
import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Grid3X3 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Loader } from "@/components/ui/loader"
import { categoryService, type Category } from "@/services/category"
import { websocketService } from "@/services/websocket"
import { CategoryBanner } from "@/components/categories/category-banner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useSWR from "swr"

const CATEGORIES_STORAGE_KEY = "mizizzi_all_categories_cache"

const getCachedCategories = (): Category[] => {
  if (typeof window === "undefined") return []
  try {
    const cached = localStorage.getItem(CATEGORIES_STORAGE_KEY)
    if (cached) return JSON.parse(cached)
  } catch (e) {}
  return []
}

const setCachedCategories = (categories: Category[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
  } catch (e) {}
}

const categoriesFetcher = async (): Promise<Category[]> => {
  const data = await categoryService.getCategories()
  setCachedCategories(data)
  return data
}

interface CategoriesPageClientProps {
  allCategories: Category[]
}

const LogoPlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative h-8 w-8 sm:h-10 sm:w-10"
    >
      <Image
        src="/images/screenshot-20from-202025-02-18-2013-30-22.png"
        alt="Loading"
        fill
        className="object-contain"
        priority
      />
    </motion.div>
  </div>
)

const CategoryImage = ({
  src,
  alt,
  isPriority,
}: {
  src?: string
  alt: string
  isPriority: boolean
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true)
    // Add a small delay to show the smooth transition
    setTimeout(() => {
      setShowPlaceholder(false)
    }, 300)
  }

  // Handle image load error
  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  // Reset states when src changes
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
    setShowPlaceholder(true)
  }, [src])

  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <LogoPlaceholder />
      </div>
    )
  }

  return (
    <div className="w-full h-full relative bg-white">
      {/* Logo placeholder shown while loading - same as flash sales */}
      <AnimatePresence>
        {(showPlaceholder || imageError) && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.1,
              transition: { duration: 0.5, ease: "easeInOut" },
            }}
            className="absolute inset-0 z-10"
          >
            <LogoPlaceholder />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual image with fade-in effect */}
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{
          opacity: imageLoaded ? 1 : 0,
          scale: imageLoaded ? 1 : 1.1,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading={isPriority ? "eager" : "lazy"}
          decoding={isPriority ? "sync" : "async"}
          fetchPriority={isPriority ? "high" : "auto"}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </motion.div>
    </div>
  )
}

export default function CategoriesPageClient({ allCategories: initialCategories }: CategoriesPageClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")

  const { data: categories = [], isLoading } = useSWR<Category[]>("all-categories-page", categoriesFetcher, {
    fallbackData: initialCategories.length > 0 ? initialCategories : getCachedCategories(),
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
    revalidateIfStale: true,
  })

  useEffect(() => {
    if (categories.length > 0) {
      const imagesToPreload = categories.slice(0, 14)
      imagesToPreload.forEach((cat) => {
        if (cat.image_url) {
          if (typeof window !== "undefined") {
            const img = new window.Image()
            img.src = cat.image_url
          }
        }
      })
    }
  }, [categories])

  // Subscribe to websocket events
  useEffect(() => {
    const handleCategoryUpdate = async () => {
      categoryService.clearCache()
      localStorage.removeItem(CATEGORIES_STORAGE_KEY)
    }

    const unsub1 = websocketService.on("category_updated", handleCategoryUpdate)
    const unsub2 = websocketService.on("category_created", handleCategoryUpdate)

    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  const filteredCategories = useMemo(() => {
    return categories
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
  }, [categories, searchQuery, sortBy])

  const handleCategoryClick = useCallback(
    (category: Category) => {
      router.push(`/category/${category.slug}`)
    },
    [router],
  )

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
                  transition={{ duration: 0.15, delay: Math.min(index * 0.005, 0.1) }} // Even faster animations
                >
                  <div
                    onClick={() => handleCategoryClick(category)}
                    className="group cursor-pointer h-full overflow-hidden bg-white border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 rounded-lg"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#f5f5f7]">
                      <CategoryImage src={category.image_url} alt={category.name} isPriority={index < 14} />
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
