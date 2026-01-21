"use client"
import { useState, useEffect, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { productService } from "@/services/product"
import { imageBatchService } from "@/services/image-batch-service"
import { ShoppingBag, Star } from "lucide-react"
import type { Product } from "@/types"
import { cloudinaryService } from "@/services/cloudinary-service"

const LogoPlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative h-6 w-6 sm:h-8 sm:w-8"
    >
      <Image src="/logo.png" alt="Loading" fill className="object-contain" />
    </motion.div>
  </div>
)

const StarRating = ({ rating = 4, reviewCount = 0 }: { rating?: number; reviewCount?: number }) => {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 ${
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
        <span className="text-[8px] sm:text-[10px] md:text-xs text-gray-400">({reviewCount.toLocaleString()})</span>
      )}
    </div>
  )
}

function getProductImageUrl(product: Product): string {
  // Priority 1: Use thumbnail_url if available
  if (product.thumbnail_url) {
    const url = String(product.thumbnail_url).trim()
    // If it's a full URL, return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      console.log("[v0] Using thumbnail_url:", url)
      return url
    }
    // If it's a Cloudinary public ID or path, optimize it
    if (url.length > 0 && !url.includes("placeholder")) {
      try {
        return cloudinaryService.generateOptimizedUrl(url, {
          width: 500,
          height: 500,
          crop: "fill",
          quality: "auto",
          format: "auto",
        })
      } catch (e) {
        console.log("[v0] Cloudinary optimization failed, using direct URL")
        return url
      }
    }
  }

  // Priority 2: Check image_urls array
  if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    const firstUrl = String(product.image_urls[0]).trim()
    if (firstUrl.startsWith("http://") || firstUrl.startsWith("https://")) {
      console.log("[v0] Using image_urls[0]:", firstUrl)
      return firstUrl
    }
    if (firstUrl.length > 0 && !firstUrl.includes("placeholder")) {
      try {
        return cloudinaryService.generateOptimizedUrl(firstUrl, {
          width: 500,
          height: 500,
          crop: "fill",
          quality: "auto",
          format: "auto",
        })
      } catch (e) {
        console.log("[v0] Cloudinary optimization failed, using direct URL")
        return firstUrl
      }
    }
  }

  // Priority 3: Check images array with URL objects
  if ((product as any).images && Array.isArray((product as any).images) && (product as any).images.length > 0) {
    const firstImg = (product as any).images[0]
    if (firstImg) {
      // Handle both {url: string} and direct string formats
      const imgUrl = typeof firstImg === "string" ? firstImg : firstImg.url || firstImg.secure_url
      if (imgUrl) {
        const urlString = String(imgUrl).trim()
        if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
          console.log("[v0] Using images[0].url:", urlString)
          return urlString
        }
        if (urlString.length > 0 && !urlString.includes("placeholder")) {
          try {
            return cloudinaryService.generateOptimizedUrl(urlString, {
              width: 500,
              height: 500,
              crop: "fill",
              quality: "auto",
              format: "auto",
            })
          } catch (e) {
            console.log("[v0] Cloudinary optimization failed, using direct URL")
            return urlString
          }
        }
      }
    }
  }

  console.log("[v0] No valid images found for product, using fallback")
  return "/modern-tech-product.png"
}

const ProductCard = memo(({ product, index }: { product: Product; index: number }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [imageSrc, setImageSrc] = useState<string>("")

  const discountPercentage = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0

  const handleImageLoad = useCallback(() => {
    console.log("[v0] Image loaded successfully:", imageSrc)
    setImageLoaded(true)
    setTimeout(() => setShowPlaceholder(false), 300)
  }, [imageSrc])

  const handleImageError = useCallback(() => {
    console.log("[v0] Image failed to load:", imageSrc)
    setImageError(true)
    setImageLoaded(false)
  }, [imageSrc])

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
    setShowPlaceholder(true)
    const url = getProductImageUrl(product)
    console.log("[v0] Setting image URL for product", product.id, ":", url)
    setImageSrc(url)
  }, [product]) // Updated dependency to product

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

            {!imageError && imageSrc && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoaded ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image
                  src={imageSrc || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  crossOrigin="anonymous"
                  quality={75}
                />
              </motion.div>
            )}

            {product.sale_price && discountPercentage > 0 && (
              <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 bg-[#8B1538] text-white text-[8px] sm:text-[10px] md:text-xs font-medium px-1 sm:px-1.5 py-0.5 rounded-sm z-20">
                -{discountPercentage}%
              </div>
            )}
          </div>

          <div className="p-1.5 sm:p-2 md:p-3">
            <h3 className="text-gray-800 text-[10px] sm:text-xs md:text-sm line-clamp-2 leading-tight mb-1 sm:mb-1.5 min-h-[24px] sm:min-h-[32px] md:min-h-[40px]">
              {product.name}
            </h3>

            <div className="mb-1 sm:mb-1.5">
              <span className="font-semibold text-[#8B1538] text-[11px] sm:text-sm md:text-base">
                KSh {(product.sale_price || product.price).toLocaleString()}
              </span>
              {product.sale_price && (
                <span className="text-gray-400 line-through ml-1 sm:ml-1.5 text-[8px] sm:text-[10px] md:text-xs">
                  KSh {product.price.toLocaleString()}
                </span>
              )}
            </div>

            <StarRating rating={rating} reviewCount={reviewCount} />
          </div>
        </div>
      </motion.div>
    </Link>
  )
})

ProductCard.displayName = "ProductCard"

interface ProductGridProps {
  initialProducts?: Product[]
  initialHasMore?: boolean
  limit?: number
  category?: string
}

export function ProductGrid({ initialProducts = [], initialHasMore = true, limit = 12, category }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)

  const fetchProducts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        setLoadingMore(true)
        setError(null)

        const data = await productService.getProducts({
          limit,
          category_slug: category,
          page: pageNum,
        })

        if (append) {
          setProducts((prev) => [...prev, ...(data || [])])
        } else {
          setProducts(data || [])
        }

        setHasMore((data || []).length >= limit)
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("Failed to load products")
      } finally {
        setLoadingMore(false)
      }
    },
    [limit, category, limit],
  )

  const handleShowMore = async () => {
    const nextPage = page + 1
    setPage(nextPage)
    await fetchProducts(nextPage, true)
  }

  // Prefetch images for all products using batch service
  useEffect(() => {
    if (products && products.length > 0) {
      const productIds = products.map((p) => String(p.id))
      console.log("[v0] Prefetching images for products:", productIds)
      imageBatchService.prefetchProductImages(productIds)
    }
  }, [products])

  useEffect(() => {
    const handleProductImagesUpdated = () => {
      setProducts([])
      setPage(1)
      setTimeout(() => {
        fetchProducts(1, false)
      }, 300)
    }

    window.addEventListener("productImagesUpdated", handleProductImagesUpdated as EventListener)
    return () => {
      window.removeEventListener("productImagesUpdated", handleProductImagesUpdated as EventListener)
    }
  }, [fetchProducts])

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-[#8B1538] text-center">
        <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-[#8B1538]" />
        <p className="mb-2">{error}</p>
        <button
          onClick={() => fetchProducts()}
          className="px-4 py-2 bg-[#8B1538] text-white rounded-md hover:bg-[#6d1029] transition-colors text-sm"
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
    <div className="flex flex-col">
      <div className="grid grid-cols-3 gap-[1px] bg-gray-100 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {products.map((product, index) => (
          <ProductCard key={`${product.id}-${index}`} product={product} index={index} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center py-6 sm:py-8 bg-white border-t border-gray-100">
          <button
            onClick={handleShowMore}
            disabled={loadingMore}
            className="relative flex items-center justify-center px-12 sm:px-16 py-2.5 sm:py-3 bg-white text-gray-600 font-medium rounded-full border border-gray-300 hover:border-gray-400 hover:text-gray-800 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed min-w-[180px] sm:min-w-[200px] tracking-widest uppercase text-xs sm:text-sm"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
          >
            <AnimatePresence mode="wait">
              {loadingMore ? (
                <motion.div
                  key="spinner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <div className="relative w-5 h-5">
                    {[...Array(12)].map((_, i) => (
                      <motion.span
                        key={i}
                        className="absolute left-1/2 top-0 w-[2px] h-[5px] rounded-full origin-[50%_10px]"
                        style={{
                          transform: `translateX(-50%) rotate(${i * 30}deg)`,
                          backgroundColor: "#8B1538",
                        }}
                        animate={{
                          opacity: [0.15, 1, 0.15],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * (1 / 12),
                          ease: "linear",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Show More
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      )}
    </div>
  )
}

export default ProductGrid
