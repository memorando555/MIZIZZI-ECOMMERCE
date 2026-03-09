import useSWR, { type SWRConfiguration, mutate as globalMutate } from "swr"

interface TopBarSlide {
  id: number
  campaign: string
  subtext: string
  bgColor: string
  productImageUrl: string
  productAlt: string
  centerContentType: "phone" | "brands" | "text"
  centerContentData: any
  buttonText: string
  buttonLink: string
  isActive: boolean
  sortOrder: number
}

const STORAGE_KEY = "topbar-slides-cache"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// In-memory cache for instant display
let topbarCache: TopBarSlide[] | null = null
let lastFetchTime = 0

// Helper to get cached data from localStorage
const getLocalStorageCache = (): { slides: TopBarSlide[]; timestamp: number } | null => {
  if (typeof window === "undefined") return null

  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.warn("[v0] Failed to read topbar cache from localStorage:", e)
  }
  return null
}

// Helper to save data to localStorage
const saveToLocalStorage = (slides: TopBarSlide[]) => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        slides,
        timestamp: Date.now(),
      }),
    )
  } catch (e) {
    console.warn("[v0] Failed to save topbar cache to localStorage:", e)
  }
}

// Fetcher function with localStorage fallback
const topbarFetcher = async (): Promise<TopBarSlide[]> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"}/api/topbar/slides`,
      {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.slides?.length > 0) {
      // Update both in-memory cache and localStorage
      topbarCache = data.slides
      lastFetchTime = Date.now()
      saveToLocalStorage(data.slides)
      return data.slides
    }

    throw new Error("No slides in response")
  } catch (error) {
    // First try in-memory cache
    if (topbarCache && topbarCache.length > 0) {
      return topbarCache
    }

    // Fall back to localStorage
    const localCache = getLocalStorageCache()
    if (localCache && localCache.slides && localCache.slides.length > 0) {
      topbarCache = localCache.slides
      return localCache.slides
    }

    // Return empty array as last resort (no cached data available)
    return []
  }
}

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  keepPreviousData: true,
  refreshInterval: 0,
  shouldRetryOnError: true,
}

export function useTopBar(config?: SWRConfiguration) {
  // Get initial fallback data from cache
  let fallbackData: TopBarSlide[] | undefined

  // Check in-memory cache first
  const isCacheFresh = topbarCache && Date.now() - lastFetchTime < CACHE_DURATION
  if (isCacheFresh && topbarCache) {
    fallbackData = topbarCache
  } else if (typeof window !== "undefined") {
    // Try localStorage if in-memory cache is stale or empty
    const localCache = getLocalStorageCache()
    if (localCache && localCache.slides && localCache.slides.length > 0) {
      const age = Date.now() - localCache.timestamp
      // Use cached data if less than cache duration old
      if (age < CACHE_DURATION) {
        fallbackData = localCache.slides
        // Also hydrate in-memory cache
        topbarCache = localCache.slides
        lastFetchTime = localCache.timestamp
      }
    }
  }

  const { data, error, isLoading, isValidating, mutate } = useSWR<TopBarSlide[]>("topbar-slides", topbarFetcher, {
    ...defaultConfig,
    fallbackData,
    ...config,
  })

  return {
    slides: data || topbarCache || [],
    isLoading: isLoading && !topbarCache && !fallbackData,
    isValidating,
    isError: !!error,
    mutate,
    hasData: !!(data || topbarCache || fallbackData),
  }
}

// Prefetch function for SSR or initial load
export async function prefetchTopBar(): Promise<void> {
  // Check if cache is still fresh
  if (topbarCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return
  }

  try {
    const data = await topbarFetcher()
    await globalMutate("topbar-slides", data, false)
  } catch (error) {
    // Silently handle prefetch errors - cache will be used as fallback
  }
}

// Invalidate cache and refetch
export async function invalidateTopBar(): Promise<void> {
  topbarCache = null
  lastFetchTime = 0

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  await globalMutate("topbar-slides")
}

// Get cached data without triggering a fetch
export function getCachedTopBar(): TopBarSlide[] | null {
  if (topbarCache) return topbarCache

  const localCache = getLocalStorageCache()
  if (localCache && localCache.slides) {
    return localCache.slides
  }
  return null
}
