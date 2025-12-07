"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { ChevronRight, ChevronLeft, Sparkles, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import type { Product } from "@/types"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useNewArrivals } from "@/hooks/use-swr-new-arrivals"
import { Skeleton } from "@/components/ui/skeleton"

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
            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
              star <= Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : star - 0.5 <= rating
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
      {reviewCount > 0 && (
        <span className="text-[10px] sm:text-xs text-gray-400">({reviewCount.toLocaleString()})</span>
      )}
    </div>
  )
}

const ProductCard = ({ product, isMobile }: { product: Product; isMobile: boolean }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  const discountPercentage = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : product.compare_at_price && product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
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

  const imageUrl = product.image_urls?.[0] || product.image_url || product.thumbnail_url || "/placeholder.svg"
  const rating = product.rating || 3 + Math.random() * 2
  const reviewCount = product.review_count || Math.floor(Math.random() * 5000) + 100
  const displayPrice = product.sale_price || product.price || 0
  const originalPrice = product.sale_price ? product.price : product.compare_at_price

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

            {/* Discount Badge - Dark Cherry Red */}
            {discountPercentage > 0 && (
              <div className="absolute top-1 left-1 bg-[#8B1538] text-white text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-sm z-20">
                -{discountPercentage}%
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className={isMobile ? "p-2" : "p-3"}>
            <h3
              className={`text-gray-800 line-clamp-2 leading-tight mb-1.5 ${isMobile ? "text-xs min-h-[32px]" : "text-sm min-h-[40px]"}`}
            >
              {product.name}
            </h3>

            {/* Price - Dark Cherry Red */}
            <div className="mb-1.5">
              <span className={`font-semibold text-[#8B1538] ${isMobile ? "text-sm" : "text-base"}`}>
                KSh {displayPrice.toLocaleString()}
              </span>
              {originalPrice && originalPrice > displayPrice && (
                <span className={`text-gray-400 line-through ml-1.5 ${isMobile ? "text-[10px]" : "text-xs"}`}>
                  KSh {originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            <StarRating rating={rating} reviewCount={reviewCount} />
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

const NewArrivalsSkeleton = ({ isMobile }: { isMobile: boolean }) => (
  <section className="w-full mb-4 sm:mb-8">
    <div className="w-full">
      <div className="bg-[#8B1538] text-white flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className={`bg-white/20 rounded animate-pulse ${isMobile ? "h-4 w-16" : "h-5 w-20"}`}></div>
        </div>
        <div className={`bg-white/20 rounded animate-pulse ${isMobile ? "h-4 w-12" : "h-5 w-16"}`}></div>
      </div>

      <div className={isMobile ? "p-1" : "p-2"}>
        <div className="flex gap-[1px] bg-gray-100">
          {[...Array(isMobile ? 4 : 6)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`bg-white flex-shrink-0 ${isMobile ? "p-2 w-[calc(25%-1px)]" : "p-4 w-[200px]"}`}
            >
              <div
                className={`w-full mb-2 bg-[#f5f5f7] flex items-center justify-center relative overflow-hidden ${isMobile ? "aspect-square" : "aspect-[4/3]"}`}
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
                  className="relative z-10"
                >
                  <div className={`relative ${isMobile ? "h-6 w-6" : "h-8 w-8"}`}>
                    <Image
                      src="/images/screenshot-20from-202025-02-18-2013-30-22.png"
                      alt="Loading"
                      fill
                      className="object-contain opacity-60"
                    />
                  </div>
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

export function NewArrivals() {
  const { newArrivals, isLoading, mutate } = useNewArrivals()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const isMobile = useMediaQuery("(max-width: 640px)")
  const isSmallMobile = useMediaQuery("(max-width: 480px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")

  const itemsPerView = isSmallMobile ? 3 : isMobile ? 3 : isTablet ? 5 : 6
  const mobileItemWidth = "calc((100vw - 32px) / 3)"

  const maxIndex = Math.max(0, newArrivals.length - itemsPerView)

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
      setHoverSide(x < width / 2 ? "left" : "right")
    },
    [isDragging, isMobile],
  )

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) setIsHovering(true)
  }, [isMobile])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setHoverSide(null)
  }, [])

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isMobile) return
      setIsDragging(false)
      const threshold = 50
      const velocity = info.velocity.x
      const offset = info.offset.x

      if (Math.abs(offset) > threshold || Math.abs(velocity) > 300) {
        if (offset > 0 || velocity > 0) {
          if (currentIndex > 0) goToPrevious()
        } else {
          if (currentIndex < maxIndex) goToNext()
        }
      }
    },
    [currentIndex, maxIndex, goToPrevious, goToNext, isMobile],
  )

  const handleViewAll = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/new-arrivals")
  }

  if (isLoading) {
    return <NewArrivalsSkeleton isMobile={isMobile} />
  }

  if (newArrivals.length === 0) {
    return null
  }

  return (
    <section className="w-full mb-4 sm:mb-8">
      <div className="w-full">
        {/* Header - Dark Cherry Red matching reference */}
        <div className="bg-[#8B1538] text-white flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Sparkles className={`text-yellow-300 ${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
            <h2 className={`font-bold whitespace-nowrap ${isMobile ? "text-sm" : "text-base sm:text-lg"}`}>
              {isMobile ? "New Arrivals" : "New Arrivals | Fresh Collection!"}
            </h2>
          </div>

          <button
            onClick={handleViewAll}
            className={`flex items-center gap-0.5 sm:gap-1 font-medium hover:underline whitespace-nowrap ${
              isMobile ? "text-xs" : "text-sm"
            }`}
          >
            See All
            <ChevronRight className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>
        </div>

        {/* Carousel Container */}
        <div className={isMobile ? "p-1" : "p-2"}>
          <div
            ref={carouselRef}
            className={`relative bg-gray-100 ${isMobile ? "overflow-x-auto overflow-y-hidden scrollbar-hide" : "overflow-hidden"}`}
            style={{ maxWidth: "100%", width: "100%" }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {isMobile ? (
              <div
                className="flex gap-2 w-max px-2"
                style={{
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: "8px",
                }}
              >
                {newArrivals.map((product, index) => (
                  <div
                    key={product.id}
                    style={{
                      width: mobileItemWidth,
                      flexShrink: 0,
                      scrollSnapAlign: "start",
                    }}
                  >
                    <ProductCard product={product} isMobile={isMobile} />
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                className="flex gap-[1px]"
                animate={{ x: `-${currentIndex * (100 / itemsPerView)}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
              >
                {newArrivals.map((product) => (
                  <div key={product.id} className="flex-shrink-0" style={{ width: `${100 / itemsPerView}%` }}>
                    <ProductCard product={product} isMobile={isMobile} />
                  </div>
                ))}
              </motion.div>
            )}

            {/* Navigation Arrows - Desktop only */}
            {!isMobile && newArrivals.length > itemsPerView && (
              <>
                <AnimatePresence>
                  {isHovering && hoverSide === "left" && currentIndex > 0 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={goToPrevious}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white hover:scale-110 transition-all z-20"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </motion.button>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {isHovering && hoverSide === "right" && currentIndex < maxIndex && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={goToNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white hover:scale-110 transition-all z-20"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
