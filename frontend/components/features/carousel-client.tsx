"use client"

import { Carousel } from "./carousel"
import { useCarouselData } from "@/hooks/use-swr-carousel"
import type {
  CarouselItem,
  PremiumExperience,
  ContactCTASlide,
  FeatureCard,
  ProductShowcaseCategory,
} from "@/lib/server/get-carousel-data"

interface CarouselClientProps {
  initialCarouselItems?: CarouselItem[]
  initialPremiumExperiences?: PremiumExperience[]
  initialContactCTASlides?: ContactCTASlide[]
  initialFeatureCards?: FeatureCard[]
  initialProductShowcase?: ProductShowcaseCategory[]
}

/**
 * Client-side wrapper for Carousel component with SWR integration
 * Implements stale-while-revalidate pattern:
 * - Shows initial/cached data immediately (no loading state)
 * - Revalidates data in background
 * - Updates seamlessly when new data arrives
 * - Persists data to localStorage for offline availability
 * - Shows cached data while fetching fresh data
 */
export function CarouselClient({
  initialCarouselItems = [],
  initialPremiumExperiences = [],
  initialContactCTASlides = [],
  initialFeatureCards = [],
  initialProductShowcase = [],
}: CarouselClientProps) {
  // Use SWR hook with initial data for hybrid rendering
  // This ensures SSR data displays immediately, then updates from fresh fetch
  const { data, isValidating, isFromCache } = useCarouselData(
    {
      carouselItems: initialCarouselItems,
      premiumExperiences: initialPremiumExperiences,
      contactCTASlides: initialContactCTASlides,
      featureCards: initialFeatureCards,
      productShowcase: initialProductShowcase,
    },
    {
      // Revalidate on mount to keep data fresh
      revalidateOnMount: true,
      // Don't show loading state if we have initial/cached data
      revalidateIfStale: true,
      // Keep showing stale data while revalidating
      keepPreviousData: true,
    },
  )

  // Render carousel with current data (from SSR, cache, or fresh fetch)
  // Since SWR handles caching and revalidation, data updates seamlessly
  // If validating from cache, show the cached data without a loading state
  return (
    <Carousel
      carouselItems={data.carouselItems}
      premiumExperiences={data.premiumExperiences}
      contactCTASlides={data.contactCTASlides}
      featureCards={data.featureCards}
      productShowcase={data.productShowcase}
    />
  )
}
