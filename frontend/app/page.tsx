import { Suspense } from "react"
import { getCarouselItems, getPremiumExperiences, getProductShowcase, getContactCTASlides, getFeatureCards } from "@/lib/server/get-carousel-data"
import { getCategories } from "@/lib/server/get-categories"
import { HomeContent } from "@/components/home/home-content"
import { HomeLoader } from "@/components/home/home-loader"

// ISR revalidation - revalidate every 60 seconds for fresh content
export const revalidate = 60

/**
 * OPTIMIZED HOMEPAGE: Hybrid critical/deferred approach
 * Critical: Carousel, categories, premium experiences, product showcase (visible immediately)
 * Deferred: Feature cards, CTA slides, flash sales, luxury, new arrivals, top picks, trending, daily finds
 * All data fetched in parallel, but deferred content streams in after first paint
 */

// CRITICAL PATH: Essential data needed for initial viewport (LCP optimization)
async function CriticalPath() {
  try {
    const [categories, carouselItems, premiumExperiences, productShowcase] = await Promise.all([
      getCategories(20), // Full category list for header/sidebar
      getCarouselItems(),
      getPremiumExperiences(),
      getProductShowcase(),
    ])
    return { categories, carouselItems, premiumExperiences, productShowcase }
  } catch (error) {
    console.error("[v0] Critical path error:", error)
    return { categories: [], carouselItems: [], premiumExperiences: [], productShowcase: [] }
  }
}

// DEFERRED PATH: Below-the-fold sections that load after first paint
async function DeferredPath() {
  try {
    const [
      contactCTASlides,
      featureCards,
      flashSaleProducts,
      luxuryProducts,
      newArrivals,
      topPicks,
      trendingProducts,
      dailyFinds,
      allProductsData,
    ] = await Promise.all([
      (async () => {
        const { getContactCTASlides } = await import("@/lib/server/get-carousel-data")
        return getContactCTASlides()
      })(),
      (async () => {
        const { getFeatureCards } = await import("@/lib/server/get-carousel-data")
        return getFeatureCards()
      })(),
      (async () => {
        const { getFlashSaleProducts } = await import("@/lib/server/get-flash-sale-products")
        return getFlashSaleProducts(50)
      })(),
      (async () => {
        const { getLuxuryProducts } = await import("@/lib/server/get-luxury-products")
        return getLuxuryProducts(12)
      })(),
      (async () => {
        const { getNewArrivals } = await import("@/lib/server/get-new-arrivals")
        return getNewArrivals(20)
      })(),
      (async () => {
        const { getTopPicks } = await import("@/lib/server/get-top-picks")
        return getTopPicks(20)
      })(),
      (async () => {
        const { getTrendingProducts } = await import("@/lib/server/get-trending-products")
        return getTrendingProducts(20)
      })(),
      (async () => {
        const { getDailyFinds } = await import("@/lib/server/get-daily-finds")
        return getDailyFinds(20)
      })(),
      (async () => {
        const { getAllProductsForHome } = await import("@/lib/server/get-all-products")
        return getAllProductsForHome(12)
      })(),
    ])
    return {
      contactCTASlides,
      featureCards,
      flashSaleProducts,
      luxuryProducts,
      newArrivals,
      topPicks,
      trendingProducts,
      dailyFinds,
      allProductsData,
    }
  } catch (error) {
    console.error("[v0] Deferred path error:", error)
    return {
      contactCTASlides: [],
      featureCards: [],
      flashSaleProducts: [],
      luxuryProducts: [],
      newArrivals: [],
      topPicks: [],
      trendingProducts: [],
      dailyFinds: [],
      allProductsData: { products: [], hasMore: false },
    }
  }
}

export default async function Home() {
  // Load critical content immediately
  const critical = await CriticalPath()

  return (
    <>
      <HomeContent
        categories={critical.categories}
        carouselItems={critical.carouselItems}
        premiumExperiences={critical.premiumExperiences}
        productShowcase={critical.productShowcase}
        // Deferred product data - initial empty, populated by streaming
        contactCTASlides={[]}
        featureCards={[]}
        flashSaleProducts={[]}
        luxuryProducts={[]}
        newArrivals={[]}
        topPicks={[]}
        trendingProducts={[]}
        dailyFinds={[]}
        allProducts={[]}
        allProductsHasMore={false}
      />
      {/* Stream deferred content after initial render */}
      <Suspense fallback={null}>
        <DeferredContentStreamer />
      </Suspense>
    </>
  )
}

async function DeferredContentStreamer() {
  const deferred = await DeferredPath()
  // Re-render HomeContent with all deferred data populated
  // This will trigger a re-render with full content without blocking initial paint
  return (
    <HomeContent
      categories={[]} // Don't re-fetch critical data
      carouselItems={[]}
      premiumExperiences={[]}
      productShowcase={[]}
      // All deferred data now available
      contactCTASlides={deferred.contactCTASlides}
      featureCards={deferred.featureCards}
      flashSaleProducts={deferred.flashSaleProducts}
      luxuryProducts={deferred.luxuryProducts}
      newArrivals={deferred.newArrivals}
      topPicks={deferred.topPicks}
      trendingProducts={deferred.trendingProducts}
      dailyFinds={deferred.dailyFinds}
      allProducts={deferred.allProductsData.products}
      allProductsHasMore={deferred.allProductsData.hasMore}
    />
  )
}
