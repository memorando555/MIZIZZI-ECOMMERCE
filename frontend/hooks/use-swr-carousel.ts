"use client"

import useSWR, { type SWRConfiguration, mutate as globalMutate } from "swr"
import type {
  CarouselItem,
  PremiumExperience,
  ContactCTASlide,
  FeatureCard,
  ProductShowcaseCategory,
} from "@/lib/server/get-carousel-data"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://mizizzi-ecommerce-1.onrender.com"

const CACHE_PREFIX = "mizizzi_carousel_"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CarouselData {
  carouselItems: CarouselItem[]
  premiumExperiences: PremiumExperience[]
  contactCTASlides: ContactCTASlide[]
  featureCards: FeatureCard[]
  productShowcase: ProductShowcaseCategory[]
}

// In-memory cache for instant display
let carouselCache: CarouselData | null = null
let lastFetchTime = 0

// Local storage helpers
function getFromLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (cached) {
      const parsed = JSON.parse(cached)
      // Check if cache is still valid
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed.data as T
      }
      // Cache expired, remove it
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
    }
  } catch (error) {
    console.warn("[Carousel] Failed to read from localStorage:", error)
  }
  return null
}

function saveToLocalStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    )
  } catch (error) {
    // Handle quota exceeded or other errors gracefully
    console.warn("[Carousel] Failed to save to localStorage:", error)
    // Try to clear old cache entries if quota exceeded
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      try {
        // Clear old carousel cache entries
        Object.keys(localStorage)
          .filter((k) => k.startsWith(CACHE_PREFIX))
          .forEach((k) => localStorage.removeItem(k))
        // Retry saving
        localStorage.setItem(
          `${CACHE_PREFIX}${key}`,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          }),
        )
      } catch (retryError) {
        console.warn("[Carousel] Failed to retry localStorage save:", retryError)
      }
    }
  }
}

// Optimized fetcher function for carousel data
const carouselFetcher = async (): Promise<CarouselData> => {
  let timeoutId: NodeJS.Timeout | null = null
  try {
    const controller = new AbortController()
    let hasAborted = false
    
    timeoutId = setTimeout(() => {
      if (!hasAborted) {
        hasAborted = true
        controller.abort()
      }
    }, 8000) // Increased to 8 seconds for slower connections

    const [carouselResponse, premiumResponse, contactResponse, featureResponse, showcaseResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/carousel/items?position=homepage`, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      }),
      fetch(`${API_BASE_URL}/api/panels/items?panel_type=premium_experience&position=right`, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      }),
      fetch(`${API_BASE_URL}/api/contact-cta/slides`, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      }),
      fetch(`${API_BASE_URL}/api/feature-cards`, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      }),
      fetch(`${API_BASE_URL}/api/panels/items?panel_type=product_showcase&position=left`, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      }),
    ])

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Process carousel items
    let carouselItems: CarouselItem[] = []
    if (carouselResponse.ok) {
      const carouselData = await carouselResponse.json()
      if (carouselData.success && carouselData.items && carouselData.items.length > 0) {
        carouselItems = carouselData.items.map((item: any) => ({
          image: item.image_url,
          title: item.title,
          description: item.description,
          buttonText: item.button_text || "Shop Now",
          href: item.link_url || "/products",
          badge: item.badge_text,
          discount: item.discount,
        }))
      }
    }

    // Process premium experiences
    let premiumExperiences: PremiumExperience[] = []
    if (premiumResponse.ok) {
      const premiumData = await premiumResponse.json()
      if (premiumData.items && premiumData.items.length > 0) {
        premiumExperiences = premiumData.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          metric: item.metric,
          description: item.description,
          icon_name: item.icon_name,
          image: item.image_url,
          gradient: item.gradient,
          features: item.features,
          is_active: item.is_active,
        }))
      }
    }

    // Process contact CTA slides
    let contactCTASlides: ContactCTASlide[] = []
    if (contactResponse.ok) {
      const contactData = await contactResponse.json()
      if (contactData.slides && contactData.slides.length > 0) {
        contactCTASlides = contactData.slides
      }
    }

    // Process feature cards
    let featureCards: FeatureCard[] = []
    if (featureResponse.ok) {
      const featureData = await featureResponse.json()
      if (featureData && Array.isArray(featureData) && featureData.length > 0) {
        featureCards = featureData
      }
    }

    // Process product showcase
    let productShowcase: ProductShowcaseCategory[] = []
    if (showcaseResponse.ok) {
      const showcaseData = await showcaseResponse.json()
      if (showcaseData.items && showcaseData.items.length > 0) {
        productShowcase = showcaseData.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          metric: item.metric,
          description: item.description,
          icon_name: item.icon_name,
          image: item.image_url,
          gradient: item.gradient,
          features: item.features,
          is_active: item.is_active,
        }))
      }
    }

    const result: CarouselData = {
      carouselItems,
      premiumExperiences,
      contactCTASlides,
      featureCards,
      productShowcase,
    }

    // Update in-memory cache
    carouselCache = result
    lastFetchTime = Date.now()

    // Save to localStorage for persistence
    saveToLocalStorage("data", result)

    return result
  } catch (fetchError) {
    // Handle timeout errors gracefully
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      console.warn("[Carousel] Request timeout - using cached data")
    } else {
      console.error("[Carousel] Error fetching carousel data:", fetchError)
    }
    
    // Return cached data on error if available
    const cached = getFromLocalStorage<CarouselData>("data")
    if (cached) {
      return cached
    }
    if (carouselCache) {
      return carouselCache
    }
    throw fetchError
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

// Default SWR configuration with stale-while-revalidate strategy
const defaultConfig: SWRConfiguration<CarouselData> = {
  revalidateOnFocus: false, // Don't revalidate on window focus to avoid unnecessary requests
  revalidateOnReconnect: true, // Revalidate when network reconnects
  dedupingInterval: 60000, // Dedupe requests within 1 minute
  focusThrottleInterval: 300000, // Throttle focus revalidation to 5 minutes
  errorRetryCount: 2, // Retry twice on error
  errorRetryInterval: 5000, // Wait 5 seconds between retries
  revalidateIfStale: true, // Revalidate if data is stale
  keepPreviousData: true, // Keep previous data while fetching new data (stale-while-revalidate)
  refreshInterval: 0, // No automatic polling
  shouldRetryOnError: true,
}

/**
 * High-performance SWR hook for carousel data with local storage caching
 * Implements stale-while-revalidate pattern for instant display with background updates
 */
function useCarouselData(
  initialData?: CarouselData,
  config?: SWRConfiguration<CarouselData>,
): {
  data: CarouselData
  isLoading: boolean
  isValidating: boolean
  isError: boolean
  mutate: (data?: CarouselData | Promise<CarouselData>, shouldRevalidate?: boolean) => Promise<CarouselData | undefined>
  isFromCache: boolean
} {
  // Get cached data from localStorage
  const localStorageData = getFromLocalStorage<CarouselData>("data")

  // Check if in-memory cache is fresh
  const isCacheFresh = carouselCache && Date.now() - lastFetchTime < CACHE_DURATION

  // Priority: initialData (SSR) > localStorage > in-memory cache
  const fallbackData = initialData ?? localStorageData ?? (isCacheFresh ? carouselCache : undefined)

  const { data, error, isLoading, isValidating, mutate } = useSWR<CarouselData>(
    ["carousel-data"],
    () => carouselFetcher(),
    {
      ...defaultConfig,
      fallbackData: fallbackData ?? undefined,
      ...config,
      onSuccess: (newData) => {
        if (newData) {
          // Update caches on successful fetch
          carouselCache = newData
          lastFetchTime = Date.now()
          saveToLocalStorage("data", newData)
          config?.onSuccess?.(newData, ["carousel-data"] as any, { ...defaultConfig, ...config } as any)
        }
      },
    },
  )

  // Determine if we're showing cached data
  const isFromCache = !data && (!!localStorageData || !!carouselCache)

  return {
    data: data || fallbackData || {
      carouselItems: [],
      premiumExperiences: [],
      contactCTASlides: [],
      featureCards: [],
      productShowcase: [],
    },
    isLoading: isLoading && !fallbackData, // Only show loading if no cached data
    isValidating,
    isError: !!error,
    mutate: mutate as (data?: CarouselData | Promise<CarouselData>, shouldRevalidate?: boolean) => Promise<CarouselData | undefined>,
    isFromCache,
  }
}

// Prefetch carousel data (useful for prefetching on hover or route transition)
async function prefetchCarouselData(): Promise<void> {
  if (carouselCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return
  }

  try {
    const data = await carouselFetcher()
    // Update in-memory cache
    carouselCache = data
    lastFetchTime = Date.now()
    saveToLocalStorage("data", data)
  } catch (error) {
    console.warn("[Carousel] Failed to prefetch carousel data:", error)
  }
}

// Invalidate carousel cache (useful when admin updates carousel content)
async function invalidateCarouselData(): Promise<void> {
  carouselCache = null
  lastFetchTime = 0
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(`${CACHE_PREFIX}data`)
    } catch (error) {
      console.warn("[Carousel] Failed to clear localStorage:", error)
    }
  }
}

// Get cached carousel data without triggering a fetch
function getCachedCarouselData(): CarouselData | null {
  return carouselCache || getFromLocalStorage<CarouselData>("data")
}

export { useCarouselData, prefetchCarouselData, invalidateCarouselData, getCachedCarouselData }
