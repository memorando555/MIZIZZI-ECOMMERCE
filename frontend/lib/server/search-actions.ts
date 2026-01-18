"use server"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

interface SearchOptions {
  limit?: number
  offset?: number
}

export async function searchProducts(query: string, options: SearchOptions = {}) {
  const { limit = 50, offset = 0 } = options

  // Sanitize query
  const sanitizedQuery = query.trim().replace(/[^\w\s\-]/g, '')
  
  if (!sanitizedQuery) {
    return { results: [], total: 0, search_time: 0 }
  }

  console.log("[v0] Searching products for:", sanitizedQuery)

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/meilisearch/search?q=${encodeURIComponent(sanitizedQuery)}&limit=${limit}&offset=${offset}`,
      {
        next: { revalidate: 0 }, // Always fetch fresh data
      }
    )

    if (!response.ok) {
      console.error("[Server Search] Products search failed:", response.statusText)
      return { results: [], total: 0, search_time: 0 }
    }

    const searchData = await response.json()

    const productsResults = searchData.hits || searchData.results || searchData.items || searchData.products?.results || searchData.products || []

    const transformedProducts = productsResults.map((product: any) => ({
      id: product.id || product.product_id,
      name: product.name || product.title,
      description: product.description || product.short_description || "",
      price: product.price || 0,
      image: product.image || product.thumbnail_url || product.image_url,
      category: typeof product.category === "object" ? product.category?.name : product.category,
      brand: typeof product.brand === "object" ? product.brand?.name : product.brand,
      score: product.score || product._rankingScore || 1,
    }))

    return {
      results: transformedProducts,
      total: searchData.total || searchData.estimatedTotalHits || transformedProducts.length,
      search_time: searchData.search_time || searchData.processingTimeMs / 1000 || 0,
    }
  } catch (error: any) {
    console.error("[Server Search] Error searching products:", error)
    return { results: [], total: 0, search_time: 0 }
  }
}

export async function searchCategories(query: string, options: SearchOptions = {}) {
  const { limit = 10 } = options

  // Sanitize query
  const sanitizedQuery = query.trim().replace(/[^\w\s\-]/g, '')
  
  if (!sanitizedQuery) {
    return { results: [], total: 0 }
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/meilisearch/search?q=${encodeURIComponent(sanitizedQuery)}&limit=${limit}&includeCategories=true`,
      {
        next: { revalidate: 0 },
      }
    )

    if (!response.ok) {
      return { results: [], total: 0 }
    }

    const searchData = await response.json()
    const categoriesResults = searchData.categories?.results || searchData.categories || []

    return {
      results: categoriesResults,
      total: categoriesResults.length,
    }
  } catch (error: any) {
    console.error("[Server Search] Error searching categories:", error)
    return { results: [], total: 0 }
  }
}
