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

// ISR: Cache entire page for 60 seconds - serve from cache instantly
export const revalidate = 60

// Fetch critical data first, show immediately, then stream rest
export default async function Home() {
  // Quick critical fetch - 4 items only
  const critical = await Promise.allSettled([
    getCategories(20),
    getCarouselItems(),
    getPremiumExperiences(),
    getProductShowcase(),
  ]).then(results => ({
    categories: results[0].status === 'fulfilled' ? results[0].value : [],
    carouselItems: results[1].status === 'fulfilled' ? results[1].value : [],
    premiumExperiences: results[2].status === 'fulfilled' ? results[2].value : [],
    productShowcase: results[3].status === 'fulfilled' ? results[3].value : [],
  }))

  return (
    <>
      {/* Immediate render with critical path - show shell instantly */}
      <CriticalShell critical={critical} />
      
      {/* Async boundary for deferred content - streams without re-rendering critical */}
      <Suspense fallback={null}>
        <DeferredShell />
      </Suspense>
    </>
  )
}

// Render critical content only - never updates
function CriticalShell({ critical }: { critical: any }) {
  return (
    <div suppressHydrationWarning>
      <HomeContent
        categories={critical.categories}
        carouselItems={critical.carouselItems}
        premiumExperiences={critical.premiumExperiences}
        productShowcase={critical.productShowcase}
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
    </div>
  )
}

// Load all deferred data in parallel
async function DeferredShell() {
  const deferred = await Promise.allSettled([
    getContactCTASlides(),
    getFeatureCards(),
    getFlashSaleProducts(50),
    getLuxuryProducts(12),
    getNewArrivals(20),
    getTopPicks(20),
    getTrendingProducts(20),
    getDailyFinds(20),
    getAllProductsForHome(12),
  ]).then(results => ({
    cta: results[0].status === 'fulfilled' ? results[0].value : [],
    features: results[1].status === 'fulfilled' ? results[1].value : [],
    flash: results[2].status === 'fulfilled' ? results[2].value : [],
    luxury: results[3].status === 'fulfilled' ? results[3].value : [],
    arrivals: results[4].status === 'fulfilled' ? results[4].value : [],
    picks: results[5].status === 'fulfilled' ? results[5].value : [],
    trending: results[6].status === 'fulfilled' ? results[6].value : [],
    daily: results[7].status === 'fulfilled' ? results[7].value : [],
    allProducts: results[8].status === 'fulfilled' ? results[8].value : { products: [], hasMore: false },
  }))

  // Single re-render with all deferred data once everything loads
  return (
    <div suppressHydrationWarning>
      <HomeContent
        categories={[]}
        carouselItems={[]}
        premiumExperiences={[]}
        productShowcase={[]}
        contactCTASlides={deferred.cta as any}
        featureCards={deferred.features as any}
        flashSaleProducts={deferred.flash as any}
        luxuryProducts={deferred.luxury as any}
        newArrivals={deferred.arrivals as any}
        topPicks={deferred.picks as any}
        trendingProducts={deferred.trending as any}
        dailyFinds={deferred.daily as any}
        allProducts={(deferred.allProducts as any)?.products || []}
        allProductsHasMore={(deferred.allProducts as any)?.hasMore || false}
      />
    </div>
  )
}
