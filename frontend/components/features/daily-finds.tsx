"use client"

import type React from "react"
import { useState, useEffect, useCallback, memo, useRef } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import Link from "next/link"
import { ChevronRight, ChevronLeft, Sparkles, Star } from "lucide-react"
import Image from "next/image"
import type { Product as BaseProduct } from "@/types"
import { productService } from "@/services/product"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cloudinaryService } from "@/services/cloudinary-service"

type Product = BaseProduct & { color_options?: string[]; stock?: number; rating?: number; reviews_count?: number }

function getProductImageUrl(product: Product): string {
  // Check for image_urls array first
  if (product.image_urls && product.image_urls.length > 0) {
    // If it's a Cloudinary public ID, generate URL:
    if (typeof product.image_urls[0] === "string" && !product.image_urls[0].startsWith("http")) {
      return cloudinaryService.generateOptimizedUrl(product.image_urls[0])
    }
    return product.image_urls[0]
  }

  // Then check for thumbnail_url
  if (product.thumbnail_url) {
    // If it's a Cloudinary public ID, generate URL:
    if (typeof product.thumbnail_url === "string" && !product.thumbnail_url.startsWith("http")) {
      return cloudinaryService.generateOptimizedUrl(product.thumbnail_url)
    }
    return product.thumbnail_url
  }

  // Check for images array with url property
  if (product.images && product.images.length > 0 && product.images[0].url) {
    // If it's a Cloudinary public ID, generate URL:
    if (typeof product.images[0].url === "string" && !product.images[0].url.startsWith("http")) {
      return cloudinaryService.generateOptimizedUrl(product.images[0].url)
    }
    return product.images[0].url
  }

  // Fallback to placeholder
  return "/placeholder.svg?height=300&width=300"
}

const LogoPlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative h-12 w-12 sm:h-16 sm:w-16"
    >
      <Image
        src="/images/screenshot-20from-202025-02-18-2013-30-22.png"
        alt="Loading"
        fill
        className="object-contain"
      />
    </motion.div>
  </div>
)

const StarRating = ({ rating = 4, reviewCount = 0 }: { rating?: number; reviewCount?: number }) => {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-2.5 w-2.5 ${
              star <= Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : star - 0.5 <= rating
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
      {reviewCount > 0 && <span className="text-[9px] text-gray-400">({reviewCount.toLocaleString()})</span>}
    </div>
  )
}

const ProductCard = memo(({ product, isMobile }: { product: Product; isMobile: boolean }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  const discountPercentage = product.sale_price
    ? Math.round(((product.price - (product.sale_price as number)) / product.price) * 100)
    : 0

  const handleImageLoad = () => {
    setImageLoaded(true)
    setTimeout(() => setShowPlaceholder(false), 300)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
    setShowPlaceholder(true)
  }, [product.id])

  const imageUrl = getProductImageUrl(product)

  // Generate random rating and reviews for demo
  const rating = product.rating || 3 + Math.random() * 2
  const reviewCount = product.reviews_count || Math.floor(Math.random() * 5000) + 100

  return (
    <Link href={`/product/${product.slug || product.id}`} prefetch={false}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2 }}
        className="h-full"
      >
        <div className="group h-full overflow-hidden bg-white border-r border-gray-100 transition-all duration-200 hover:shadow-sm">
          {/* Image Container - Square aspect ratio */}
          <div className="relative aspect-square overflow-hidden bg-[#f8f8f8]">
            <AnimatePresence>
              {(showPlaceholder || imageError) && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  className="absolute inset-0 z-10"
                >
                  <LogoPlaceholder />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={product.name}
                fill
                sizes={isMobile ? "25vw" : "16vw"}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </motion.div>

            {/* Discount Badge - Orange like Kilimall */}
            {product.sale_price && discountPercentage > 0 && (
              <div className="absolute top-1 left-1 bg-[#f85606] text-white text-[9px] font-medium px-1 py-0.5 rounded-sm z-20">
                -{discountPercentage}%
              </div>
            )}
          </div>

          {/* Product Info - Compact like product-grid */}
          <div className={isMobile ? "p-1.5" : "p-2"}>
            {/* Product Name - 2 lines max */}
            <h3
              className={`text-gray-800 line-clamp-2 leading-tight mb-1 ${isMobile ? "text-[10px] min-h-[24px]" : "text-xs min-h-[32px]"}`}
            >
              {product.name}
            </h3>

            {/* Price - Orange/Red like Kilimall */}
            <div className="mb-1">
              <span className={`font-semibold text-[#f85606] ${isMobile ? "text-xs" : "text-sm"}`}>
                KSh {(product.sale_price || product.price).toLocaleString()}
              </span>
              {product.sale_price && (
                <span className={`text-gray-400 line-through ml-1 ${isMobile ? "text-[8px]" : "text-[10px]"}`}>
                  KSh {product.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Star Rating */}
            <StarRating rating={rating} reviewCount={reviewCount} />
          </div>
        </div>
      </motion.div>
    </Link>
  )
})

ProductCard.displayName = "ProductCard"

const DailyFindsSkeleton = ({ isMobile }: { isMobile: boolean }) => (
  <section className="w-full mb-4 sm:mb-8">
    <div className="w-full">
      <div className="bg-cherry-900 text-white flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className={`bg-white/20 rounded animate-pulse ${isMobile ? "h-4 w-16" : "h-5 w-20"}`}></div>
        </div>
        <div className={`bg-white/20 rounded animate-pulse ${isMobile ? "h-4 w-12" : "h-5 w-16"}`}></div>
      </div>

      <div className={isMobile ? "p-1" : "p-2"}>
        <div className="flex gap-[1px] bg-gray-100">
          {[...Array(isMobile ? 3 : 6)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`bg-white flex-shrink-0 ${isMobile ? "p-2 w-[calc(33.333%-1px)]" : "p-4 w-[180px]"}`}
            >
              <div
                className={`w-full mb-2 bg-[#f5f5f7] flex items-center justify-center relative overflow-hidden ${isMobile ? "aspect-square" : "aspect-square"}`}
              >
                <motion.div
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-[#f5f5f7] via-[#e0e0e3] to-[#f5f5f7] bg-[length:400%_400%]"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="text-center z-10"
                >
                  <Sparkles className={`text-cherry-400 mx-auto ${isMobile ? "h-4 w-4" : "h-6 w-6"}`} />
                </motion.div>
              </div>
              <Skeleton className={`w-1/3 mb-2 bg-[#f5f5f7] rounded-full ${isMobile ? "h-3" : "h-4"}`} />
              <Skeleton className={`w-2/3 bg-[#f5f5f7] rounded-full ${isMobile ? "h-3" : "h-4"}`} />
              <div className="flex gap-1.5 pt-1">
                <Skeleton className={`bg-[#f5f5f7] rounded-full ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
)

export function DailyFinds() {
  const [dailyFinds, setDailyFinds] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const isMobile = useMediaQuery("(max-width: 640px)")
  const isSmallMobile = useMediaQuery("(max-width: 480px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")

  const itemsPerView = isSmallMobile ? 3 : isMobile ? 3 : isTablet ? 5 : 6
  const mobileItemWidth = "calc((100vw - 32px) / 3)"
  const itemWidthPx = isSmallMobile ? 110 : isMobile ? 120 : 180

  const maxIndex = Math.max(0, dailyFinds.length - itemsPerView)

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }, [maxIndex])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!carouselRef.current || isDragging || isMobile) return

      const rect = carouselRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width
      const leftHalf = x < width / 2

      setHoverSide(leftHalf ? "left" : "right")
    },
    [isDragging, isMobile],
  )

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) {
      setIsHovering(true)
    }
  }, [isMobile])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setHoverSide(null)
  }, [])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile) return

      const touch = e.touches[0]
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
      })
      setTouchEnd(null)
      setIsDragging(true)
    },
    [isMobile],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || !touchStart) return

      const touch = e.touches[0]
      setTouchEnd({
        x: touch.clientX,
        y: touch.clientY,
      })

      const deltaX = Math.abs(touch.clientX - touchStart.x)
      const deltaY = Math.abs(touch.clientY - touchStart.y)

      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault()
      }
    },
    [isMobile, touchStart],
  )

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !touchStart || !touchEnd) {
      setIsDragging(false)
      return
    }

    const deltaX = touchStart.x - touchEnd.x
    const deltaY = touchStart.y - touchEnd.y
    const minSwipeDistance = 50

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        if (currentIndex < maxIndex) {
          goToNext()
        }
      } else {
        if (currentIndex > 0) {
          goToPrevious()
        }
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
    setIsDragging(false)
  }, [isMobile, touchStart, touchEnd, currentIndex, maxIndex, goToPrevious, goToNext])

  const handleDragStart = useCallback(() => {
    if (isMobile) return
    setIsDragging(true)
    setHoverSide(null)
  }, [isMobile])

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isMobile) return
      setIsDragging(false)

      const threshold = 50
      const velocity = info.velocity.x
      const offset = info.offset.x

      if (Math.abs(offset) > threshold || Math.abs(velocity) > 300) {
        if (offset > 0 || velocity > 0) {
          if (currentIndex > 0) {
            goToPrevious()
          }
        } else {
          if (currentIndex < maxIndex) {
            goToNext()
          }
        }
      }
    },
    [currentIndex, maxIndex, goToPrevious, goToNext, isMobile],
  )

  useEffect(() => {
    const currentCarousel = carouselRef.current
    if (!currentCarousel || isMobile) return

    const handleWheelEvent = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        e.preventDefault()

        const threshold = 10
        const delta = e.deltaX || e.deltaY

        if (Math.abs(delta) > threshold) {
          if (delta > 0) {
            if (currentIndex < maxIndex) {
              goToNext()
            }
          } else {
            if (currentIndex > 0) {
              goToPrevious()
            }
          }
        }
      }
    }

    currentCarousel.addEventListener("wheel", handleWheelEvent, { passive: false })
    return () => currentCarousel.removeEventListener("wheel", handleWheelEvent)
  }, [currentIndex, maxIndex, goToPrevious, goToNext, isMobile])

  useEffect(() => {
    const controller = new AbortController()

    const fetchData = async () => {
      try {
        await fetchDailyFinds(setLoading, setError, setDailyFinds)
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error in daily finds fetch:", error)
        }
      }
    }

    fetchData()

    return () => {
      controller.abort()
    }
  }, [fetchDailyFinds])

  useEffect(() => {
    const handleProductImagesUpdated = (event: CustomEvent) => {
      const { productId } = event.detail
      console.log("[v0] Daily Finds: Product images updated event received for product:", productId)

      setDailyFinds([])
      setLoading(true)

      setTimeout(() => {
        fetchDailyFinds(setLoading, setError, setDailyFinds)
      }, 500)
    }

    window.addEventListener("productImagesUpdated", handleProductImagesUpdated as EventListener)

    return () => {
      window.removeEventListener("productImagesUpdated", handleProductImagesUpdated as EventListener)
    }
  }, [fetchDailyFinds])

  const handleViewAll = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/daily-finds")
  }

  if (loading) {
    return <DailyFindsSkeleton isMobile={isMobile} />
  }

  if (error) {
    return (
      <section className="w-full mb-4 sm:mb-8">
        <div className="w-full">
          <div className="bg-cherry-900 text-white flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <Sparkles className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
              <span className={`font-semibold ${isMobile ? "text-xs" : "text-sm"}`}>Daily Finds</span>
            </div>
          </div>
          <div className="p-6 bg-white border border-t-0 border-gray-100 text-center">
            <p className="text-sm text-gray-600 mb-3">{error}</p>
            <button
              onClick={() => fetchDailyFinds(setLoading, setError, setDailyFinds)}
              className="text-sm text-[#f85606] hover:underline font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (dailyFinds.length === 0) {
    return null
  }

  return (
    <section className="w-full mb-4 sm:mb-8">
      <div className="w-full">
        {/* Header */}
        <div className="bg-cherry-900 text-white flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Sparkles className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
            <span className={`font-semibold ${isMobile ? "text-xs" : "text-sm"}`}>Daily Finds</span>
          </div>
          <button
            onClick={handleViewAll}
            className={`flex items-center gap-0.5 font-medium hover:underline ${isMobile ? "text-[10px]" : "text-xs"}`}
          >
            See All
            <ChevronRight className={isMobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </button>
        </div>

        {/* Carousel Container */}
        <div
          ref={carouselRef}
          className="relative bg-white border border-t-0 border-gray-100 overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Desktop Navigation Arrows */}
          {!isMobile && (
            <>
              <AnimatePresence>
                {isHovering && hoverSide === "left" && currentIndex > 0 && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/95 rounded-full p-1.5 shadow-lg hover:bg-white transition-colors"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-700" />
                  </motion.button>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isHovering && hoverSide === "right" && currentIndex < maxIndex && (
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/95 rounded-full p-1.5 shadow-lg hover:bg-white transition-colors"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-700" />
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Products */}
          {isMobile ? (
            // Mobile: Native scroll
            <div
              className="flex overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {dailyFinds.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0"
                  style={{ width: mobileItemWidth, scrollSnapAlign: "start" }}
                >
                  <ProductCard product={product} isMobile={isMobile} />
                </div>
              ))}
            </div>
          ) : (
            // Desktop: Animated carousel
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              className="flex cursor-grab active:cursor-grabbing"
              animate={{ x: -currentIndex * itemWidthPx }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {dailyFinds.map((product) => (
                <div key={product.id} className="flex-shrink-0" style={{ width: `${itemWidthPx}px` }}>
                  <ProductCard product={product} isMobile={isMobile} />
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}

const fetchDailyFinds = async (setLoading: any, setError: any, setDailyFinds: any) => {
  try {
    setLoading(true)
    setError(null)

    const products = await productService.getDailyFindProducts(12)

    if (products && products.length > 0) {
      const processedProducts = products.map((product: any) => ({
        ...product,
        image_urls: (product.image_urls || []).map((url: any) => {
          if (typeof url === "string" && !url.startsWith("http")) {
            return cloudinaryService.generateOptimizedUrl(url)
          }
          return url
        }),
      }))
      setDailyFinds(processedProducts.slice(0, 12))
    } else {
      setDailyFinds([])
    }
  } catch (error) {
    console.error("Error fetching daily finds:", error)
    setError("Failed to load daily finds")
  } finally {
    setLoading(false)
  }
}

export default DailyFinds
