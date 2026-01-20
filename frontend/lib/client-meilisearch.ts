/**
 * Fast, direct backend search with smart filtering and scoring
 * No external dependencies - pure filtering logic
 */

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

export interface SearchParams {
  q: string
  limit?: number
  offset?: number
}

export interface SearchHit {
  id: number
  name: string
  description?: string
  price: number
  image?: string
  thumbnail_url?: string
  slug?: string
  category?: string
  brand?: string
  rating?: number
  stock?: number
  _score?: number
}

export interface SearchResponse {
  hits: SearchHit[]
  query: string
  processingTimeMs: number
  limit: number
  offset: number
  estimatedTotalHits: number
}

/**
 * Smart filtering: Products that contain the search query
 */
function filterByQuery(items: any[], query: string): any[] {
  if (!query || query.trim().length === 0) return []

  const lowerQuery = query.trim().toLowerCase()

  return items.filter((product) => {
    const name = (product.name || product.title || "").toLowerCase()
    const description = (product.description || product.desc || "").toLowerCase()
    const brand = (product.brand?.name || product.brand || "").toLowerCase()
    const category = (product.category?.name || product.category || "").toLowerCase()

    return (
      name.includes(lowerQuery) ||
      description.includes(lowerQuery) ||
      brand.includes(lowerQuery) ||
      category.includes(lowerQuery)
    )
  })
}

/**
 * Score products for relevance ranking
 */
function scoreProducts(items: any[], query: string): any[] {
  if (!query || query.trim().length === 0) return items

  const lowerQuery = query.trim().toLowerCase()

  return items.map((product) => {
    let score = 0
    const name = (product.name || product.title || "").toLowerCase()
    const description = (product.description || product.desc || "").toLowerCase()

    // Exact match = highest score
    if (name === lowerQuery) score = 1000
    // Starts with query = very high score
    else if (name.startsWith(lowerQuery)) score = 500
    // Contains as word = high score
    else if (name.includes(` ${lowerQuery}`)) score = 250
    // Contains anywhere = base score
    else if (name.includes(lowerQuery)) score = 100
    // In description = lower score
    else if (description.includes(lowerQuery)) score = 50

    return { ...product, _score: score }
  })
}

/**
 * Main search function - uses backend API directly
 */
export async function searchProducts(params: SearchParams): Promise<SearchResponse> {
  const { q, limit = 50, offset = 0 } = params

  if (!q || q.trim().length === 0) {
    return {
      hits: [],
      query: q,
      processingTimeMs: 0,
      limit,
      offset,
      estimatedTotalHits: 0,
    }
  }

  try {
    console.log("[v0] Searching:", { query: q.trim(), limit })

    const startTime = Date.now()

    // Fetch with short timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000) // 4 second timeout

    const queryParams = new URLSearchParams({
      search: q.trim(),
      per_page: String(limit * 2), // Fetch double to allow filtering
      page: "1",
    })

    const response = await fetch(`${BACKEND_URL}/api/products/?${queryParams.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    const processingTimeMs = Date.now() - startTime

    // Extract items from response
    const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : data.data || []

    // Filter products that match query
    const filtered = filterByQuery(items, q.trim())

    // Score and sort by relevance
    const scored = scoreProducts(filtered, q.trim()).sort((a, b) => (b._score || 0) - (a._score || 0))

    // Transform to SearchHit format
    const hits: SearchHit[] = scored.slice(offset, offset + limit).map((item: any) => ({
      id: item.id || item.product_id,
      name: item.name || item.title || item.product_name || "",
      description: item.description || item.desc || "",
      price: typeof item.price === "string" ? parseFloat(item.price) : item.price || 0,
      image: item.image || item.thumbnail || item.image_url || item.thumbnail_url || item.photo || "",
      thumbnail_url: item.thumbnail_url || item.image || item.image_url || item.photo || "",
      slug: `/product/${item.id || item.product_id}`,
      category: typeof item.category === "object" ? item.category?.name : item.category || item.category_name || "",
      brand: typeof item.brand === "object" ? item.brand?.name : item.brand || item.brand_name || "",
      rating: item.rating || item.average_rating || 0,
      stock: item.stock || item.quantity || item.in_stock || 0,
      _score: item._score || 0,
    }))

    console.log("[v0] Results:", { found: hits.length, time: processingTimeMs + "ms" })

    return {
      hits,
      query: q.trim(),
      processingTimeMs,
      limit,
      offset,
      estimatedTotalHits: items.length, // Return the total number of items fetched
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn("[v0] Search timeout")
      return { hits: [], query: q, processingTimeMs: 4000, limit, offset, estimatedTotalHits: 0 }
    }
    console.error("[v0] Search error:", error.message)
    return { hits: [], query: q, processingTimeMs: 0, limit, offset, estimatedTotalHits: 0 }
  }
}

/**
 * Autocomplete suggestions
 */
export async function searchAutoComplete(q: string, limit: number = 10): Promise<string[]> {
  try {
    if (!q || q.trim().length === 0) return []

    const response = await searchProducts({ q: q.trim(), limit })

    return Array.from(
      new Set(response.hits.map((hit) => hit.name).filter(Boolean).slice(0, limit))
    )
  } catch (error) {
    console.error("[v0] Autocomplete error:", error)
    return []
  }
}

/**
 * Health check
 */
export async function checkMeilisearchHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/products?per_page=1`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}
