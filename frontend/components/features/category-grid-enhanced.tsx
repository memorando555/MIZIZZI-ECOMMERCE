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

const getCachedCategories = (): Category[] => {
  if (typeof window === "undefined") return []
  try {
    const cached = localStorage.getItem(CATEGORIES_STORAGE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.warn("[v0] Failed to parse cached categories")
  }
  return []
}

const setCachedCategories = (categories: Category[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
    localStorage.setItem(CATEGORIES_TIMESTAMP_KEY, Date.now().toString())
  } catch (e) {
    console.warn("[v0] Failed to cache categories")
  }
}

const categoriesFetcher = async (): Promise<Category[]> => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://mizizzi-ecommerce-1.onrender.com"

  const response = await fetch(`${baseUrl}/api/categories?parent_id=null&per_page=100`, {
    headers: {
      "Cache-Control": "no-cache",
    },
  })

  if (!response.ok) throw new Error("Failed to fetch categories")

  const data = await response.json()
  let categories = data?.items ?? data ?? []

  if (!Array.isArray(categories)) {
    categories = []
  }

  // Normalize image URLs
  categories = categories.map((cat: any) => ({
    ...cat,
    image_url: normalizeImageUrl(cat.image_url),
    banner_url: normalizeImageUrl(cat.banner_url),
  }))

  // Cache to localStorage for instant loading next time
  setCachedCategories(categories)

  return categories
}

const normalizeImageUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined
  if (url.startsWith("http") || url.startsWith("data:")) return url
  if (url.startsWith("/")) {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://mizizzi-ecommerce-1.onrender.com"
    return `${baseUrl}${url}`
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
  <div className="flex-shrink-0 min-w-[150px] sm:min-w-[170px] md:min-w-[190px] flex-1">
    <div className="relative overflow-hidden rounded-lg w-full h-full bg-white shadow-md">
      <div className="aspect-square w-full overflow-hidden bg-white">
        <LogoPlaceholder />
      </div>
      <div className="absolute bottom-0 left-0 w-full p-3 space-y-2">
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
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  const imageUrl = src || "/abstract-categories.png"

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

  return (
    <div className="aspect-square w-full overflow-hidden bg-white relative">
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
          src={imageUrl || "/placeholder.svg"}
          alt={alt}
          className="h-full w-full object-cover"
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
      className="flex-shrink-0 min-w-[150px] sm:min-w-[170px] md:min-w-[190px] flex-1"
      prefetch={true}
    >
      <motion.div
        className="group relative overflow-hidden rounded-lg w-full h-full bg-white shadow-md transition-all duration-300"
        whileHover={{ scale: 1.05, y: -6 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        layout
      >
        <FastCategoryImage src={category.image_url} alt={category.name} isPriority={isPriority} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="absolute bottom-0 left-0 w-full p-3">
          <h3 className="text-sm font-semibold text-white sm:text-base group-hover:text-cherry-200 transition-colors">
            {category.name}
          </h3>
          <div className="flex items-center text-xs text-white/90 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

  const {
    data: categories = [],
    isLoading,
    mutate: refreshCategories,
  } = useSWR<Category[]>("categories-grid", categoriesFetcher, {
    fallbackData: getCachedCategories(),
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
    refreshInterval: 0,
    keepPreviousData: true,
    revalidateIfStale: true,
    revalidateOnMount: true,
  })

  useEffect(() => {
    if (categories.length > 0) {
      const imagesToPreload = categories.slice(0, 6)
      imagesToPreload.forEach((cat) => {
        if (cat.image_url) {
          // Use Image constructor for faster preloading
          const img = new (window.Image as any)()
          img.src = cat.image_url

          // Also add link preload hint
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
  }, [categories])

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
      // Clear localStorage cache
      localStorage.removeItem(CATEGORIES_STORAGE_KEY)
      // Revalidate SWR cache
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

  const showSkeleton = isLoading && memoizedCategories.length === 0

  return (
    <div className="w-full max-w-full">
      <div className="bg-gradient-to-r from-cherry-900 to-cherry-800 py-3 sm:py-4 mb-3 sm:mb-4 sm:rounded-t-lg">
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

      <div className="relative px-2 sm:px-4 group overflow-hidden">
        <div
          ref={carouselRef}
          className="flex overflow-x-auto scrollbar-hide gap-3 sm:gap-4 pb-4 w-full overscroll-x-contain max-w-full"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
          }}
        >
          {showSkeleton
            ? [...Array(6)].map((_, index) => <CategoryCardSkeleton key={`skeleton-${index}`} index={index} />)
            : memoizedCategories.map((category, index) => (
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
