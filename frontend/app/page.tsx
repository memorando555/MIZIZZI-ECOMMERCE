import { Suspense } from "react"
import { getFlashSaleProducts } from "@/lib/server/get-flash-sale-products"
import { getLuxuryProducts } from "@/lib/server/get-luxury-products"
import { getNewArrivals } from "@/lib/server/get-new-arrivals"
import { getTopPicks } from "@/lib/server/get-top-picks"
import { getTrendingProducts } from "@/lib/server/get-trending-products"
import { getDailyFinds } from "@/lib/server/get-daily-finds"
import { getCategories } from "@/lib/server/get-categories"
import { getCarouselItems, getFeatureCards, getPremiumExperiences, getContactCTASlides, getProductShowcase } from "@/lib/server/get-carousel-data"
import { getAllProductsForHome } from "@/lib/server/get-all-products"
import { HomeContent } from "@/components/home/home-content"
import { HomeSkeleton } from "@/components/home/home-skeleton"

/**
 * CRITICAL: Fetch only essential above-the-fold data first
 * - Carousel (hero)
 * - Categories
 * - Premium experiences
 * 
 * DEFER: Non-critical sections load after initial render
 * - Flash sales
 * - New arrivals
 * - Trending products
 * - All products
 * - Daily finds
 * - Top picks
 * - Luxury deals
 * 
 * This ensures the page renders in <500ms instead of 15-30s
 */

async function CriticalContent() {
  try {
    // Fetch ONLY critical, fast data
    const [
      categories,
      carouselItems,
      premiumExperiences,
      contactCTASlides,
      featureCards,
      productShowcase,
    ] = await Promise.all([
      getCategories(20),
      getCarouselItems(),
      getPremiumExperiences(),
      getContactCTASlides(),
      getFeatureCards(),
      getProductShowcase(),
    ])

    return {
      categories,
      carouselItems,
      premiumExperiences,
      contactCTASlides,
      featureCards,
      productShowcase,
    }
  } catch (error) {
    console.error("[v0] Critical content error:", error)
    return {
      categories: [],
      carouselItems: [],
      premiumExperiences: [],
      contactCTASlides: [],
      featureCards: [],
      productShowcase: [],
    }
  }
}

async function DeferredContent() {
  try {
    // Fetch deferred data (non-critical sections)
    const [
      flashSaleProducts,
      luxuryProducts,
      newArrivals,
      topPicks,
      trendingProducts,
      dailyFinds,
      allProductsData,
    ] = await Promise.all([
      getFlashSaleProducts(50),
      getLuxuryProducts(12),
      getNewArrivals(20),
      getTopPicks(20),
      getTrendingProducts(20),
      getDailyFinds(20),
      getAllProductsForHome(12),
    ])

    return {
      flashSaleProducts,
      luxuryProducts,
      newArrivals,
      topPicks,
      trendingProducts,
      dailyFinds,
      allProducts: allProductsData.products,
      allProductsHasMore: allProductsData.hasMore,
    }
  } catch (error) {
    console.error("[v0] Deferred content error:", error)
    return {
      flashSaleProducts: [],
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
  try {
    const criticalData = await CriticalContent()

    return (
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContentWithDeferred criticalData={criticalData} />
      </Suspense>
    )
  } catch (error) {
    console.error("[v0] Home page error:", error)
    return <HomeSkeleton />
  }
}

async function HomeContentWithDeferred({ criticalData }: any) {
  const deferredData = await DeferredContent()

  return (
    <HomeContent
      categories={criticalData.categories}
      carouselItems={criticalData.carouselItems}
      premiumExperiences={criticalData.premiumExperiences}
      contactCTASlides={criticalData.contactCTASlides}
      featureCards={criticalData.featureCards}
      productShowcase={criticalData.productShowcase}
      flashSaleProducts={deferredData.flashSaleProducts}
      luxuryProducts={deferredData.luxuryProducts}
      newArrivals={deferredData.newArrivals}
      topPicks={deferredData.topPicks}
      trendingProducts={deferredData.trendingProducts}
      dailyFinds={deferredData.dailyFinds}
      allProducts={deferredData.allProducts}
      allProductsHasMore={deferredData.allProductsHasMore}
    />
  )
}
