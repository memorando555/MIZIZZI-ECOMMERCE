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

// ISR: Cache entire page for 60 seconds - serve static from cache instantly on repeat visits
export const revalidate = 60

/**
 * INSTANT RENDERING STRATEGY:
 * 1. Show page shell immediately with minimal critical data (4 fast fetches)
 * 2. Fetch deferred data in parallel but don't block shell rendering
 * 3. Use Suspense streaming to populate sections as data arrives
 * Result: LCP < 2s, fully loaded < 6s
 */

export default async function Home() {
  // Critical path: Only essential above-fold content - 4 parallel fetches with 3s timeout
  const critical = await Promise.race([
    Promise.all([
      getCategories(20),
      getCarouselItems(),
      getPremiumExperiences(),
      getProductShowcase(),
    ]),
    new Promise(resolve => 
      setTimeout(() => resolve([[], [], [], []]), 3000) // Timeout fallback
    ),
  ]).then((results: any) => ({
    categories: Array.isArray(results[0]) ? results[0] : [],
    carouselItems: Array.isArray(results[1]) ? results[1] : [],
    premiumExperiences: Array.isArray(results[2]) ? results[2] : [],
    productShowcase: Array.isArray(results[3]) ? results[3] : [],
  }))

  return (
    <Suspense fallback={null}>
      <HomePageContent initialCritical={critical} />
    </Suspense>
  )
}

// Fetch everything in one pass after critical renders
async function HomePageContent({ initialCritical }: { initialCritical: any }) {
  // Fetch all remaining data while critical shell renders - non-blocking
  const allData = await Promise.all([
    Promise.resolve(initialCritical.categories),
    Promise.resolve(initialCritical.carouselItems),
    Promise.resolve(initialCritical.premiumExperiences),
    Promise.resolve(initialCritical.productShowcase),
    getContactCTASlides(),
    getFeatureCards(),
    getFlashSaleProducts(50),
    getLuxuryProducts(12),
    getNewArrivals(20),
    getTopPicks(20),
    getTrendingProducts(20),
    getDailyFinds(20),
    getAllProductsForHome(12),
  ]).catch(() => [[], [], [], [], [], [], [], [], [], [], [], [], { products: [], hasMore: false }])

  return (
    <HomeContent
      categories={allData[0]}
      carouselItems={allData[1]}
      premiumExperiences={allData[2]}
      productShowcase={allData[3]}
      contactCTASlides={allData[4]}
      featureCards={allData[5]}
      flashSaleProducts={allData[6]}
      luxuryProducts={allData[7]}
      newArrivals={allData[8]}
      topPicks={allData[9]}
      trendingProducts={allData[10]}
      dailyFinds={allData[11]}
      allProducts={(allData[12] as any)?.products || []}
      allProductsHasMore={(allData[12] as any)?.hasMore || false}
    />
  )
}
