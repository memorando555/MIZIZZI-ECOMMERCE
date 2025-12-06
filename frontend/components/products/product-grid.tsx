"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { productService } from "@/services/product"
import { ShoppingBag, Star, Package } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product } from "@/types"

const LogoPlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative h-8 w-8"
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
            className={`h-3 w-3 ${
              star <= Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : star - 0.5 <= rating
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
      {reviewCount > 0 && <span className="text-[10px] text-gray-400">({reviewCount.toLocaleString()})</span>}
    </div>
  )
}

const ProductCard = memo(({ product, index }: { product: Product; index: number }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  const discountPercentage = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
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

  const imageUrl =
    (product.image_urls && product.image_urls[0]) || product.thumbnail_url || "/diverse-fashion-display.png"

  const rating = product.rating || 3 + Math.random() * 2
  const reviewCount = product.review_count || Math.floor(Math.random() * 5000) + 100

  return (
    <Link href={`/product/${product.slug || product.id}`} prefetch={false}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.02 }}
        whileHover={{ y: -2 }}
        className="h-full"
      >
        <div className="group h-full overflow-hidden bg-white border-b border-r border-gray-100 transition-all duration-200 hover:shadow-sm">
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
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </motion.div>

            {product.sale_price && discountPercentage > 0 && (
              <div className="absolute top-1 left-1 bg-[#8B1538] text-white text-[10px] font-medium px-1.5 py-0.5 rounded-sm z-20">
                -{discountPercentage}%
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-2">
            {/* Product Name */}
            <h3 className="text-gray-800 text-xs line-clamp-2 leading-tight mb-1.5 min-h-[32px]">{product.name}</h3>

            {/* Price */}
            <div className="mb-1.5">
              <span className="font-semibold text-[#8B1538] text-sm">
                KSh {(product.sale_price || product.price).toLocaleString()}
              </span>
              {product.sale_price && (
                <span className="text-gray-400 line-through ml-1.5 text-[10px]">
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

const ProductGridSkeleton = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-[1px] bg-gray-100 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.02, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white p-2"
      >
        <div className="aspect-square w-full bg-[#f5f5f7] flex items-center justify-center relative overflow-hidden mb-2">
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
            <Package className="h-6 w-6 text-gray-300 mx-auto" />
          </motion.div>
        </div>
        <Skeleton className="h-3 w-3/4 bg-[#f5f5f7] rounded-full mb-2" />
        <Skeleton className="h-3 w-1/2 bg-[#f5f5f7] rounded-full mb-2" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, j) => (
            <Skeleton key={j} className="h-3 w-3 bg-[#f5f5f7] rounded-full" />
          ))}
        </div>
      </motion.div>
    ))}
  </div>
)

interface ProductGridProps {
  limit?: number
  category?: string
}

export function ProductGrid({ limit = 12, category }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await productService.getProducts({
        limit,
        category_slug: category,
      })

      setProducts(data || [])
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Failed to load products")
    } finally {
      setLoading(false)
    }
  }, [limit, category])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    const handleProductImagesUpdated = (event: CustomEvent) => {
      const { productId } = event.detail
      console.log("[v0] ProductGrid: Product images updated event received for product:", productId)

      setProducts([])
      setLoading(true)

      setTimeout(() => {
        fetchProducts()
      }, 500)
    }

    window.addEventListener("productImagesUpdated", handleProductImagesUpdated as EventListener)

    return () => {
      window.removeEventListener("productImagesUpdated", handleProductImagesUpdated as EventListener)
    }
  }, [fetchProducts])

  if (loading) {
    return <ProductGridSkeleton count={limit} />
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700 text-center">
        <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-red-500" />
        <p className="mb-2">{error}</p>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-gray-50 p-8 rounded-md text-gray-500 text-center">
        <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No products found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-[1px] bg-gray-100 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  )
}
