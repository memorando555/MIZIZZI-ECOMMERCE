import type { Product } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

interface ProductDetailsData {
  product: Product | null
  reviews: any[]
  reviewSummary: {
    average_rating: number
    total_reviews: number
    verified_reviews: number
    rating_distribution: { [key: number]: number }
  } | null
  inventory: {
    available_quantity: number
    is_in_stock: boolean
    is_low_stock: boolean
    stock_status: "in_stock" | "low_stock" | "out_of_stock"
  } | null
  relatedProducts: Product[]
}

// Generate mock reviews for products without reviews
function generateMockReviews() {
  return [
    {
      id: 1,
      rating: 5,
      reviewer_name: "Jane Doe",
      comment:
        "Excellent product! I love the quality and design. The material feels premium and it's exactly as described.",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      verified_purchase: true,
      helpful_count: 12,
    },
    {
      id: 2,
      rating: 4,
      reviewer_name: "John Smith",
      comment: "Good product overall. Shipping was fast and the item matches the description.",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      verified_purchase: true,
      helpful_count: 5,
    },
    {
      id: 3,
      rating: 5,
      reviewer_name: "Mary Johnson",
      comment: "I'm extremely satisfied with this purchase! The product arrived earlier than expected.",
      date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      verified_purchase: true,
      helpful_count: 8,
    },
  ]
}

// Determine product type
function determineProductType(product: any) {
  if (
    product.category_id === "luxury" ||
    product.category_id === "premium" ||
    (typeof product.category === "object" &&
      (product.category?.name?.toLowerCase().includes("luxury") ||
        product.category?.name?.toLowerCase().includes("premium"))) ||
    (Array.isArray(product.tags) &&
      product.tags.some((tag: string) => tag.toLowerCase().includes("luxury") || tag.toLowerCase().includes("premium")))
  ) {
    return "luxury"
  }

  if (
    product.sale_price &&
    product.sale_price < product.price &&
    ((Array.isArray(product.tags) && product.tags.some((tag: string) => tag.toLowerCase().includes("flash"))) ||
      product.is_flash_sale)
  ) {
    return "flash_sale"
  }

  return "regular"
}

export async function getProductDetails(id: string): Promise<ProductDetailsData> {
  try {
    // Check if the ID is numeric or a slug
    const isNumericId = /^\d+$/.test(id)
    const endpoint = isNumericId ? `${API_BASE_URL}/api/products/${id}` : `${API_BASE_URL}/api/products/slug/${id}`

    // Fetch product data
    const productResponse = await fetch(endpoint, {
      next: { revalidate: 60, tags: [`product-${id}`] },
    })

    if (!productResponse.ok) {
      return {
        product: null,
        reviews: [],
        reviewSummary: null,
        inventory: null,
        relatedProducts: [],
      }
    }

    const productData = await productResponse.json()
    const product = productData.product || productData

    if (!product) {
      return {
        product: null,
        reviews: [],
        reviewSummary: null,
        inventory: null,
        relatedProducts: [],
      }
    }

    // Add product type
    product.product_type = determineProductType(product)

    // Add mock features if not present
    if (!product.features) {
      product.features = [
        "Premium quality materials for exceptional durability",
        "Ergonomic design for maximum comfort during extended use",
        "Versatile functionality suitable for various occasions",
        "Modern aesthetic that complements any style or setting",
      ]
    }

    // Add mock package contents if not present
    if (!product.package_contents) {
      product.package_contents = [
        `1 x ${product.name}`,
        "Detailed User Manual",
        "Warranty Card (2 Years)",
        "Quick Start Guide",
      ]
    }

    // Fetch inventory, reviews, and related products in parallel
    const [inventoryData, reviewsData, relatedData] = await Promise.all([
      // Inventory
      fetch(`${API_BASE_URL}/api/inventory/${product.id}`, {
        next: { revalidate: 30, tags: [`inventory-${product.id}`] },
      })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),

      // Reviews
      fetch(`${API_BASE_URL}/api/reviews?product_id=${product.id}&limit=10`, {
        next: { revalidate: 60, tags: [`reviews-${product.id}`] },
      })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),

      // Related products
      product.category_id
        ? fetch(`${API_BASE_URL}/api/products?category_id=${product.category_id}&limit=6`, {
            next: { revalidate: 60, tags: ["related-products"] },
          })
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        : Promise.resolve(null),
    ])

    // Process inventory
    type Inventory = NonNullable<ProductDetailsData["inventory"]>
    let inventory: Inventory | null = null
    if (inventoryData) {
      const rawAvailable = inventoryData.available_quantity ?? inventoryData.stock ?? product.stock ?? 0
      const available = Number(rawAvailable) || 0
      const stock_status: Inventory["stock_status"] =
        available === 0 ? "out_of_stock" : available <= 5 ? "low_stock" : "in_stock"
      inventory = {
        available_quantity: available,
        is_in_stock: available > 0,
        is_low_stock: available > 0 && available <= 5,
        stock_status,
      }
    } else {
      // Fallback to product.stock
      const rawStock = product.stock ?? 0
      const stock = Number(rawStock) || 0
      const stock_status: Inventory["stock_status"] =
        stock === 0 ? "out_of_stock" : stock <= 5 ? "low_stock" : "in_stock"
      inventory = {
        available_quantity: stock,
        is_in_stock: stock > 0,
        is_low_stock: stock > 0 && stock <= 5,
        stock_status,
      }
    }

    // Process reviews
    const reviews = reviewsData?.items || reviewsData?.reviews || generateMockReviews()
    const reviewSummary = {
      average_rating: reviewsData?.summary?.average_rating || product.rating || 4.5,
      total_reviews: reviewsData?.summary?.total_reviews || reviews.length,
      verified_reviews:
        reviewsData?.summary?.verified_reviews || reviews.filter((r: any) => r.verified_purchase).length || 0,
      rating_distribution: reviewsData?.summary?.rating_distribution || { 5: 60, 4: 25, 3: 10, 2: 3, 1: 2 },
    }

    // Process related products
    const relatedProducts = (relatedData?.products || relatedData || [])
      .filter((p: any) => p.id !== product.id)
      .slice(0, 6)

    return {
      product,
      reviews,
      reviewSummary,
      inventory,
      relatedProducts,
    }
  } catch (error) {
    console.error("[SSR] Error fetching product details:", error)
    return {
      product: null,
      reviews: [],
      reviewSummary: null,
      inventory: null,
      relatedProducts: [],
    }
  }
}
