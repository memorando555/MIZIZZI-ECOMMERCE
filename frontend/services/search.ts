/**
 * Search service for handling all search-related API calls
 */

export interface SearchFilters {
  category_id?: number
  brand_id?: number
  min_price?: number
  max_price?: number
  in_stock?: boolean
  featured?: boolean
  new?: boolean
  on_sale?: boolean
  flash_sale?: boolean
  luxury_deal?: boolean
  min_rating?: number
}

export interface SearchParams extends SearchFilters {
  q?: string
  sort_by?: "relevance" | "name" | "price" | "created_at" | "updated_at" | "stock"
  sort_order?: "asc" | "desc"
  page?: number
  per_page?: number
}

export interface SearchSuggestion {
  type: "product" | "category" | "brand"
  text: string
  category: string
}

export interface SearchResponse {
  success: boolean
  products: any[]
  pagination: {
    page: number
    per_page: number
    total_pages: number
    total_items: number
    has_next: boolean
    has_prev: boolean
    next_page?: number
    prev_page?: number
  }
  search_metadata: {
    query: string
    filters_applied: number
    sort_by: string
    sort_order: string
    search_time: string
  }
}

export interface FilterOption {
  id: number
  name: string
  slug: string
  product_count: number
}

export interface SearchFiltersResponse {
  success: boolean
  filters: {
    categories: FilterOption[]
    brands: FilterOption[]
    price_range: {
      min: number
      max: number
    }
    rating_distribution: Array<{
      rating: number
      count: number
    }>
    sort_options: Array<{
      value: string
      label: string
    }>
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com/api"

class SearchService {
  /**
   * Search for products with filters and pagination
   */
  async searchProducts(params: SearchParams): Promise<SearchResponse> {
    try {
      const searchParams = new URLSearchParams()

      // Add all parameters to search params
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`${API_BASE_URL}/search?${searchParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      // Return empty response if API is unavailable
      return {
        success: false,
        products: [],
        pagination: {
          page: 1,
          per_page: 0,
          total_pages: 0,
          total_items: 0,
          has_next: false,
          has_prev: false,
        },
        search_metadata: {
          query: params.q || "",
          filters_applied: 0,
          sort_by: params.sort_by || "relevance",
          sort_order: params.sort_order || "desc",
          search_time: "0ms",
        },
      }
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(query: string, limit = 10): Promise<SearchSuggestion[]> {
    try {
      if (query.length < 2) {
        return []
      }

      const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`Suggestions failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.suggestions || []
    } catch (error) {
      // Silently return empty suggestions if API is unavailable
      return []
    }
  }

  /**
   * Get available search filters
   */
  async getSearchFilters(): Promise<SearchFiltersResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/search/filters`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to get filters: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error getting search filters:", error)
      throw error
    }
  }

  /**
   * Get popular searches and trending products
   */
  async getPopularSearches(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/search/popular`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`Failed to get popular searches: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      // Return empty response if API is unavailable
      return { popular_searches: [], trending_products: [] }
    }
  }

  /**
   * Build search URL with parameters (for navigation)
   */
  buildSearchUrl(params: SearchParams): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString())
      }
    })

    return `/search?${searchParams.toString()}`
  }

  /**
   * Parse search parameters from URL
   */
  parseSearchParams(searchParams: URLSearchParams): SearchParams {
    const params: SearchParams = {}

    // String parameters
    const stringParams = ["q", "sort_by", "sort_order"]
    stringParams.forEach((param) => {
      const value = searchParams.get(param)
      if (value) {
        ;(params as any)[param] = value
      }
    })

    // Number parameters
    const numberParams = ["category_id", "brand_id", "min_price", "max_price", "min_rating", "page", "per_page"]
    numberParams.forEach((param) => {
      const value = searchParams.get(param)
      if (value && !isNaN(Number(value))) {
        ;(params as any)[param] = Number(value)
      }
    })

    // Boolean parameters
    const booleanParams = ["in_stock", "featured", "new", "on_sale", "flash_sale", "luxury_deal"]
    booleanParams.forEach((param) => {
      const value = searchParams.get(param)
      if (value === "true" || value === "false") {
        ;(params as any)[param] = value === "true"
      }
    })

    return params
  }
}

export const searchService = new SearchService()
export default searchService
