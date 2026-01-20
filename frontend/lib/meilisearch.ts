import { MeiliSearch } from "meilisearch"

// Initialize the Meilisearch client using environment variables
// Production: https://meilisearch-v1-10-67w3.onrender.com
const meilisearchClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "https://meilisearch-v1-10-67w3.onrender.com",
  apiKey: process.env.MEILISEARCH_API_KEY || "",
})

// Index names
export const PRODUCTS_INDEX = "products"
export const CATEGORIES_INDEX = "categories"

// Product document type for Meilisearch
export interface MeiliProduct {
  id: number
  name: string
  slug: string
  description: string
  short_description?: string
  price: number
  sale_price?: number | null
  discount_percentage?: number
  image: string
  thumbnail_url?: string
  image_urls?: string[]
  category: string
  category_id?: number
  brand?: string
  brand_id?: number
  sku?: string
  stock?: number
  rating?: number
  review_count?: number
  is_featured?: boolean
  is_new?: boolean
  is_sale?: boolean
  is_flash_sale?: boolean
  is_luxury_deal?: boolean
  is_daily_find?: boolean
  is_top_pick?: boolean
  is_trending?: boolean
  is_new_arrival?: boolean
  is_active?: boolean
  is_visible?: boolean
  is_searchable?: boolean
  availability_status?: string
  created_at?: string
  updated_at?: string
}

// Category document type for Meilisearch
export interface MeiliCategory {
  id: number
  name: string
  slug: string
  description?: string
  image_url?: string
  banner_url?: string
  is_featured?: boolean
  products_count?: number
  parent_id?: number | null
}

// Search result type
export interface MeiliSearchResult<T> {
  hits: T[]
  query: string
  processingTimeMs: number
  limit: number
  offset: number
  estimatedTotalHits: number
}

// Get the products index with settings configuration
export async function getProductsIndex() {
  const index = meilisearchClient.index(PRODUCTS_INDEX)

  // Configure index settings (idempotent - safe to call multiple times)
  await index.updateSettings({
    // Fields to search
    searchableAttributes: ["name", "description", "short_description", "category", "brand", "sku"],
    // Fields for filtering
    filterableAttributes: [
      "category_id",
      "brand_id",
      "price",
      "sale_price",
      "is_featured",
      "is_new",
      "is_sale",
      "is_flash_sale",
      "is_luxury_deal",
      "is_daily_find",
      "is_top_pick",
      "is_trending",
      "is_new_arrival",
      "is_active",
      "is_visible",
      "is_searchable",
      "availability_status",
      "rating",
    ],
    // Fields for sorting
    sortableAttributes: ["price", "sale_price", "rating", "review_count", "created_at", "name"],
    // Ranking rules for relevance
    rankingRules: ["words", "typo", "proximity", "attribute", "sort", "exactness"],
    // Typo tolerance
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 4,
        twoTypos: 8,
      },
    },
  })

  return index
}

// Get the categories index with settings configuration
export async function getCategoriesIndex() {
  const index = meilisearchClient.index(CATEGORIES_INDEX)

  await index.updateSettings({
    searchableAttributes: ["name", "description", "slug"],
    filterableAttributes: ["is_featured", "parent_id"],
    sortableAttributes: ["name", "products_count"],
  })

  return index
}

// Export the client for direct access if needed
export { meilisearchClient }

// Helper function to check if Meilisearch is healthy
export async function checkMeilisearchHealth(): Promise<boolean> {
  try {
    const health = await meilisearchClient.health()
    return health.status === "available"
  } catch (error) {
    console.error("[Meilisearch] Health check failed:", error)
    return false
  }
}

// Helper function to get index stats
export async function getIndexStats(indexName: string) {
  try {
    const index = meilisearchClient.index(indexName)
    return await index.getStats()
  } catch (error) {
    console.error(`[Meilisearch] Failed to get stats for index ${indexName}:`, error)
    return null
  }
}
