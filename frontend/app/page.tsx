import { Suspense } from "react"
import { getCarouselItems, getPremiumExperiences, getProductShowcase, getContactCTASlides, getFeatureCards } from "@/lib/server/get-carousel-data"
import { getCategories } from "@/lib/server/get-categories"
import { HomeContent } from "@/components/home/home-content"

export const revalidate = 60

/**
 * OPTIMIZED HOMEPAGE: Uses batch API for all product sections
 * Carousel, categories, and CTAs load in parallel
 * All product sections (flash sales, trending, top picks, etc) fetched via single batch endpoint
 * Expected time: ~150ms total (vs ~1000ms with separate requests)
 */

async function LoadAllContent() {
  const timeout = <T extends any[] = any>(promise: Promise<T>, ms: number = 3000): Promise<T | []> => {
    return Promise.race([
      promise as Promise<T | []>,
      new Promise<[]>(resolve => setTimeout(() => resolve([]), ms))
    ]).catch(() => [] as unknown as T)
  }

  try {
    // Fetch non-product sections in parallel (carousel, categories, CTAs)
    const [
      categories,
      carouselItems,
      premiumExperiences,
      productShowcase,
      contactCTASlides,
      featureCards,
    ] = await Promise.all([
      // Critical - with timeout for instant page load
      timeout(getCategories(20), 3000),
      timeout(getCarouselItems(), 3000),
      timeout(getPremiumExperiences(), 3000),
      timeout(getProductShowcase(), 3000),
      timeout(getContactCTASlides(), 3000),
      timeout(getFeatureCards(), 3000),
    ])

    // Fetch all product sections via single BATCH API endpoint
    // This endpoint uses ThreadPoolExecutor to run all queries in parallel
    // Expected backend time: ~30ms (not 120ms) + network: ~100ms = ~150ms total
    let batchData = {
      flashSaleProducts: [],
      flashSaleEvent: null,
      luxuryProducts: [],
      newArrivals: [],
      topPicks: [],
      trendingProducts: [],
      dailyFinds: [],
      allProducts: [],
      allProductsHasMore: false,
    }

    try {
      const batchResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/homepage/batch`,
        {
          cache: 'no-store', // Always fetch fresh from backend, browser/CDN caching still works
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (batchResponse.ok) {
        const batchResult = await batchResponse.json()
        batchData = {
          flashSaleProducts: batchResult.flashSaleProducts || [],
          flashSaleEvent: batchResult.flashSaleEvent || null,
          luxuryProducts: batchResult.luxuryProducts || [],
          newArrivals: batchResult.newArrivals || [],
          topPicks: batchResult.topPicks || [],
          trendingProducts: batchResult.trendingProducts || [],
          dailyFinds: batchResult.dailyFinds || [],
          allProducts: batchResult.allProducts || [],
          allProductsHasMore: batchResult.allProductsHasMore || false,
        }
        console.log('[v0] Batch API response received successfully')
      } else {
        console.warn(`[v0] Batch API returned ${batchResponse.status}`)
      }
    } catch (error) {
      console.warn('[v0] Batch API fetch failed, falling back to defaults:', error)
    }

    return {
      categories: Array.isArray(categories) ? categories : [],
      carouselItems: Array.isArray(carouselItems) ? carouselItems : [],
      premiumExperiences: Array.isArray(premiumExperiences) ? premiumExperiences : [],
      productShowcase: Array.isArray(productShowcase) ? productShowcase : [],
      contactCTASlides: Array.isArray(contactCTASlides) ? contactCTASlides : [],
      featureCards: Array.isArray(featureCards) ? featureCards : [],
      ...batchData,
    }
  } catch (error) {
    console.error("[v0] Content loading error:", error)
    return {
      categories: [],
      carouselItems: [],
      premiumExperiences: [],
      productShowcase: [],
      contactCTASlides: [],
      featureCards: [],
      flashSaleProducts: [],
      flashSaleEvent: null,
      luxuryProducts: [],
      newArrivals: [],
      topPicks: [],
      trendingProducts: [],
      dailyFinds: [],
      allProducts: [],
      allProductsHasMore: false,
    }
  }
}

export default async function Home() {
  const data = await LoadAllContent()

  return (
    <HomeContent
      categories={data.categories}
      carouselItems={data.carouselItems}
      premiumExperiences={data.premiumExperiences}
      productShowcase={data.productShowcase}
      contactCTASlides={data.contactCTASlides}
      featureCards={data.featureCards}
      flashSaleProducts={data.flashSaleProducts}
      luxuryProducts={data.luxuryProducts}
      newArrivals={data.newArrivals}
      topPicks={data.topPicks}
      trendingProducts={data.trendingProducts}
      dailyFinds={data.dailyFinds}
      allProducts={data.allProducts}
      allProductsHasMore={data.allProductsHasMore}
    />
  )
}
