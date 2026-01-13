"use client"

import type React from "react"
import { useState, useEffect, useCallback, memo, useRef } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import Link from "next/link"
import { ChevronRight, ChevronLeft, Zap, Star } from "lucide-react"
import Image from "next/image"
import type { Product } from "@/types"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cloudinaryService } from "@/services/cloudinary-service"
import type { FlashSaleEvent, FlashSaleProduct } from "@/lib/server/get-flash-sale-products"

const LogoPlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative h-12 w-12 sm:h-16 sm:w-16"
    >
      <Image src="/logo.png" alt="Loading" fill className="object-contain" />
    </motion.div>
  </div>
)

const StarRating = ({ rating = 4 }: { rating?: number }) => {
  return (
    <div className="flex items-center">
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
    </div>
  )
}

const StockIndicator = ({
  itemsLeft,
  progressPercentage,
  isSoldOut,
}: {
  itemsLeft: number
  progressPercentage: number
  isSoldOut: boolean
}) => {
  return (
    <div className="mt-1.5 space-y-1">
      <p className="text-[10px] sm:text-xs font-medium text-gray-800">
        {isSoldOut ? <span className="text-red-600 font-semibold">Sold Out</span> : <span>{itemsLeft} items left</span>}
      </p>
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#8B1538] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: isSoldOut ? "0%" : `${Math.max(progressPercentage, 5)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

const getProductImageUrl = (product: Product): string => {
  if (product.image_urls && product.image_urls.length > 0) {
    if (typeof product.image_urls[0] === "string" && !product.image_urls[0].startsWith("http")) {
      return cloudinaryService.generateOptimizedUrl(product.image_urls[0])
    }
    return product.image_urls[0]
  }
  if (product.thumbnail_url) {
    if (typeof product.thumbnail_url === "string" && !product.thumbnail_url.startsWith("http")) {
      return cloudinaryService.generateOptimizedUrl(product.thumbnail_url)
    }
    return product.thumbnail_url
  }
  if (product.images && product.images.length > 0 && product.images[0].url) {
    if (typeof product.images[0].url === "string" && !product.images[0].url.startsWith("http")) {
      return cloudinaryService.generateOptimizedUrl(product.images[0].url)
    }
    return product.images[0].url
  }
  return ""
}

const ProductCard = memo(({ product, isMobile }: { product: FlashSaleProduct | Product; isMobile: boolean }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  const discountPercentage = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0

  const flashProduct = product as FlashSaleProduct
  const itemsLeft = flashProduct.items_left ?? product.stock ?? 100
  const progressPercentage = flashProduct.progress_percentage ?? (product.stock ? (product.stock / 100) * 100 : 100)
  const isAlmostGone = flashProduct.is_almost_gone ?? (itemsLeft > 0 && itemsLeft <= 5)
  const isSoldOut = flashProduct.is_sold_out ?? itemsLeft === 0

  const rating = product.rating || 3 + Math.random() * 2

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

  return (
    <Link href={`/product/${product.slug || product.id}`} prefetch={false}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2 }}
        className="h-full"
      >
        <div
          className={`group h-full overflow-hidden bg-white border-r border-gray-100 transition-all duration-200 hover:shadow-sm ${isSoldOut ? "opacity-75" : ""}`}
        >
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
              {imageUrl && (
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
              )}
            </motion.div>
            {product.sale_price && discountPercentage > 0 && (
              <div className="absolute top-1 left-1 bg-[#8B1538] text-white text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-sm z-20">
                -{discountPercentage}%
              </div>
            )}
            {isAlmostGone && !isSoldOut && (
              <div className="absolute bottom-1.5 left-1.5 bg-red-500 text-white text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-sm z-20 animate-pulse">
                Almost Gone!
              </div>
            )}
            {isSoldOut && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                <span className="bg-red-600 text-white text-xs sm:text-sm font-bold px-3 py-1 rounded">SOLD OUT</span>
              </div>
            )}
          </div>
          <div className={isMobile ? "p-2" : "p-3"}>
            <h3
              className={`text-gray-800 line-clamp-2 leading-tight mb-1.5 ${isMobile ? "text-xs min-h-[32px]" : "text-sm min-h-[40px]"}`}
            >
              {product.name}
            </h3>
            <div className="mb-1.5">
              <span className={`font-semibold text-[#8B1538] ${isMobile ? "text-sm" : "text-base"}`}>
                KSh {(product.sale_price || product.price).toLocaleString()}
              </span>
              {product.sale_price && (
                <span className={`text-gray-400 line-through ml-1.5 ${isMobile ? "text-[10px]" : "text-xs"}`}>
                  KSh {product.price.toLocaleString()}
                </span>
              )}
            </div>
            <StarRating rating={rating} />
            <StockIndicator itemsLeft={itemsLeft} progressPercentage={progressPercentage} isSoldOut={isSoldOut} />
          </div>
        </div>
      </motion.div>
    </Link>
  )
})

ProductCard.displayName = "ProductCard"

interface FlashSalesProps {
  products?: (FlashSaleProduct | Product)[]
  event?: FlashSaleEvent | null
}

export function FlashSales({ products: initialProducts, event }: FlashSalesProps) {
  const products = initialProducts || []

  const getInitialTimeLeft = () => {
    if (event?.time_remaining) {
      const total = event.time_remaining
      return {
        hours: Math.floor(total / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
      }
    }
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)
    const total = Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000))
    return {
      hours: Math.floor(total / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
    }
  }

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft)
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

  const maxIndex = Math.max(0, products.length - itemsPerView)

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
          if (currentIndex > 0) goToPrevious()
        } else {
          if (currentIndex < maxIndex) goToNext()
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
          if (delta > 0 && currentIndex < maxIndex) {
            goToNext()
          } else if (delta < 0 && currentIndex > 0) {
            goToPrevious()
          }
        }
      }
    }
    currentCarousel.addEventListener("wheel", handleWheelEvent, { passive: false })
    return () => currentCarousel.removeEventListener("wheel", handleWheelEvent)
  }, [currentIndex, maxIndex, goToPrevious, goToNext, isMobile])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const total = prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1
        if (total <= 0) {
          return { hours: 23, minutes: 59, seconds: 59 }
        }
        return {
          hours: Math.floor(total / 3600),
          minutes: Math.floor((total % 3600) / 60),
          seconds: total % 60,
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleViewAll = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/flash-sales")
  }

  if (!products.length) {
    return null
  }

  return (
    <section className="w-full mb-4 sm:mb-8">
      <div className="w-full">
        <div className="bg-[#8B1538] text-white flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Zap className={`text-yellow-300 fill-yellow-300 ${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
            <h2 className={`font-bold whitespace-nowrap ${isMobile ? "text-sm" : "text-base sm:text-lg"}`}>
              {isMobile ? "Flash Sales" : "Flash Sales | Hot Deals!"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isMobile ? "text-xs" : "text-sm"}`}>Time Left:</span>
            <div className="flex gap-1">
              <div className="bg-white/20 rounded px-1.5 py-0.5 min-w-[24px] text-center">
                <span className="text-xs font-mono">{String(timeLeft.hours).padStart(2, "0")}</span>
              </div>
              <span className="text-xs">:</span>
              <div className="bg-white/20 rounded px-1.5 py-0.5 min-w-[24px] text-center">
                <span className="text-xs font-mono">{String(timeLeft.minutes).padStart(2, "0")}</span>
              </div>
              <span className="text-xs">:</span>
              <div className="bg-white/20 rounded px-1.5 py-0.5 min-w-[24px] text-center">
                <span className="text-xs font-mono">{String(timeLeft.seconds).padStart(2, "0")}</span>
              </div>
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
        </div>

        <div className={isMobile ? "p-1" : "p-2"}>
          <div
            ref={carouselRef}
            className={`relative bg-gray-100 ${isMobile ? "overflow-hidden" : "overflow-hidden"}`}
            style={{
              maxWidth: isMobile ? "100%" : undefined,
              width: isMobile ? "100%" : undefined,
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {isMobile ? (
              <div
                className="flex gap-1 w-full overflow-x-auto scrollbar-hide px-2"
                style={{
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: "8px",
                }}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 pointer-events-auto"
                    style={{
                      width: mobileItemWidth,
                      minWidth: isSmallMobile ? "100px" : "110px",
                      maxWidth: "130px",
                      scrollSnapAlign: "start",
                    }}
                  >
                    <ProductCard product={product as FlashSaleProduct} isMobile={true} />
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                className="flex gap-[1px]"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                animate={{
                  x: `-${currentIndex * (isTablet ? 20 : 16.666)}%`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }}
                style={{
                  cursor: isDragging ? "grabbing" : "grab",
                }}
              >
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    className="flex-shrink-0 pointer-events-auto"
                    style={{ width: `${isTablet ? 20 : 16.666}%` }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ProductCard product={product as FlashSaleProduct} isMobile={false} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            <AnimatePresence>
              {!isMobile && isHovering && !isDragging && hoverSide === "left" && currentIndex > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white hover:scale-110 transition-all z-20"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </motion.button>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!isMobile && isHovering && !isDragging && hoverSide === "right" && currentIndex < maxIndex && (
                <motion.button
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white hover:scale-110 transition-all z-20"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FlashSales
