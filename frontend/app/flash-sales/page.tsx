"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Search, X, Zap, Timer, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import type { Product } from "@/types"
import { productService } from "@/services/product"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Flash sale carousel items with premium product images
const carouselItems = [
  {
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80",
    title: "Flash Sale",
    subtitle: "Up to 70% Off",
    description: "Premium products at unbeatable prices",
  },
  {
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80",
    title: "Lightning Deals",
    subtitle: "New Every Hour",
    description: "Discover fresh deals on top items",
  },
  {
    image: "https://images.unsplash.com/photo-1491553895911-0055uj66f5a?w=1200&q=80",
    title: "Limited Time",
    subtitle: "Extra 30% Off",
    description: "Final clearance on favorites",
  },
]

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState({
    hours: 5,
    minutes: 0,
    seconds: 0,
  })
  const [sortBy, setSortBy] = useState("discount")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Fetch flash sale products
  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        setLoading(true)
        setError(null)
        const products = await productService.getFlashSaleProducts()
        setFlashSales(products)
        setHasMore(products.length >= 20)
      } catch (error) {
        console.error("Error fetching flash sales:", error)
        setError("Failed to load flash sales. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchFlashSales()
  }, [])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const totalSeconds = prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1
        if (totalSeconds <= 0) {
          clearInterval(timer)
          return { hours: 0, minutes: 0, seconds: 0 }
        }
        return {
          hours: Math.floor(totalSeconds / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60),
          seconds: totalSeconds % 60,
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Smooth carousel transition
  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setCurrentSlide(index)
      setTimeout(() => setIsTransitioning(false), 800)
    },
    [isTransitioning],
  )

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % carouselItems.length)
  }, [currentSlide, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + carouselItems.length) % carouselItems.length)
  }, [currentSlide, goToSlide])

  // Carousel auto-rotation with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning) {
        nextSlide()
      }
    }, 6000)
    return () => clearInterval(interval)
  }, [nextSlide, isTransitioning])

  // Load more products
  const loadMore = async () => {
    try {
      setLoading(true)
      const nextPage = page + 1
      const moreProducts = await productService.getFlashSaleProducts()
      if (moreProducts.length === 0) {
        setHasMore(false)
      } else {
        setFlashSales((prev) => [...prev, ...moreProducts])
        setPage(nextPage)
      }
    } catch (error) {
      console.error("Error loading more products:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort products
  const filteredProducts = flashSales
    .filter((product) => {
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        return (a.sale_price || a.price) - (b.sale_price || b.price)
      } else if (sortBy === "price-desc") {
        return (b.sale_price || b.price) - (a.sale_price || a.price)
      } else if (sortBy === "discount") {
        const discountA = a.sale_price ? (a.price - a.sale_price) / a.price : 0
        const discountB = b.sale_price ? (b.price - b.sale_price) / b.price : 0
        return discountB - discountA
      }
      return 0
    })

  // Calculate discount percentage
  const calculateDiscount = (price: number, salePrice: number | null) => {
    if (!salePrice || salePrice >= price) return 0
    return Math.round(((price - salePrice) / price) * 100)
  }

  // Render loading state
  if (loading && flashSales.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container py-8 px-4 sm:px-6 lg:px-8">
          <div className="h-[180px] bg-neutral-200 animate-pulse mb-8 rounded-2xl"></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="aspect-square bg-neutral-100 animate-pulse rounded-xl mb-3"></div>
                <div className="h-3 w-16 bg-neutral-100 rounded-full animate-pulse mb-2"></div>
                <div className="h-4 w-full bg-neutral-100 rounded-full animate-pulse mb-2"></div>
                <div className="h-5 w-20 bg-neutral-100 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render error state
  if (error && flashSales.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900">Flash Sales</h1>
            <Zap className="h-6 w-6 text-red-500 fill-red-500" />
          </div>
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-neutral-900 hover:bg-neutral-800 rounded-full px-6"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">Flash Sales</h1>
              <Zap className="h-6 w-6 text-red-500 fill-red-500" />
            </div>

            <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-medium">Ends Soon</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto sm:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search deals..."
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

        <div className="mb-8 relative overflow-hidden rounded-2xl bg-neutral-900">
          <div className="relative h-[180px] sm:h-[220px] w-full">
            {carouselItems.map((item, index) => (
              <motion.div
                key={index}
                className="absolute inset-0"
                initial={false}
                animate={{
                  opacity: index === currentSlide ? 1 : 0,
                  scale: index === currentSlide ? 1 : 1.02,
                }}
                transition={{
                  opacity: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
                  scale: { duration: 1.2, ease: [0.4, 0, 0.2, 1] },
                }}
                style={{ pointerEvents: index === currentSlide ? "auto" : "none" }}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                  <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: index === currentSlide ? 1 : 0,
                        y: index === currentSlide ? 0 : 20,
                      }}
                      transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <div className="inline-flex items-center gap-1.5 bg-red-500 px-2.5 py-0.5 rounded-full mb-2">
                        <Zap className="h-3 w-3 text-white fill-white" />
                        <span className="text-[10px] font-semibold text-white tracking-wide uppercase">
                          {item.title}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 tracking-tight">{item.subtitle}</h2>
                      <p className="text-xs sm:text-sm text-white/80 max-w-md line-clamp-1">{item.description}</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}

            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    currentSlide === index ? "bg-white w-8" : "bg-white/30 w-1 hover:bg-white/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            <span className="font-medium text-neutral-900">{filteredProducts.length}</span> deals available
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-[160px] text-sm rounded-full border-neutral-200">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discount">Highest Discount</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: index * 0.015 }}
              >
                <Link href={`/product/${product.id}`}>
                  <div className="group h-full overflow-hidden bg-white border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 rounded-lg">
                    <div className="relative aspect-square overflow-hidden bg-[#f5f5f7]">
                      <Image
                        src={product.image_urls?.[0] || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 14vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {product.sale_price && product.sale_price < product.price && (
                        <div className="absolute left-0 top-1.5 bg-red-500 text-white text-[9px] font-semibold px-1.5 py-0.5">
                          -{calculateDiscount(product.price, product.sale_price)}%
                        </div>
                      )}
                    </div>
                    <div className="p-1.5 sm:p-2 space-y-0.5">
                      <span className="inline-block rounded-sm bg-red-50 px-1 py-0.5 text-[8px] sm:text-[9px] font-medium text-red-600">
                        FLASH SALE
                      </span>
                      <h3 className="line-clamp-2 text-[10px] sm:text-xs font-medium text-gray-900 leading-tight">
                        {product.name}
                      </h3>
                      <div className="pt-0.5">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">
                          KSh {(product.sale_price || product.price).toLocaleString()}
                        </span>
                        {product.sale_price && product.sale_price < product.price && (
                          <div className="text-[9px] sm:text-[10px] text-gray-400 line-through">
                            KSh {product.price.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {hasMore && (
          <div className="mt-10 text-center">
            <Button
              onClick={loadMore}
              disabled={loading}
              className="px-8 h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full font-medium transition-all hover:scale-105"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Loading...
                </>
              ) : (
                "Load More Deals"
              )}
            </Button>
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-neutral-300" />
            </div>
            <p className="text-neutral-600 mb-4">No flash deals match your search.</p>
            <Button onClick={() => setSearchQuery("")} variant="outline" className="rounded-full px-6">
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
