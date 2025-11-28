"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseSearchProps {
  initialQuery?: string
  delay?: number
  onSearch?: (value: string) => void
}

interface SearchResult {
  id: number
  name: string
  description: string
  price: number
  image: string
  thumbnail_url?: string
  slug?: string
  category?: string
  brand?: string
  score?: number
}

interface Product {
  id: number
  name: string
  category?: string | { name: string }
  brand?: string | { name: string }
  price: number
  image?: string
}

interface Category {
  id: number
  name: string
  slug: string
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export function useSearch({ initialQuery = "", delay = 300, onSearch }: UseSearchProps = {}) {
  const [query, setQuery] = useState<string>(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTime, setSearchTime] = useState<number>(0)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchRecentSearches = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products/recent-searches?limit=8`)

      if (response.ok) {
        const data = await response.json()
        const backendRecent = data.items || data || []

        const localRecent = JSON.parse(localStorage.getItem("recentSearches") || "[]")

        const combinedRecent = [
          ...localRecent.slice(0, 4),
          ...backendRecent.filter((item: any) => !localRecent.includes(item.search_term || item.name)).slice(0, 4),
        ]

        setRecentSearches(combinedRecent.slice(0, 8))
      } else {
        const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]")
        setRecentSearches(recent.slice(0, 8))
      }
    } catch (error) {
      console.error("[v0] Failed to fetch recent searches:", error)
      const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]")
      setRecentSearches(recent.slice(0, 8))
    }
  }, [])

  const fetchInitialData = useCallback(async () => {
    try {
      await fetchRecentSearches()

      const productsResponse = await fetch(`${BACKEND_URL}/api/products?limit=10&sort_by=popularity&sort_order=desc`)

      if (productsResponse.ok) {
        const data = await productsResponse.json()
        setTrendingProducts(data.items || data || [])
      }

      const categoriesResponse = await fetch(`${BACKEND_URL}/api/categories`)
      if (categoriesResponse.ok) {
        const data = await categoriesResponse.json()
        setCategories(data.items || data || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch initial search data:", error)
    }
  }, [fetchRecentSearches])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    setIsSearching(true)
    setError(null)
  }, [])

  const clearSearch = useCallback(() => {
    setQuery("")
    setDebouncedQuery("")
    setIsSearching(false)
    setResults([])
    setError(null)
    setSuggestions([])
    setSearchTime(0)
  }, [])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Performing Meilisearch search for:", searchQuery)

      const response = await fetch(
        `${BACKEND_URL}/api/meilisearch?q=${encodeURIComponent(searchQuery.trim())}&limit=100`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        console.log("[v0] GET search failed, trying POST method")
        const postResponse = await fetch(`${BACKEND_URL}/api/meilisearch`, {
          method: "POST",
          signal: abortControllerRef.current.signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: searchQuery.trim(),
            limit: 100,
          }),
        })

        if (!postResponse.ok) {
          throw new Error(`Search failed: ${postResponse.statusText}`)
        }

        const searchData = await postResponse.json()
        processSearchResults(searchData, searchQuery)
        return
      }

      const searchData = await response.json()
      processSearchResults(searchData, searchQuery)
    } catch (error: any) {
      // Don't set error state if request was aborted
      if (error.name === "AbortError") {
        return
      }

      console.error("[v0] Meilisearch API error:", error)

      if (error.message?.includes("503") || error.message?.includes("unavailable")) {
        setError("Search service temporarily unavailable")
      } else if (!error.response) {
        setError("Network error - please check your connection")
      } else {
        setError("Search failed - please try again")
      }

      setResults([])
      setSuggestions([])
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }, [])

  const processSearchResults = useCallback((searchData: any, searchQuery: string) => {
    console.log("[v0] Meilisearch results received:", searchData)

    if (searchData.error) {
      throw new Error(searchData.error)
    }

    const resultsArray: any[] =
      searchData.hits ||
      searchData.results ||
      searchData.items ||
      searchData.products?.results ||
      searchData.products ||
      []

    const searchTime = searchData.search_time || searchData.processingTimeMs || 0
    const suggestionsData = searchData.suggestions || []

    const transformedResults = resultsArray.map((result) => ({
      id: result.id || result.product_id,
      name: result.name || result.title || result.product_name,
      description: result.description || result.desc || "",
      price: result.price || result.cost || 0,
      image: result.image || result.thumbnail || result.image_url || result.thumbnail_url || result.photo,
      thumbnail_url: result.thumbnail_url || result.image || result.image_url || result.photo,
      slug: `/product/${result.id || result.product_id}`,
      category: typeof result.category === "object" ? result.category?.name : result.category || result.category_name,
      brand: typeof result.brand === "object" ? result.brand?.name : result.brand || result.brand_name,
      score: result.score || result.relevance || result._rankingScore || 1,
    }))

    setResults(transformedResults)
    setSearchTime(searchTime)
    setSuggestions(suggestionsData)

    if (transformedResults.length > 0) {
      const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]")
      const updated = [searchQuery, ...recent.filter((s: string) => s !== searchQuery)].slice(0, 10)
      localStorage.setItem("recentSearches", JSON.stringify(updated))
      setRecentSearches(updated)
    }

    if (onSearchRef.current) {
      onSearchRef.current(searchQuery)
    }
  }, [])

  const getRecentSearches = () => recentSearches
  const getTrendingProducts = () => trendingProducts.slice(0, 6)
  const getCategories = () => categories.slice(0, 8)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [query, delay])

  useEffect(() => {
    if (debouncedQuery !== query) {
      setIsSearching(false)
    }

    performSearch(debouncedQuery)
  }, [debouncedQuery, performSearch])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    query,
    debouncedQuery,
    isSearching,
    isLoading,
    results,
    error,
    searchTime,
    suggestions,
    handleSearch,
    clearSearch,
    getRecentSearches,
    getTrendingProducts,
    getCategories,
    fetchRecentSearches,
  }
}
