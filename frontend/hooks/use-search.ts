"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { searchProducts, checkMeilisearchHealth } from "@/lib/client-meilisearch"

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
  rating?: number
  stock?: number
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

export function useSearch({ initialQuery = "", delay = 50, onSearch }: UseSearchProps = {}) {
  const [query, setQuery] = useState<string>(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTime, setSearchTime] = useState<number>(0)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isMeilisearchReady, setIsMeilisearchReady] = useState<boolean>(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [trendingProducts, setTrendingProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Instant search with minimal debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    // Clear previous abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (!searchQuery || searchQuery.trim().length < 1) {
      setResults([])
      setSuggestions([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting search for:", searchQuery)

      // Perform search
      const searchData = await searchProducts({
        q: searchQuery.trim(),
        limit: 50,
      })

      setResults(searchData.hits as SearchResult[])
      setSearchTime(searchData.processingTimeMs)

      // Extract suggestions from results
      const resultSuggestions = searchData.hits
        .map((hit) => hit.name)
        .filter((name) => name && name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 6)

      setSuggestions(resultSuggestions)

      console.log("[v0] Search complete:", {
        results: searchData.hits.length,
        time: searchData.processingTimeMs,
      })

      if (onSearchRef.current) {
        onSearchRef.current(searchQuery)
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[v0] Search cancelled")
        return
      }

      console.error("[v0] Search error:", error)
      setError("Search failed - try again")
      setResults([])
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle input with minimal debounce
  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new debounce timer for ultra-fast search
      debounceTimerRef.current = setTimeout(() => {
        performSearch(value)
      }, delay)
    },
    [performSearch, delay]
  )

  const clearSearch = useCallback(() => {
    setQuery("")
    setDebouncedQuery("")
    setIsSearching(false)
    setResults([])
    setError(null)
    setSuggestions([])
    setSearchTime(0)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Check Meilisearch health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const isHealthy = await checkMeilisearchHealth()
        setIsMeilisearchReady(isHealthy)
        console.log("[v0] Meilisearch health:", isHealthy)
      } catch (error) {
        console.error("[v0] Failed to check Meilisearch health:", error)
        setIsMeilisearchReady(false)
      }
    }

    checkHealth()
  }, [])

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

  return {
    query,
    debouncedQuery,
    isSearching,
    isLoading,
    results,
    error,
    searchTime,
    suggestions,
    isMeilisearchReady,
    handleSearch,
    clearSearch,
    getRecentSearches: () => recentSearches,
    getTrendingProducts: () => trendingProducts.slice(0, 6),
    getCategories: () => categories.slice(0, 8),
    fetchRecentSearches,
  }
}
