"use client"
import { useState, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { productService } from "@/services/product"
import { ShoppingBag, Star } from "lucide-react"
import type { Product } from "@/types"

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

const ProductCard = memo(
  ({ product, index, isNewlyLoaded = false }: { product: Product; index: number; isNewlyLoaded?: boolean }) => {
    const discountPercentage = product.sale_price
      ? Math.round(((product.price - product.sale_price) / product.price) * 100)
      : 0

    const imageUrl =
      (product.image_urls && product.image_urls[0]) || product.thumbnail_url || "/diverse-fashion-display.png"

    const rating = product.rating || 3 + Math.random() * 2
    const reviewCount = product.review_count || Math.floor(Math.random() * 5000) + 100

    const cardVariants = {
      hidden: {
        opacity: 0,
        y: 30,
        scale: 0.95,
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 15,
          delay: isNewlyLoaded ? index * 0.05 : index * 0.02,
        },
      },
    }

    return (
      <Link href={`/product/${product.slug || product.id}`} prefetch={false}>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -8 }}
          className="h-full"
        >
          <div className="group h-full overflow-hidden bg-white border border-gray-100 rounded-lg transition-all duration-300 hover:shadow-lg">
            <div className="relative aspect-square overflow-hidden bg-[#f8f8f8]">
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

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
  },
)

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
  const [newlyLoadedStartIndex, setNewlyLoadedStartIndex] = useState<number | null>(null)

  const fetchMoreProducts = useCallback(
    async (pageNum: number) => {
      try {
        setLoadingMore(true)
        setError(null)

        const data = await productService.getProducts({
          limit,
          category_slug: category,
          page: pageNum,
        })

        setProducts((prev) => {
          setNewlyLoadedStartIndex(prev.length)
          return [...prev, ...(data || [])]
        })

        setHasMore((data || []).length >= limit)
      } catch (err) {
        console.error("Error fetching more products:", err)
        setError("Failed to load more products")
      } finally {
        setLoadingMore(false)
      }
    },
    [limit, category],
  )

  const handleShowMore = async () => {
    const nextPage = page + 1
    setPage(nextPage)
    await fetchMoreProducts(nextPage)
  }

  if (error && products.length === 0) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-[#8B1538] text-center">
        <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-[#8B1538]" />
        <p className="mb-2">{error}</p>
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
          <ProductCard
            key={`${product.id}-${index}`}
            product={product}
            index={
              newlyLoadedStartIndex !== null && index >= newlyLoadedStartIndex ? index - newlyLoadedStartIndex : index
            }
            isNewlyLoaded={newlyLoadedStartIndex !== null && index >= newlyLoadedStartIndex}
          />
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
