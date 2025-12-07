"use client"

import { useEffect, useRef, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import type { Category } from "@/services/category"
import { websocketService } from "@/services/websocket"
import useSWR from "swr"

const CATEGORIES_STORAGE_KEY = "mizizzi_categories_cache"
const CATEGORIES_TIMESTAMP_KEY = "mizizzi_categories_timestamp"
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

const getCachedCategories = (): Category[] => {
  if (typeof window === "undefined") return []
  try {
    const cached = localStorage.getItem(CATEGORIES_STORAGE_KEY)
    const timestamp = localStorage.getItem(CATEGORIES_TIMESTAMP_KEY)

    if (cached && timestamp) {
      const categories = JSON.parse(cached)
      console.log("[v0] Loaded cached categories:", categories.length, "items")
      console.log(
        "[v0] First few cached categories:",
        categories.slice(0, 3).map((c: Category) => ({ name: c.name, image_url: c.image_url })),
      )

      if (Array.isArray(categories)) {
        categories.slice(0, 10).forEach((cat: Category) => {
          if (cat.image_url) {
            const img = new window.Image()
            img.src = cat.image_url
          }
        })
      }

      return categories
    }
  } catch (e) {
    console.warn("[CategoryCache] Failed to parse cached categories:", e)
  }
  return []
}

const setCachedCategories = (categories: Category[]) => {
  if (typeof window === "undefined") return
  try {
    if (Array.isArray(categories) && categories.length > 0) {
      console.log("[v0] Caching categories:", categories.length, "items")
      console.log(
        "[v0] Categories to cache:",
        categories.slice(0, 3).map((c) => ({ name: c.name, image_url: c.image_url })),
      )
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
      localStorage.setItem(CATEGORIES_TIMESTAMP_KEY, Date.now().toString())
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      try {
        localStorage.removeItem(CATEGORIES_STORAGE_KEY)
        localStorage.removeItem(CATEGORIES_TIMESTAMP_KEY)
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
        localStorage.setItem(CATEGORIES_TIMESTAMP_KEY, Date.now().toString())
      } catch {
        console.warn("[CategoryCache] Failed to cache categories after clearing")
      }
    } else {
      console.warn("[CategoryCache] Failed to cache categories:", e)
    }
  }
}

const isCacheStale = (): boolean => {
  if (typeof window === "undefined") return true
  try {
    const timestamp = localStorage.getItem(CATEGORIES_TIMESTAMP_KEY)
    if (!timestamp) return true
    const age = Date.now() - Number.parseInt(timestamp, 10)
    return age > CACHE_EXPIRY_MS
  } catch {
    return true
  }
}

export const clearCategoriesCache = () => {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(CATEGORIES_STORAGE_KEY)
    localStorage.removeItem(CATEGORIES_TIMESTAMP_KEY)
  } catch (e) {
    console.warn("[CategoryCache] Failed to clear cache:", e)
  }
}

const categoriesFetcher = async (): Promise<Category[]> => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://mizizzi-ecommerce-1.onrender.com"

  console.log("[v0] Fetching categories from:", `${baseUrl}/api/categories?parent_id=null&per_page=100`)

  const response = await fetch(`${baseUrl}/api/categories?parent_id=null&per_page=100`, {
    headers: {
      "Cache-Control": "no-cache",
    },
  })

  if (!response.ok) throw new Error("Failed to fetch categories")

  const data = await response.json()
  console.log("[v0] Raw API response:", data)

  let categories = data?.items ?? data ?? []

  if (!Array.isArray(categories)) {
    categories = []
  }

  console.log(
    "[v0] Categories before normalization:",
    categories.slice(0, 3).map((c: any) => ({ name: c.name, image_url: c.image_url })),
  )

  categories = categories.map((cat: any) => ({
    ...cat,
    image_url: normalizeImageUrl(cat.image_url),
    banner_url: normalizeImageUrl(cat.banner_url),
  }))

  console.log(
    "[v0] Categories after normalization:",
    categories.slice(0, 3).map((c: any) => ({ name: c.name, image_url: c.image_url })),
  )

  setCachedCategories(categories)

  return categories
}

const normalizeImageUrl = (url: string | undefined | null): string | undefined => {
  if (!url || url === "null" || url === "undefined" || url.trim() === "") {
    console.log("[v0] normalizeImageUrl: empty or invalid url:", url)
    return undefined
  }
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url
  }
  if (url.startsWith("/")) {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://mizizzi-ecommerce-1.onrender.com"
    const fullUrl = `${baseUrl}${url}`
    console.log("[v0] normalizeImageUrl: converted relative url", url, "to", fullUrl)
    return fullUrl
  }
  return url
}

const LogoPlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative h-10 w-10 sm:h-12 sm:w-12"
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

const CategoryCardSkeleton = ({ index }: { index: number }) => (
  <div className="flex-shrink-0 min-w-[120px] sm:min-w-[150px] md:min-w-[180px] flex-1">
    <div className="relative overflow-hidden rounded-lg w-full h-full bg-white shadow-md">
      <div className="aspect-square w-full overflow-hidden bg-white">
        <LogoPlaceholder />
      </div>
      <div className="absolute bottom-0 left-0 w-full p-2 sm:p-3 space-y-2">
        <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-gray-300 rounded animate-pulse" />
      </div>
    </div>
  </div>
)

const FastCategoryImage = ({
  src,
  alt,
  isPriority,
}: {
  src?: string
  alt: string
  isPriority: boolean
}) => {
  const hasValidSrc = src && src.trim() !== "" && src !== "null" && src !== "undefined"
  const imageUrl = hasValidSrc ? src : null
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(!hasValidSrc)

  console.log("[v0] FastCategoryImage:", { alt, src, hasValidSrc, imageUrl })

  const handleImageLoad = () => {
    console.log("[v0] Image loaded successfully:", alt, imageUrl)
    setImageLoaded(true)
    setShowPlaceholder(false)
  }

  const handleImageError = () => {
    console.log("[v0] Image failed to load:", alt, imageUrl)
    setImageError(true)
    setImageLoaded(false)
    setShowPlaceholder(true)
  }

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
    setShowPlaceholder(!hasValidSrc)
  }, [src, hasValidSrc])

  if (!imageUrl) {
    return (
      <div className="aspect-square w-full overflow-hidden bg-white relative">
        <LogoPlaceholder />
      </div>
    )
  }

  return (
    <div className="aspect-square w-full overflow-hidden bg-white relative">
      <AnimatePresence>
        {(showPlaceholder || imageError) && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.1,
              transition: { duration: 0.3, ease: "easeInOut" },
            }}
            className="absolute inset-0 z-10"
          >
            <LogoPlaceholder />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={alt}
          className="h-full w-full object-cover"
          loading={isPriority ? "eager" : "lazy"}
          decoding={isPriority ? "sync" : "async"}
          fetchPriority={isPriority ? "high" : "auto"}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    </div>
  )
}

const CategoryCard = ({
  category,
  index,
  isPriority,
}: {
  category: Category
  index: number
  isPriority: boolean
}) => {
  return (
    <Link
      href={`/category/${category.slug}`}
      key={`carousel-${category.id || index}`}
      className="flex-shrink-0 min-w-[120px] sm:min-w-[150px] md:min-w-[180px] flex-1"
      prefetch={true}
    >
      <motion.div
        className="group relative overflow-hidden rounded-lg w-full h-full bg-white shadow-sm transition-all duration-300"
        whileHover={{ scale: 1.05, y: -6 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        layout
      >
        <FastCategoryImage src={category.image_url} alt={category.name} isPriority={isPriority} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="absolute bottom-0 left-0 w-full p-2 sm:p-3">
          <h3 className="text-xs font-semibold text-white sm:text-sm md:text-base group-hover:text-cherry-200 transition-colors">
            {category.name}
          </h3>
          <div className="flex items-center text-xs text-white/90 mt-0.5 sm:mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Shop Now</span>
            <ArrowRight className="ml-1 h-3 w-3" />
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export function CategoryGrid() {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [initialCache] = useState<Category[]>(() => getCachedCategories())

  const {
    data: categories = [],
    isLoading,
    mutate: refreshCategories,
  } = useSWR<Category[]>("categories-grid", categoriesFetcher, {
    fallbackData: initialCache,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
    refreshInterval: 0,
    keepPreviousData: true,
    revalidateIfStale: true,
    revalidateOnMount: true,
  })

  useEffect(() => {
    const categoriesToPreload = initialCache.length > 0 ? initialCache : categories
    if (categoriesToPreload.length > 0) {
      categoriesToPreload.slice(0, 10).forEach((cat) => {
        if (cat.image_url) {
          const img = new window.Image()
          img.src = cat.image_url

          const existingLink = document.querySelector(`link[href="${cat.image_url}"]`)
          if (!existingLink) {
            const link = document.createElement("link")
            link.rel = "preload"
            link.as = "image"
            link.href = cat.image_url
            document.head.appendChild(link)
          }
        }
      })
    }
  }, [initialCache, categories])

  const scrollCarousel = useCallback((direction: "left" | "right") => {
    if (!carouselRef.current) return
    const scrollAmount = carouselRef.current.clientWidth * 0.75
    const currentScroll = carouselRef.current.scrollLeft
    carouselRef.current.scrollTo({
      left: direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount,
      behavior: "smooth",
    })
  }, [])

  useEffect(() => {
    const handleCategoryUpdate = async () => {
      clearCategoriesCache()
      refreshCategories()
    }

    const unsub1 = websocketService.on("category_updated", handleCategoryUpdate)
    const unsub2 = websocketService.on("category_created", handleCategoryUpdate)
    const unsub3 = websocketService.on("category_deleted", handleCategoryUpdate)

    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [refreshCategories])

  const memoizedCategories = useMemo(() => {
    return Array.isArray(categories) ? categories : []
  }, [categories])

  const showSkeleton = isLoading && memoizedCategories.length === 0 && initialCache.length === 0
  const displayCategories = memoizedCategories.length > 0 ? memoizedCategories : initialCache

  return (
    <div className="w-full max-w-full">
      <div className="bg-[#8B1538] py-3 sm:py-4 mb-3 sm:mb-4 sm:rounded-t-lg">
        <div className="flex items-center justify-between px-3 sm:px-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Shop By Category</h2>
          <Link
            href="/categories"
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs sm:text-sm font-medium transition-colors duration-200"
            prefetch={true}
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </div>

      <div className="relative px-1 sm:px-4 group overflow-hidden">
        <div
          ref={carouselRef}
          className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-3 md:gap-4 pb-3 sm:pb-4 w-full overscroll-x-contain max-w-full"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
          }}
        >
          {showSkeleton
            ? [...Array(6)].map((_, index) => <CategoryCardSkeleton key={`skeleton-${index}`} index={index} />)
            : displayCategories.map((category, index) => (
                <CategoryCard
                  key={category.id || `category-${index}`}
                  category={category}
                  index={index}
                  isPriority={index < 6}
                />
              ))}
        </div>

        <motion.button
          onClick={() => scrollCarousel("left")}
          className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-50 hover:shadow-xl z-10"
          whileHover={{ scale: 1.1, x: -4 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-gray-800" />
        </motion.button>

        <motion.button
          onClick={() => scrollCarousel("right")}
          className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-50 hover:shadow-xl z-10"
          whileHover={{ scale: 1.1, x: 4 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-gray-800" />
        </motion.button>
      </div>
    </div>
  )
}
