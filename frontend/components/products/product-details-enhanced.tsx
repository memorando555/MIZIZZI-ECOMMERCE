"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart,
  Share2,
  ChevronRight,
  Star,
  Check,
  ThumbsUp,
  Shield,
  Zap,
  Home,
  ArrowLeft,
  ArrowRight,
  Award,
  RefreshCw,
  Minus,
  Plus,
  ShoppingCart,
  CreditCard,
  Maximize2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  MessageSquare,
  BadgeCheck,
  Clock,
} from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"
import { useCart } from "@/contexts/cart/cart-context"
import { useWishlist } from "@/contexts/wishlist/wishlist-context"
import { useToast } from "@/components/ui/use-toast"
import { formatPrice, cn } from "@/lib/utils"
import { productService } from "@/services/product"
import { inventoryService } from "@/services/inventory-service"
import { cloudinaryService } from "@/services/cloudinary-service"
import { ImageZoomModal } from "./image-zoom-modal"
import { reviewService, type Review, type ReviewSummary } from "@/services/review-service"
import { useAuth } from "@/contexts/auth/auth-context"
import { imageBatchService } from "@/services/image-batch-service"
import { Loader } from "@/components/ui/loader"

interface ProductDetailsEnhancedProps {
  product: any
  initialReviews?: Review[]
  similarProducts?: any[]
  recentlyViewedProducts?: any[]
}

const appleVariants = {
  fadeIn: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.4,
      ease: [0.2, 0, 0.2, 1],
    },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.4,
      ease: [0.175, 0.885, 0.32, 1.275],
    },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

const CHERRY_RED = "#8B0000" // Dark cherry red
const CHERRY_RED_HOVER = "#6B0000"
const CHERRY_RED_ACTIVE = "#5A0000"
const ORANGE_PRIMARY = "#EA580C" // Modern orange for accents

export default function ProductDetailsEnhanced({
  product: initialProduct,
  initialReviews,
  similarProducts,
  recentlyViewedProducts,
}: ProductDetailsEnhancedProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()

  const [isPageLoading, setIsPageLoading] = useState(true)

  // State
  const [product, setProduct] = useState<any>(initialProduct)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<any[]>(similarProducts || [])
  const [isLoadingRelated, setIsLoadingRelated] = useState(true)
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>(recentlyViewedProducts || [])
  const [isImageZoomModalOpen, setIsImageZoomModalOpen] = useState(false)
  const [zoomSelectedImage, setZoomSelectedImage] = useState(0)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showCartNotification, setShowCartNotification] = useState(false)
  const [cartNotificationData, setCartNotificationData] = useState<any>(null)
  const [optimisticWishlistState, setOptimisticWishlistState] = useState<boolean | null>(null)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const [showSpecifications, setShowSpecifications] = useState(true)
  const [reviewSortBy, setReviewSortBy] = useState<"recent" | "highest" | "lowest">("recent")
  const [likedReviews, setLikedReviews] = useState<Set<number>>(new Set())
  const [animatingReviews, setAnimatingReviews] = useState<Set<number>>(new Set())

  // Inventory state
  const [inventoryData, setInventoryData] = useState<{
    available_quantity: number
    is_in_stock: boolean
    is_low_stock: boolean
    stock_status: "in_stock" | "low_stock" | "out_of_stock"
    last_updated?: string
  } | null>({
    available_quantity: 0,
    is_in_stock: false,
    is_low_stock: false,
    stock_status: "out_of_stock",
    last_updated: undefined,
  })
  const [isLoadingInventory, setIsLoadingInventory] = useState(true)
  const [inventoryError, setInventoryError] = useState<string | null>(null)

  const [reviews, setReviews] = useState<Review[]>(initialReviews || [])
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Refs
  const addToCartInProgress = useRef(false)
  const lastAddToCartTime = useRef(0)
  const imageRef = useRef<HTMLDivElement>(null)
  const reviewSectionRef = useRef<HTMLDivElement>(null)
 
  // Contexts
  const { addToCart, items: cartItems } = useCart()
  const { isInWishlist, addToWishlist, removeProductFromWishlist } = useWishlist()
  const actualWishlistState = isInWishlist(Number(product?.id))
  const isProductInWishlist = optimisticWishlistState !== null ? optimisticWishlistState : actualWishlistState

  // Derived pricing
  const currentPrice = selectedVariant?.price ?? product?.sale_price ?? product?.price
  const originalPrice = product?.price
  const discountPercentage =
    originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0

  // Helpers
  const getProductImageUrl = (p: any, index = 0, highQuality = false): string => {
    if (p?.image_urls && p.image_urls.length > index) {
      const url = p.image_urls[index]
      if (typeof url === "string" && url.startsWith("blob:")) {
        console.warn(`[v0] Blob URL detected in product image, using placeholder`)
        return "/generic-product-display.png"
      }
      if (typeof url === "string" && !url.startsWith("http")) {
        if (highQuality) {
          return cloudinaryService.generateOptimizedUrl(url, {
            width: 2048,
            height: 2048,
            quality: 100,
            format: "auto",
            crop: "fit",
          })
        }
        return cloudinaryService.generateOptimizedUrl(url)
      }
      return url
    }
    return "/generic-product-display.png"
  }

  const getProductImages = (p: any): string[] => {
    let imageUrls: string[] = []
    if (p?.image_urls) {
      if (Array.isArray(p.image_urls)) {
        if (p.image_urls.length > 0 && typeof p.image_urls[0] === "string" && p.image_urls[0].length === 1) {
          try {
            const reconstructed = p.image_urls.join("")
            const parsed = JSON.parse(reconstructed)
            if (Array.isArray(parsed)) {
              imageUrls = parsed
                .filter((u: unknown): u is string => typeof u === "string" && u.trim() !== "" && !u.startsWith("blob:"))
                .map((u: string) => (u.startsWith("http") ? u : cloudinaryService.generateOptimizedUrl(u)))
            }
          } catch {
            imageUrls = []
          }
        } else {
          imageUrls = p.image_urls
            .filter((u: string): u is string => typeof u === "string" && u.trim() !== "" && !u.startsWith("blob:"))
            .map((u: string) => (u.startsWith("http") ? u : cloudinaryService.generateOptimizedUrl(u)))
        }
      } else if (typeof p.image_urls === "string") {
        try {
          const parsed = JSON.parse(p.image_urls)
          if (Array.isArray(parsed)) {
            imageUrls = parsed
              .filter((u): u is string => typeof u === "string" && u.trim() !== "" && !u.startsWith("blob:"))
              .map((u) => (u.startsWith("http") ? u : cloudinaryService.generateOptimizedUrl(u)))
          }
        } catch {
          if (!p.image_urls.startsWith("blob:")) {
            imageUrls = [
              p.image_urls.startsWith("http") ? p.image_urls : cloudinaryService.generateOptimizedUrl(p.image_urls),
            ]
          }
        }
      }
    }
    const valid = imageUrls.filter((u): u is string => Boolean(u && typeof u === "string" && u.trim() !== ""))
    return valid.length ? valid : ["/clean-product-shot.png"]
  }

  const productImages = useMemo(() => {
    // console.log("[v0] Computing productImages from product.image_urls:", product?.image_urls)
    const images = getProductImages(product)
    // console.log("[v0] Computed productImages:", images.length, "images")
    return images
  }, [product])

  // Effects
  useEffect(() => {
    setProduct(initialProduct)
  }, [initialProduct])

  useEffect(() => {
    // Simulate loading for smooth experience
    const timer = setTimeout(() => {
      setIsPageLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (optimisticWishlistState !== null && optimisticWishlistState === actualWishlistState) {
      setOptimisticWishlistState(null)
    }
  }, [actualWishlistState, optimisticWishlistState])

  const fetchInventoryData = useCallback(async () => {
    if (!product?.id) return
    setIsLoadingInventory(true)
    setInventoryError(null)
    try {
      // console.log("[v0] Fetching inventory for product:", product.id)
      const summary = await inventoryService.getProductInventorySummary(Number(product.id), selectedVariant?.id)
      const available = summary.total_available_quantity ?? 0
      const stock_status: "in_stock" | "low_stock" | "out_of_stock" =
        available === 0 ? "out_of_stock" : summary.is_low_stock ? "low_stock" : "in_stock"
      setInventoryData({
        available_quantity: available,
        is_in_stock: !!summary.is_in_stock,
        is_low_stock: !!summary.is_low_stock,
        stock_status,
        last_updated: summary.items?.[0]?.last_updated,
      })
  
    } catch (error: any) {
      console.error("[v0] Inventory fetch error:", error)
      setInventoryError(error?.message || "Failed to load inventory data")
      try {
        // console.log("[v0] Attempting direct inventory refresh...")
        const directCheck = await inventoryService.checkAvailability(Number(product.id), 1, selectedVariant?.id)
        setInventoryData({
          available_quantity: directCheck.available_quantity,
          is_in_stock: directCheck.is_available,
          is_low_stock: !!directCheck.is_low_stock,
          stock_status:
            directCheck.available_quantity === 0 ? "out_of_stock" : directCheck.is_low_stock ? "low_stock" : "in_stock",
        })
        // console.log("[v0] Direct inventory check successful:", directCheck)
        setInventoryError(null)
      } catch (directError) {
        console.error("[v0] Direct inventory check failed:", directError)
        const fallbackStock = product?.stock || 0
        // console.log("[v0] Using product.stock as fallback:", fallbackStock)
        setInventoryData({
          available_quantity: fallbackStock,
          is_in_stock: fallbackStock > 0,
          is_low_stock: fallbackStock > 0 && fallbackStock <= 5,
          stock_status: fallbackStock === 0 ? "out_of_stock" : fallbackStock <= 5 ? "low_stock" : "in_stock",
        })
        setInventoryError(null)
      }
    } finally {
      setIsLoadingInventory(false)
    }
  }, [product?.id, product?.stock, selectedVariant?.id])

  useEffect(() => {
    fetchInventoryData()
  }, [fetchInventoryData])

  useEffect(() => {
    const run = async () => {
      if (!product?.category_id) return
      setIsLoadingRelated(true)
      try {
        const products = await productService.getProductsByCategory(String(product.category_id))
        setRelatedProducts(
          products
            .filter((p: any) => p.id !== product.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 6),
        )
      } finally {
        setIsLoadingRelated(false)
      }
    }
    run()

    try {
      const recentItems = JSON.parse(localStorage.getItem("recentlyViewed") || "[]")
      const exists = recentItems.some((i: any) => i.id === product.id)
      if (!exists) {
        const updated = [
          {
            id: product.id,
            name: product.name,
            price: currentPrice,
            image: productImages[0] || "/placeholder-rhtiu.png",
            slug: product.slug || product.id,
            image_urls: productImages,
            thumbnail_url: product.thumbnail_url,
          },
          ...recentItems,
        ].slice(0, 6)
        localStorage.setItem("recentlyViewed", JSON.stringify(updated))
        setRecentlyViewed(updated)
      } else {
        setRecentlyViewed(recentItems)
      }
    } catch {}
  }, [product.id, product.category_id, product.name, currentPrice, product.slug, product.thumbnail_url, productImages])

  useEffect(() => {
    const handleProductUpdate = (event: CustomEvent) => {
      const { id, product: updatedProduct } = event.detail
      if (id === product?.id?.toString()) {
        console.log("[v0] Received product update event:", updatedProduct)
        fetchInventoryData()
      }
    }

    const handleInventoryUpdate = (event: CustomEvent) => {
      const { product_id, stock, is_low_stock } = event.detail
      if (product_id === product?.id) {
        console.log("[v0] Received inventory update event:", { product_id, stock, is_low_stock })
        setInventoryData((prev) => ({
          ...prev,
          available_quantity: stock,
          is_in_stock: stock > 0,
          is_low_stock: is_low_stock,
          stock_status: stock === 0 ? "out_of_stock" : is_low_stock ? "low_stock" : "in_stock",
          last_updated: new Date().toISOString(),
        }))
      }
    }

    window.addEventListener("product-updated", handleProductUpdate as EventListener)
    window.addEventListener("inventory-updated", handleInventoryUpdate as EventListener)

    return () => {
      window.removeEventListener("product-updated", handleProductUpdate as EventListener)
      window.removeEventListener("inventory-updated", handleInventoryUpdate as EventListener)
    }
  }, [product?.id, fetchInventoryData])

  useEffect(() => {
    const handleProductImagesUpdated = (event: CustomEvent) => {
      const { productId: updatedProductId } = event.detail || {}

      if (updatedProductId && updatedProductId.toString() === product.id.toString()) {
        console.log("[v0] Product images updated event received for product:", product.id)

        imageBatchService.invalidateCache(product.id.toString())

        fetchInventoryData()

        console.log("[v0] Refetching product data to get updated images...")
        productService
          .getProduct(product.id.toString())
          .then((updatedProduct) => {
            if (updatedProduct) {
              console.log("[v0] Product data refreshed successfully")
              console.log("[v0] New image_urls:", updatedProduct.image_urls)

              return imageBatchService.fetchProductImages(product.id.toString()).then((images: any[]) => {
                console.log("[v0] Fetched images from batch service:", images.length)
                if (images && images.length > 0) {
                  updatedProduct.image_urls = images.map((img: any) => img.url || img.image_url).filter(Boolean)
                  console.log("[v0] Updated product.image_urls with all images:", updatedProduct.image_urls)
                }
                setProduct(updatedProduct)
                setSelectedImage(0)
              })
            }
          })
          .catch((error) => {
            console.error("[v0] Error refreshing product:", error)
          })
      }
    }

    window.addEventListener("productImagesUpdated", handleProductImagesUpdated as EventListener)

    return () => {
      window.removeEventListener("productImagesUpdated", handleProductImagesUpdated as EventListener)
    }
  }, [product.id, fetchInventoryData])

  useEffect(() => {
    const fetchAllProductImages = async () => {
      try {
        console.log("[v0] Fetching all product images for product:", product.id)
        imageBatchService.invalidateCache(product.id.toString())

        const images: any[] = await imageBatchService.fetchProductImages(product.id.toString())
        console.log("[v0] Fetched product images from database:", images.length)

        if (images && images.length > 0) {
          const imageUrls = images.map((img: any) => img.url || img.image_url).filter(Boolean)
          console.log("[v0] Extracted image URLs from database:", imageUrls)

          setProduct((prev: any) => ({
            ...prev,
            image_urls: imageUrls,
          }))
        } else {
          console.log("[v0] No images found in database, clearing product images")
          setProduct((prev: any) => ({
            ...prev,
            image_urls: [],
          }))
        }
      } catch (error) {
        console.error("[v0] Error fetching product images:", error)
        setProduct((prev: any) => ({
          ...prev,
          image_urls: [],
        }))
      }
    }

    if (product?.id) {
      fetchAllProductImages()
    }
  }, [product?.id])

  // Actions
  const handleVariantSelection = (variant: any) => setSelectedVariant(variant)
  const handleImageClick = () => {
    setZoomSelectedImage(selectedImage)
    setIsImageZoomModalOpen(true)
  }

  // Removed handleToggleReviewForm, handleSubmitReview
  // const handleToggleReviewForm = useCallback(() => {
  //   setShowReviewForm((prev) => !prev)
  // }, [])

  const StarRating = ({
    rating,
    onRatingChange,
    interactive = false,
    size = 20,
  }: {
    rating: number
    onRatingChange?: (rating: number) => void
    interactive?: boolean
    size?: number
  }) => {
    const [hoverRating, setHoverRating] = useState(0)

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            onClick={() => interactive && onRatingChange?.(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={cn(
              "transition",
              interactive && "cursor-pointer",
              (hoverRating || rating) >= star ? "text-[#8B0000]" : "text-gray-200",
            )}
            disabled={!interactive}
            whileHover={interactive ? { scale: 1.1 } : undefined}
          >
            <Star size={size} fill={(hoverRating || rating) >= star ? "currentColor" : "none"} strokeWidth={1.5} />
          </motion.button>
        ))}
      </div>
    )
  }

  const fetchReviews = useCallback(async () => {
    if (!product?.id) return
    setIsLoadingReviews(true)
    setReviewError(null)
    try {
      // console.log("[v0] Fetching reviews for product:", product.id)
      const [reviewsResponse, summaryResponse] = await Promise.all([
        reviewService.getProductReviews(Number(product.id), {
          page: 1,
          per_page: showAllReviews ? 50 : 5,
          sort_by: reviewSortBy === "recent" ? "created_at" : "rating",
          sort_order: reviewSortBy === "lowest" ? "asc" : "desc",
        }),
        reviewService.getProductReviewSummary(Number(product.id)),
      ])
      setReviews(reviewsResponse.items)
      setReviewSummary(summaryResponse)
      // console.log("[v0] Reviews loaded successfully:", {
      //   count: reviewsResponse.items.length,
      //   average: summaryResponse.average_rating,
      // })
      // Removed canUserReview and related logic as reviews are read-only here
      // if (isAuthenticated && user) {
      //   try {
      //     const canReview = await reviewService.canUserReviewProduct(Number(product.id))
      //     setCanUserReview(canReview)
      //   } catch (error) {
      //     console.log("[v0] Could not check review eligibility:", error)
      //     setCanUserReview(false)
      //   }
      // } else {
      //   setCanUserReview(false)
      // }
    } catch (error: any) {
      console.error("[v0] Error fetching reviews:", error)
      setReviewError(error?.message || "Failed to load reviews")
      setReviews([])
      setReviewSummary({
        total_reviews: 0,
        average_rating: 0,
        verified_reviews: 0,
        rating_distribution: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
      })
    } finally {
      setIsLoadingReviews(false)
    }
  }, [product?.id, showAllReviews, reviewSortBy]) // Removed isAuthenticated, user

  useEffect(() => {
    // console.log("[v0] Product changed, fetching reviews for:", product?.id)
    if (product?.id) {
      fetchReviews()
    }
  }, [fetchReviews, product?.id])

  const handleMarkHelpful = useCallback(
    async (reviewId: number) => {
      // Prevent double-clicking during animation
      if (animatingReviews.has(reviewId)) return

      // Start animation
      setAnimatingReviews((prev) => new Set(prev).add(reviewId))

      // Toggle liked state optimistically
      const isCurrentlyLiked = likedReviews.has(reviewId)
      setLikedReviews((prev) => {
        const newSet = new Set(prev)
        if (isCurrentlyLiked) {
          newSet.delete(reviewId)
        } else {
          newSet.add(reviewId)
        }
        return newSet
      })

      try {
        await reviewService.markReviewHelpful(reviewId)
        await fetchReviews() // Re-fetch to ensure like counts are accurate
      } catch (error: any) {
        console.error("[v0] Error marking review helpful:", error)
        // Revert optimistic update on error
        setLikedReviews((prev) => {
          const newSet = new Set(prev)
          if (isCurrentlyLiked) {
            newSet.add(reviewId)
          } else {
            newSet.delete(reviewId)
          }
          return newSet
        })
        toast({
          title: "Error",
          description: error?.message || "Failed to mark review as helpful",
          variant: "destructive",
        })
      } finally {
        // End animation after delay
        setTimeout(() => {
          setAnimatingReviews((prev) => {
            const newSet = new Set(prev)
            newSet.delete(reviewId)
            return newSet
          })
        }, 300) // Match animation duration if any
      }
    },
    [animatingReviews, likedReviews, fetchReviews, toast],
  ) // Added dependencies

  const handleLikeReview = async (reviewId: number) => {
    // This function seems to be a duplicate or alternative for handleMarkHelpful.
    // If it's intended to be different, its logic needs to be defined.
    // For now, it's commented out to avoid confusion.
    console.warn(
      "[v0] handleLikeReview is called but logic is not fully defined or might be redundant with handleMarkHelpful.",
    )
  }

  const handleAddToCart = async (): Promise<boolean> => {
    if (!inventoryData?.is_in_stock) {
      toast({ title: "Out of Stock", description: "This product is currently out of stock", variant: "destructive" })
      return false
    }
    try {
      const fresh = await inventoryService.checkAvailability(Number(product.id), quantity, selectedVariant?.id)
      if (!fresh.is_available || quantity > fresh.available_quantity) {
        setInventoryData({
          available_quantity: fresh.available_quantity,
          is_in_stock: fresh.available_quantity > 0,
          is_low_stock: !!fresh.is_low_stock,
          stock_status: fresh.available_quantity === 0 ? "out_of_stock" : fresh.is_low_stock ? "low_stock" : "in_stock",
        })
        toast({
          title: "Stock Updated",
          description:
            fresh.available_quantity === 0
              ? "This item just went out of stock."
              : `Only ${fresh.available_quantity} items available`,
          variant: "destructive",
        })
        return false
      }
    } catch {}
    if (quantity > (inventoryData?.available_quantity ?? 0)) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${inventoryData?.available_quantity ?? 0} items available`,
        variant: "destructive",
      })
      return false
    }
    if (addToCartInProgress.current || isAddingToCart) return false
    const now = Date.now()
    if (now - lastAddToCartTime.current < 1200) return false
    if ((product.variants?.length ?? 0) > 0 && !selectedVariant) {
      toast({
        title: "Select Options",
        description: "Please choose the required product options before adding to cart",
        variant: "destructive",
      })
      return false
    }
    if (quantity <= 0) {
      toast({ title: "Invalid quantity", description: "Please select at least 1 item", variant: "destructive" })
      return false
    }
    try {
      addToCartInProgress.current = true
      lastAddToCartTime.current = now
      setIsAddingToCart(true)
      const productId = typeof product.id === "string" ? Number.parseInt(product.id, 10) : product.id
      const result = await addToCart(
        productId,
        quantity,
        typeof selectedVariant?.id === "number" ? selectedVariant.id : undefined,
      )
      if (result.success) {
        await fetchInventoryData()
        setCartNotificationData({
          name: product.name,
          price: currentPrice,
          quantity,
          thumbnail_url: productImages[0] || "/shopping-cart-thumbnail.png",
        })
        setShowCartNotification(true)
        setTimeout(() => setShowCartNotification(false), 4500)
        return true
      } else {
        toast({ title: "Error", description: result.message || "Failed to add item to cart", variant: "destructive" })
        return false
      }
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to add to cart", variant: "destructive" })
      return false
    } finally {
      setTimeout(() => {
        addToCartInProgress.current = false
        setIsAddingToCart(false)
      }, 1200)
    }
  }

  const handleToggleWishlist = async () => {
    // Prevent multiple simultaneous clicks
    if (isTogglingWishlist) return

    try {
      setIsTogglingWishlist(true)

      // Optimistic update - immediately update UI
      const newState = !isProductInWishlist
      setOptimisticWishlistState(newState)

      if (isProductInWishlist) {
        await removeProductFromWishlist(Number(product.id))
      } else {
        await addToWishlist({ product_id: Number(product.id) })
      }

      // Success - the context will handle the toast notification
    } catch (error: any) {
      // Revert optimistic update on error
      setOptimisticWishlistState(null)

      console.error("[v0] Error toggling wishlist:", error)

      // Only show error toast if the context didn't already handle it
      if (!error.message?.includes("already")) {
        toast({
          title: "Error",
          description: "Failed to update wishlist. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      // Add a small delay before allowing next click to prevent rapid clicking
      setTimeout(() => {
        setIsTogglingWishlist(false)
      }, 500)
    }
  }

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    if ((navigator as any).share) {
      ;(navigator as any).share({ title: product.name, text: product.description, url }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      toast({ title: "Link copied", description: "Product link copied to clipboard" })
    }
  }

  const getProductSpecifications = (p: any) => {
    console.log("[v0] Getting specifications for product:", p?.id)
    console.log("[v0] Product specifications data:", p?.specifications)

    if (p?.specifications) {
      // Handle if specifications is a JSON string
      let specs = p.specifications
      if (typeof specs === "string") {
        try {
          specs = JSON.parse(specs)
        } catch (e) {
          console.error("[v0] Failed to parse specifications JSON:", e)
        }
      }

      if (Array.isArray(specs) && specs.length > 0) {
        console.log("[v0] Using array specifications from database:", specs.length, "categories")
        return specs.map((spec: any) => ({
          category: spec.category || "Specifications",
          items: Array.isArray(spec.items)
            ? spec.items.map((item: any) => ({
                label: item.label || "",
                value: typeof item.value === "string" ? item.value : String(item.value || ""),
              }))
            : [],
        }))
      }

      if (typeof specs === "object" && !Array.isArray(specs)) {
        console.log("[v0] Using categorized specifications from database")
        const categorizedSpecs: Array<{ category: string; items: Array<{ label: string; value: string }> }> = []

        // Process each category from the admin data
        const categoryOrder = ["product_identification", "specifications", "what's_in_the_box", "options"]

        categoryOrder.forEach((categoryKey) => {
          const categoryData = specs[categoryKey]
          if (categoryData && typeof categoryData === "object") {
            // Format category name for display
            const displayName = categoryKey
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")

            const items: Array<{ label: string; value: string }> = []
            Object.entries(categoryData).forEach(([key, value]) => {
              const fieldName = key
                .split("_")
                .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
                .join(" ")

              if (value && typeof value === "string") {
                items.push({ label: fieldName, value })
              }
            })

            if (items.length > 0) {
              categorizedSpecs.push({
                category: displayName,
                items,
              })
            }
          }
        })

        // If we found specifications, return them
        if (categorizedSpecs.length > 0) {
          console.log("[v0] Returning", categorizedSpecs.length, "specification categories from admin data")
          return categorizedSpecs
        }
      }
    }

    // Build minimal specs from product fields only (no hardcoded defaults)
    console.log("[v0] No admin specifications found, generating minimal fallback from product fields")

    const specs: Array<{ category: string; items: Array<{ label: string; value: string }> }> = []

    // Product Identification - only include if data exists
    const identificationItems: Array<{ label: string; value: string }> = []
    if (p?.brand?.name) identificationItems.push({ label: "Brand", value: p.brand.name })
    if (p?.name) identificationItems.push({ label: "Model", value: p.name })
    if (p?.sku) identificationItems.push({ label: "SKU", value: p.sku })

    if (identificationItems.length > 0) {
      specs.push({
        category: "Product Identification",
        items: identificationItems,
      })
    }

    // Specifications - only include actual product fields
    const physicalItems: Array<{ label: string; value: string }> = []
    if (p?.weight) physicalItems.push({ label: "Weight", value: `${p.weight}kg` })
    if (p?.dimensions) {
      if (typeof p.dimensions === "object" && p.dimensions !== null) {
        const { height, length, width } = p.dimensions as any
        if (height && length && width) {
          physicalItems.push({ label: "Dimensions", value: `${length}L × ${width}W × ${height}H cm` })
        }
      } else if (typeof p.dimensions === "string" && p.dimensions) {
        physicalItems.push({ label: "Dimensions", value: p.dimensions })
      }
    }
    if (p?.material) physicalItems.push({ label: "Material", value: p.material })
    if (p?.color) physicalItems.push({ label: "Color", value: p.color })

    if (physicalItems.length > 0) {
      specs.push({ category: "Specifications", items: physicalItems })
    }

    // Package Contents - only if product has it
    const packageItems: Array<{ label: string; value: string }> = []
    if (p?.package_contents && Array.isArray(p.package_contents)) {
      p.package_contents.forEach((item: string, idx: number) => {
        packageItems.push({ label: `Item ${idx + 1}`, value: item })
      })
    }

    if (packageItems.length > 0) {
      specs.push({ category: "What's in the Box", items: packageItems })
    }

    // Available Options & Variants - only if variants exist
    if (p?.variants && p.variants.length) {
      const colors = [...new Set(p.variants.map((v: any) => v.color).filter(Boolean))]
      const sizes = [...new Set(p.variants.map((v: any) => v.size).filter(Boolean))]
      const variantItems: Array<{ label: string; value: string }> = []
      if (colors.length) variantItems.push({ label: "Available Colors", value: colors.join(", ") })
      if (sizes.length) variantItems.push({ label: "Available Sizes", value: sizes.join(", ") })
      if (variantItems.length) specs.push({ category: "Available Options", items: variantItems })
    }

    return specs
  }
  const specifications = getProductSpecifications(product)

  const calculateAverageRating = () => {
    return reviewSummary?.average_rating || 0
  }

  const stockDisplay = (() => {
    if (isLoadingInventory)
      return {
        icon: Info,
        text: "Checking availability...",
        cls: "text-gray-500 bg-gray-50 border-gray-200",
        ic: "text-gray-500",
      }
    if (inventoryError)
      return {
        icon: AlertTriangle,
        text: "Unable to check stock",
        cls: "text-orange-600 bg-orange-50 border-orange-200",
        ic: "text-orange-600",
      }
    if (!inventoryData)
      return {
        icon: XCircle,
        text: "Stock information unavailable",
        cls: "text-gray-500 bg-gray-50 border-gray-200",
        ic: "text-gray-500",
      }
    switch (inventoryData.stock_status) {
      case "in_stock":
        return {
          icon: CheckCircle,
          text: `${inventoryData.available_quantity} in stock`,
          cls: "text-emerald-600 bg-emerald-50 border-emerald-200",
          ic: "text-emerald-600",
        }
      case "low_stock":
        return {
          icon: AlertTriangle,
          text: `Only ${inventoryData.available_quantity} left`,
          cls: "text-amber-600 bg-amber-50 border-amber-200",
          ic: "text-amber-600",
        }
      case "out_of_stock":
        return { icon: XCircle, text: "Out of stock", cls: "text-red-600 bg-red-50 border-red-200", ic: "text-red-600" }
      default:
        return {
          icon: Info,
          text: "Stock status unknown",
          cls: "text-gray-500 bg-gray-50 border-gray-200",
          ic: "text-gray-500",
        }
    }
  })()

  const LuxuryPill = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        className,
      )}
    >
      {children}
    </span>
  )

  const SectionCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ children, className = "", ...props }, ref) => (
      <div
        {...props}
        ref={ref}
        className={cn(
          "bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden",
          className,
        )}
      >
        {children}
      </div>
    ),
  )

  const handleBuyViaWhatsApp = () => {
    const whatsappNumber = "254746741719" // Updated WhatsApp number with country code
    const message = encodeURIComponent(
      `I'm interested in buying ${product.name}. Price: ${formatPrice(currentPrice)}. Quantity: ${quantity}. Please assist me with the purchase.`,
    )
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank")
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center">
        <Loader />
        <p className="mt-4 text-sm text-gray-500 font-medium tracking-wide">Loading product details...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Cart Toast - refined design */}
      <AnimatePresence>
        {showCartNotification && cartNotificationData && (
          <motion.div
            {...appleVariants.scaleIn}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
            role="status"
            aria-live="polite"
          >
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                  <Image
                    src={cartNotificationData?.thumbnail_url || "/placeholder.svg?height=56&width=56&query=thumb"}
                    alt={cartNotificationData?.name || "Product"}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">
                    {cartNotificationData?.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm mt-1.5">
                    <span className="font-bold text-[#8B0000]">{formatPrice(cartNotificationData?.price || 0)}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">Qty: {cartNotificationData?.quantity || 1}</span>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCartNotification(false)}
                  className="flex-1 h-11 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Continue
                </button>
                <Link href="/cart" className="flex-1">
                  <button className="w-full h-11 rounded-xl bg-[#8B0000] text-white text-sm font-semibold hover:bg-[#6B0000] transition-colors">
                    View Cart ({cartItems.length})
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumbs - refined typography */}
      <motion.div {...appleVariants.fadeIn} className="bg-white border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="flex items-center hover:text-[#8B0000] font-medium transition-colors">
              <Home className="mr-1.5 h-4 w-4" />
              Home
            </Link>
            <ChevronRight className="mx-2 h-4 w-4 text-gray-300" />
            <Link href="/products" className="hover:text-[#8B0000] font-medium transition-colors">
              Products
            </Link>
            <ChevronRight className="mx-2 h-4 w-4 text-gray-300" />
            <span className="text-gray-900 font-medium truncate">{product?.name}</span>
          </nav>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Gallery + Details */}
          <motion.div {...appleVariants.fadeIn} className="lg:col-span-8 space-y-5">
            <SectionCard>
              {/* Seller header - refined */}
              <div className="p-4 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg border border-gray-100 p-1.5 bg-white shadow-sm">
                      <Image
                        src="/logo.png"
                        alt="Mizizzi Logo"
                        fill
                        sizes="40px"
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-1.5">
                        <LuxuryPill className="bg-[#8B0000]/5 border-[#8B0000]/20 text-[#8B0000]">
                          <Shield className="w-3 h-3 mr-1" />
                          Official Store
                        </LuxuryPill>
                        {product?.is_luxury_deal && (
                          <LuxuryPill className="bg-violet-50 border-violet-200 text-violet-700">
                            <Award className="w-3 h-3 mr-1" />
                            Premium
                          </LuxuryPill>
                        )}
                        {product?.is_flash_sale && (
                          <LuxuryPill className="bg-amber-50 border-amber-200 text-amber-700">
                            <Zap className="w-3 h-3 mr-1" />
                            Flash Sale
                          </LuxuryPill>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-2">
                        <span className="font-medium">Verified Seller</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-[#8B0000] text-[#8B0000]" />
                          <span className="font-semibold text-gray-700">{product?.rating || 4.7}</span>
                          <span className="text-gray-400">({product?.reviews?.length || 24})</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <motion.button
                      aria-label={isProductInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                      onClick={handleToggleWishlist}
                      disabled={isTogglingWishlist}
                      className={cn(
                        "relative p-2.5 rounded-full transition-all duration-200",
                        isTogglingWishlist && "opacity-50 cursor-not-allowed",
                        isProductInWishlist
                          ? "text-[#8B0000] bg-[#8B0000]/10 hover:bg-[#8B0000]/15"
                          : "text-gray-400 hover:text-[#8B0000] hover:bg-[#8B0000]/5",
                      )}
                      whileHover={!isTogglingWishlist ? { scale: 1.05 } : {}}
                      whileTap={!isTogglingWishlist ? { scale: 0.95 } : {}}
                    >
                      <Heart
                        className={cn("h-5 w-5 transition-all duration-200", isProductInWishlist && "fill-[#8B0000]")}
                      />
                    </motion.button>
                    <motion.button
                      aria-label="Share product"
                      onClick={handleShare}
                      className="p-2.5 rounded-full text-gray-400 hover:text-[#8B0000] hover:bg-[#8B0000]/5 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Share2 className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Gallery - same structure but refined */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Thumbnails */}
                  <div className="hidden md:block md:col-span-2">
                    <div className="space-y-2">
                      {productImages.map((img, i) => (
                        <motion.button
                          key={i}
                          className={cn(
                            "relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200",
                            selectedImage === i
                              ? "border-[#8B0000] shadow-sm"
                              : "border-gray-100 hover:border-[#8B0000]/50",
                          )}
                          onClick={() => setSelectedImage(i)}
                          aria-label={`Thumbnail ${i + 1}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Image
                            src={img || "/placeholder.svg?height=80&width=80&query=thumb"}
                            alt={`${product?.name} thumbnail ${i + 1}`}
                            fill
                            sizes="80px"
                            className="object-cover w-full h-full"
                          />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Main image */}
                  <div className="md:col-span-10">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="relative border border-gray-100 rounded-2xl overflow-hidden bg-white group cursor-zoom-in aspect-[4/3]"
                      ref={imageRef}
                      onClick={handleImageClick}
                    >
                      <Image
                        src={
                          getProductImageUrl(product, selectedImage) ||
                          "/placeholder.svg?height=600&width=800&query=main" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt={product?.name || "Product image"}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 65vw, 60vw"
                        className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-[1.02]"
                        priority
                      />
                      {productImages.length > 1 && (
                        <>
                          <motion.button
                            aria-label="Previous image"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 border border-gray-100 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedImage((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <ArrowLeft className="h-4 w-4 text-gray-700" />
                          </motion.button>
                          <motion.button
                            aria-label="Next image"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 border border-gray-100 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedImage((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <ArrowRight className="h-4 w-4 text-gray-700" />
                          </motion.button>
                        </>
                      )}
                      {discountPercentage > 0 && (
                        <div className="absolute top-3 left-3 bg-[#8B0000] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                          -{discountPercentage}%
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span className="font-medium">Zoom</span>
                      </div>
                    </motion.div>

                    {/* Mobile thumbnails */}
                    <div className="md:hidden mt-3">
                      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                        {productImages.map((img, i) => (
                          <motion.button
                            key={i}
                            className={cn(
                              "relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all snap-start",
                              selectedImage === i ? "border-[#8B0000]" : "border-gray-100 hover:border-[#8B0000]/50",
                            )}
                            onClick={() => setSelectedImage(i)}
                            aria-label={`Thumbnail ${i + 1}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Image
                              src={img || "/placeholder.svg?height=64&width=64&query=thumb"}
                              alt={`Thumbnail ${i + 1}`}
                              fill
                              sizes="64px"
                              className="object-cover w-full h-full"
                            />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Product Highlights */}
            {product?.features && product.features.length > 0 && (
              <SectionCard>
                <div className="p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-4 tracking-tight">Key Highlights</h2>
                  <ul className="space-y-2.5">
                    {product.features.map((f: string, i: number) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-3 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <div className="w-5 h-5 rounded-full bg-[#8B0000]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-[#8B0000]" />
                        </div>
                        <span className="text-gray-700 leading-relaxed">{f}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </SectionCard>
            )}

            {/* Product Details */}
            <SectionCard>
              <div className="p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4 tracking-tight">Product Details</h2>
                <div
                  className="rich-product-description prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-headings:font-semibold prose-p:leading-relaxed prose-li:text-gray-600"
                  dangerouslySetInnerHTML={{
                    __html:
                      product?.description ||
                      '<p class="text-gray-400 italic">No description available for this product.</p>',
                  }}
                />
              </div>
            </SectionCard>

            {/* Specifications */}
            {showSpecifications && specifications.length > 0 && (
              <SectionCard>
                <div className="p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-4 tracking-tight">Specifications</h2>
                  <div className="space-y-5">
                    {specifications.map((spec, i) => (
                      <div key={i}>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                          {spec.category}
                        </h3>
                        <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden">
                          {spec.items.map((it: { label: string; value: string }, idx: number) => (
                            <div
                              key={idx}
                              className="px-4 py-3 flex justify-between items-center text-sm bg-gray-50/30 hover:bg-gray-50/70 transition-colors"
                            >
                              <span className="text-gray-500">{it.label}</span>
                              <span className="text-gray-900 font-medium">{String(it.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            )}

            <SectionCard id="reviews" ref={reviewSectionRef}>
              <div className="p-5">
                {/* Header with title and summary */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Customer Reviews</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {isLoadingReviews ? "Loading..." : `${reviewSummary?.verified_reviews || 0} verified reviews`}
                    </p>
                  </div>
                </div>

                {/* Rating Overview - Jumia style horizontal layout */}
                <div className="bg-gray-50/70 rounded-xl p-5 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    {/* Average rating display */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-5xl font-black text-gray-900 tracking-tight">
                          {isLoadingReviews ? "-" : reviewSummary?.average_rating?.toFixed(1) || "0.0"}
                        </div>
                        <div className="flex justify-center mt-1.5">
                          <StarRating rating={calculateAverageRating()} size={16} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5 font-medium">
                          {isLoadingReviews ? "..." : `${reviewSummary?.total_reviews || 0} ratings`}
                        </p>
                      </div>
                    </div>

                    {/* Rating distribution bars - Jumia style */}
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star: number) => {
                        const starKey = String(star) as "5" | "4" | "3" | "2" | "1"
                        const count = reviewSummary?.rating_distribution?.[starKey] || 0
                        const total = reviewSummary?.total_reviews || 1
                        const percentage = Math.round((count / total) * 100)
                        return (
                          <div key={star} className="flex items-center gap-3 text-sm group cursor-pointer">
                            <div className="flex items-center gap-1 w-12">
                              <span className="text-gray-700 font-semibold">{star}</span>
                              <Star className="h-3.5 w-3.5 text-[#8B0000] fill-[#8B0000]" />
                            </div>
                            <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-[#8B0000] rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, delay: star * 0.05 }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs text-gray-500 font-medium">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Sort/Filter options - Jumia style */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <div className="flex gap-1">
                      {[
                        { key: "created_at", label: "Most Recent" },
                        { key: "rating", label: "Highest" },
                        { key: "lowest", label: "Lowest" },
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() => setReviewSortBy(option.key as any)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                            reviewSortBy === option.key
                              ? "bg-[#8B0000] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reviews list - Jumia style with usernames prominent */}
                {isLoadingReviews ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-3 border-[#8B0000] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 mt-3">Loading reviews...</p>
                  </div>
                ) : reviewError ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-red-500">{reviewError}</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-base font-semibold text-gray-900 mb-1">No reviews yet</p>
                    <p className="text-sm text-gray-500">Be the first to share your experience!</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {(showAllReviews ? reviews : reviews.slice(0, 5)).map((review, index) => {
                      const isLiked = likedReviews.has(review.id)
                      const isAnimating = animatingReviews.has(review.id)
                      // Calculate the effective like count for display
                      const effectiveLikes = (review.likes_count || 0) + (likedReviews.has(review.id) ? 1 : 0)
                      return (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn("py-5", index !== 0 && "border-t border-gray-100")}
                        >
                          {/* Reviewer info - Jumia style with prominent username */}
                          <div className="flex items-start gap-3 mb-3">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B0000]/20 to-[#8B0000]/5 flex items-center justify-center flex-shrink-0 border border-[#8B0000]/10">
                              <span className="text-sm font-bold text-[#8B0000]">
                                {review.user?.name?.charAt(0)?.toUpperCase() || "U"}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Name and verified badge */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">
                                  {review.user?.name || "Anonymous User"}
                                </span>
                                {review.is_verified_purchase && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-md border border-emerald-200">
                                    <BadgeCheck className="w-3 h-3" />
                                    Verified Purchase
                                  </span>
                                )}
                              </div>

                              {/* Rating and date */}
                              <div className="flex items-center gap-3 mt-1">
                                <StarRating rating={review.rating} size={14} />
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  {getTimeAgo(review.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Review content */}
                          <div className="ml-13 pl-0.5">
                            {review.title && (
                              <h4 className="font-semibold text-gray-900 text-sm mb-1.5">{review.title}</h4>
                            )}
                            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>

                            {/* Helpful button - Jumia style with Apple-like animation */}
                            <div className="flex items-center gap-4 mt-4">
                              <button
                                onClick={() => handleMarkHelpful(review.id)}
                                disabled={animatingReviews.has(review.id)}
                                className={`
                                  group inline-flex items-center gap-2 text-xs transition-all duration-200 ease-out
                                  ${
                                    likedReviews.has(review.id)
                                      ? "text-[#8B0000]"
                                      : "text-gray-500 hover:text-[#8B0000]"
                                  }
                                `}
                              >
                                <div
                                  className={`
                                    relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ease-out
                                    ${
                                      likedReviews.has(review.id)
                                        ? "bg-[#8B0000]/15 shadow-sm"
                                        : "bg-gray-100 group-hover:bg-[#8B0000]/10"
                                    }
                                    ${animatingReviews.has(review.id) ? "scale-90" : "scale-100 active:scale-95"}
                                  `}
                                >
                                  {/* Animated ripple effect */}
                                  {animatingReviews.has(review.id) && (
                                    <span className="absolute inset-0 rounded-lg bg-[#8B0000]/20 animate-ping" />
                                  )}
                                  <ThumbsUp
                                    className={`
                                      h-3.5 w-3.5 transition-all duration-300 ease-out
                                      ${likedReviews.has(review.id) ? "fill-[#8B0000] stroke-[#8B0000]" : ""}
                                      ${animatingReviews.has(review.id) ? "scale-125 rotate-[-10deg]" : "scale-100 rotate-0"}
                                    `}
                                  />
                                  <span className="font-medium">
                                    {likedReviews.has(review.id) ? "Helpful!" : "Helpful"}
                                  </span>
                                  {effectiveLikes > 0 && (
                                    <span
                                      className={`
                                        transition-all duration-200
                                        ${likedReviews.has(review.id) ? "text-[#8B0000]/70" : "text-gray-400"}
                                      `}
                                    >
                                      ({effectiveLikes})
                                    </span>
                                  )}
                                </div>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {/* Show more/less button */}
                {reviews.length > 5 && (
                  <motion.button
                    className="mt-6 w-full py-3 text-sm font-semibold text-[#8B0000] hover:text-[#6B0000] border-2 border-[#8B0000]/20 hover:border-[#8B0000]/40 rounded-xl hover:bg-[#8B0000]/5 transition-all"
                    onClick={() => setShowAllReviews((s) => !s)}
                    whileTap={{ scale: 0.98 }}
                  >
                    {showAllReviews ? "Show Less Reviews" : `View All ${reviews.length} Reviews`}
                  </motion.button>
                )}
              </div>
            </SectionCard>

            {/* Recently Viewed */}
            {!!recentlyViewed.length && (
              <SectionCard>
                <div className="p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-4 tracking-tight">Recently Viewed</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {recentlyViewed.map((item, i) => (
                      <motion.div
                        key={item.id || i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link href={`/product/${item.slug || item.id}`} className="group block">
                          <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                            <Image
                              src={
                                item.image || item.thumbnail_url || "/placeholder.svg?height=120&width=120&query=recent"
                              }
                              alt={item.name}
                              fill
                              sizes="80px"
                              className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                            />
                          </div>
                          <h4 className="text-xs font-medium text-gray-900 mt-2 line-clamp-2 group-hover:text-[#8B0000] transition-colors leading-tight">
                            {item.name}
                          </h4>
                          <p className="text-xs font-bold text-[#8B0000] mt-1">{formatPrice(item.price)}</p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            )}
          </motion.div>

          {/* RIGHT: Pricing + Actions */}
          <motion.div {...appleVariants.slideUp} className="lg:col-span-4 space-y-5">
            {/* Mobile product title */}
            <h1 className="text-xl font-bold text-gray-900 leading-tight lg:hidden px-1">{product?.name}</h1>

            <SectionCard className="lg:sticky lg:top-6">
              <div className="p-5">
                <h1 className="text-lg font-bold text-gray-900 mb-4 leading-tight hidden lg:block">{product?.name}</h1>

                {/* Pricing Section - refined */}
                <div className="mb-5 pb-5 border-b border-gray-100">
                  <div className="flex items-baseline gap-2.5 mb-2.5">
                    <span className="text-3xl font-black text-gray-900 tracking-tight">
                      {formatPrice(currentPrice)}
                    </span>
                    {currentPrice < originalPrice && (
                      <span className="text-gray-400 line-through text-base">{formatPrice(originalPrice)}</span>
                    )}
                    {discountPercentage > 0 && (
                      <span className="text-xs font-bold bg-[#8B0000]/10 text-[#8B0000] px-2 py-1 rounded-md">
                        -{discountPercentage}%
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg border",
                      stockDisplay.cls,
                    )}
                    aria-live="polite"
                  >
                    <stockDisplay.icon className={cn("h-3.5 w-3.5 mr-1.5", stockDisplay.ic)} />
                    {stockDisplay.text}
                  </div>
                </div>

                {/* Variants Section */}
                {product?.variants?.length > 0 && (
                  <div className="mb-5 pb-5 border-b border-gray-100 space-y-4">
                    {Array.from(new Set(product.variants.map((v: any) => v.color))).filter(Boolean).length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                          Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(Array.from(new Set(product.variants.map((v: any) => v.color))) as string[])
                            .filter(Boolean)
                            .map((color, i) => {
                              const active = selectedVariant?.color === color
                              return (
                                <motion.button
                                  key={i}
                                  onClick={() => {
                                    const v = product.variants.find((x: any) => x.color === color)
                                    if (v) handleVariantSelection(v)
                                  }}
                                  className={cn(
                                    "px-4 h-9 rounded-lg text-xs font-semibold transition-all",
                                    active
                                      ? "bg-[#8B0000] text-white shadow-sm"
                                      : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-[#8B0000]/50",
                                  )}
                                  whileTap={{ scale: 0.97 }}
                                >
                                  {color}
                                </motion.button>
                              )
                            })}
                        </div>
                      </div>
                    )}
                    {Array.from(new Set(product.variants.map((v: any) => v.size))).filter(Boolean).length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                          Size
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(Array.from(new Set(product.variants.map((v: any) => v.size))) as string[])
                            .filter(Boolean)
                            .map((size, i) => {
                              const active = selectedVariant?.size === size
                              return (
                                <motion.button
                                  key={i}
                                  onClick={() => {
                                    const v = product.variants.find((x: any) => x.size === size)
                                    if (v) handleVariantSelection(v)
                                  }}
                                  className={cn(
                                    "px-4 h-9 rounded-lg text-xs font-semibold transition-all",
                                    active
                                      ? "bg-[#8B0000] text-white shadow-sm"
                                      : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-[#8B0000]/50",
                                  )}
                                  whileTap={{ scale: 0.97 }}
                                >
                                  {size}
                                </motion.button>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity Selector - refined */}
                <div className="mb-5 pb-5 border-b border-gray-100">
                  <label className="block text-xs font-bold text-gray-700 mb-2.5 uppercase tracking-wider">
                    Quantity
                  </label>
                  <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    <motion.button
                      aria-label="Decrease quantity"
                      className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Minus className="h-4 w-4" />
                    </motion.button>
                    <div className="w-14 h-11 flex items-center justify-center bg-white border-l border-r border-gray-200">
                      <span className="text-sm font-bold text-gray-900">{quantity}</span>
                    </div>
                    <motion.button
                      aria-label="Increase quantity"
                      className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                      onClick={() => setQuantity((q) => Math.min(inventoryData?.available_quantity || 0, q + 1))}
                      disabled={!inventoryData?.is_in_stock || quantity >= (inventoryData?.available_quantity || 0)}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="h-4 w-4" />
                    </motion.button>
                  </div>
                  {inventoryData && inventoryData.available_quantity > 0 && (
                    <p className="text-[11px] text-gray-400 mt-2 font-medium">
                      {inventoryData.available_quantity} available
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <motion.button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || !inventoryData?.is_in_stock}
                    className={cn(
                      "w-full h-12 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2.5",
                      isAddingToCart || !inventoryData?.is_in_stock
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-[#8B0000] hover:bg-[#6B0000] active:bg-[#5A0000] shadow-lg shadow-[#8B0000]/25 hover:shadow-xl hover:shadow-[#8B0000]/30",
                    )}
                    whileTap={inventoryData?.is_in_stock ? { scale: 0.98 } : {}}
                  >
                    {isAddingToCart ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        <span>{inventoryData?.is_in_stock ? "Add to Cart" : "Out of Stock"}</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    className={cn(
                      "w-full h-12 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2.5",
                      isAddingToCart || !inventoryData?.is_in_stock
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-[#25D366] hover:bg-[#20BA58] active:bg-[#1aa34a] shadow-lg shadow-[#25D366]/25",
                    )}
                    onClick={handleBuyViaWhatsApp}
                    disabled={isAddingToCart || !inventoryData?.is_in_stock}
                    whileTap={inventoryData?.is_in_stock ? { scale: 0.98 } : {}}
                  >
                    <FaWhatsapp className="h-5 w-5" />
                    <span>Buy via WhatsApp</span>
                  </motion.button>
                </div>

                {/* Payment Options - refined */}
                <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CreditCard className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="font-medium">Visa, Mastercard, M-Pesa, Airtel Money</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Trust Signals - refined */}
            <SectionCard>
              <div className="p-5 grid grid-cols-2 gap-3">
                <motion.div
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-[#8B0000]/5 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#8B0000]/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-[#8B0000]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">100% Genuine</p>
                    <p className="text-xs text-gray-500 mt-0.5">Verified quality</p>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-[#8B0000]/5 transition-colors"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#8B0000]/10 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="h-5 w-5 text-[#8B0000]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Easy Returns</p>
                    <p className="text-xs text-gray-500 mt-0.5">14-day guarantee</p>
                  </div>
                </motion.div>
              </div>
            </SectionCard>
          </motion.div>
        </div>

        {/* Low Stock Warning - refined */}
        {inventoryData && inventoryData.available_quantity > 0 && inventoryData.available_quantity <= 10 && (
          <motion.div {...appleVariants.fadeIn} className="mt-6 p-4 bg-amber-50 rounded-xl border-l-4 border-amber-500">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                Only {inventoryData.available_quantity} left in stock — order soon!
              </p>
            </div>
          </motion.div>
        )}

        <div className="h-28 lg:hidden" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 lg:hidden z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="flex items-stretch gap-2.5">
            <motion.button
              onClick={handleAddToCart}
              disabled={isAddingToCart || !inventoryData?.is_in_stock}
              className={cn(
                "group relative flex-1 h-12 rounded-xl text-white text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden",
                isAddingToCart || !inventoryData?.is_in_stock
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#8B0000] hover:bg-[#6B0000] active:bg-[#5A0000] shadow-md shadow-[#8B0000]/25",
              )}
              whileTap={inventoryData?.is_in_stock ? { scale: 0.97 } : {}}
            >
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              {isAddingToCart ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4.5 w-4.5 transition-transform group-hover:scale-110" strokeWidth={2.5} />
                  <span>{inventoryData?.is_in_stock ? "Add to Cart" : "Out of Stock"}</span>
                </>
              )}
            </motion.button>

            <motion.button
              className={cn(
                "flex-1 h-12 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-2",
                isAddingToCart || !inventoryData?.is_in_stock
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#25D366] hover:bg-[#1ebe5d] active:bg-[#1aa34a] shadow-md shadow-[#25D366]/25",
              )}
              onClick={handleBuyViaWhatsApp}
              disabled={isAddingToCart || !inventoryData?.is_in_stock}
              whileTap={inventoryData?.is_in_stock ? { scale: 0.97 } : {}}
            >
              <FaWhatsapp className="h-5 w-5" />
              <span>WhatsApp</span>
            </motion.button>
          </div>
        </div>
      </div>

      <ImageZoomModal
        product={product}
        isOpen={isImageZoomModalOpen}
        onClose={() => setIsImageZoomModalOpen(false)}
        selectedImageIndex={zoomSelectedImage}
      />
    </div>
  )
}
