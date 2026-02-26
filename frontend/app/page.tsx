import { Suspense } from "react"
import { getCarouselItems, getPremiumExperiences, getProductShowcase, getContactCTASlides, getFeatureCards } from "@/lib/server/get-carousel-data"
import { getCategories } from "@/lib/server/get-categories"
import { getFlashSaleProducts } from "@/lib/server/get-flash-sale-products"
import { getLuxuryProducts } from "@/lib/server/get-luxury-products"
import { getNewArrivals } from "@/lib/server/get-new-arrivals"
import { getTopPicks } from "@/lib/server/get-top-picks"
import { getTrendingProducts } from "@/lib/server/get-trending-products"
import { getDailyFinds } from "@/lib/server/get-daily-finds"
import { getAllProductsForHome } from "@/lib/server/get-all-products"
import { HomeContent } from "@/components/home/home-content"

// ISR: Cache entire page for 60 seconds, serve instantly from cache
export const revalidate = 60

// INSTANT LOAD: Render immediately with critical data, stream rest
export default async function Home() {
  // Fast critical path - render instantly with just 4 essential fetches
  const [categories, carousel, premium, showcase] = await Promise.allSettled([
    getCategories(20),
    getCarouselItems(),
    getPremiumExperiences(),
    getProductShowcase(),
  ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []))

  return (
    <>
      {/* Critical path renders instantly - no waiting */}
      <HomeContent
        categories={categories}
        carouselItems={carousel}
        premiumExperiences={premium}
        productShowcase={showcase}
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
      
      {/* Stream secondary content - loads in background without blocking */}
      <Suspense fallback={null}>
        <SecondaryContent />
      </Suspense>
    </>
  )
}

// Loads 9 additional sections in parallel after critical content renders
async function SecondaryContent() {
  const results = await Promise.allSettled([
    getContactCTASlides(),
    getFeatureCards(),
    getFlashSaleProducts(50),
    getLuxuryProducts(12),
    getNewArrivals(20),
    getTopPicks(20),
    getTrendingProducts(20),
    getDailyFinds(20),
    getAllProductsForHome(12),
  ])

  const [cta, features, flash, luxury, arrivals, picks, trending, daily, allProducts] = results.map(r => 
    r.status === 'fulfilled' ? r.value : []
  )

  // Re-render with complete data once all secondary content loads
  return (
    <HomeContent
      categories={[]}
      carouselItems={[]}
      premiumExperiences={[]}
      productShowcase={[]}
      contactCTASlides={cta as any}
      featureCards={features as any}
      flashSaleProducts={flash as any}
      luxuryProducts={luxury as any}
      newArrivals={arrivals as any}
      topPicks={picks as any}
      trendingProducts={trending as any}
      dailyFinds={daily as any}
      allProducts={(allProducts as any)?.products || []}
      allProductsHasMore={(allProducts as any)?.hasMore || false}
    />
  )
}
