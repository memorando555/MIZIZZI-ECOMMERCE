import { getFlashSaleProducts } from "@/lib/server/get-flash-sale-products"
import { getLuxuryProducts } from "@/lib/server/get-luxury-products"
import { getNewArrivals } from "@/lib/server/get-new-arrivals"
import { getTopPicks } from "@/lib/server/get-top-picks"
import { getTrendingProducts } from "@/lib/server/get-trending-products"
import { getDailyFinds } from "@/lib/server/get-daily-finds"
import { getCategories } from "@/lib/server/get-categories"
import { getFeatureCards } from "@/lib/server/get-carousel-data"
import { getAllProductsForHome } from "@/lib/server/get-all-products"
import { HomeContent } from "@/components/home/home-content"

/**
 * Fetch all data in parallel without Suspense boundaries
 * This ensures cached data renders immediately, then updates silently
 */
export default async function Home() {
  try {
    // Fetch data in parallel WITHOUT carousel (it's lazy-loaded on client)
    // This prevents the 5.3MB carousel data from blocking page load
    const [
      categories,
      featureCards,
      flashSaleProducts,
      luxuryProducts,
      newArrivals,
      topPicks,
      trendingProducts,
      dailyFinds,
      allProductsData,
    ] = await Promise.all([
      getCategories(20),
      getFeatureCards(),
      getFlashSaleProducts(50),
      getLuxuryProducts(12),
      getNewArrivals(20),
      getTopPicks(20),
      getTrendingProducts(20),
      getDailyFinds(20),
      getAllProductsForHome(12),
    ])

    return (
      <HomeContent
        categories={categories}
        carouselItems={[]}
        premiumExperiences={[]}
        contactCTASlides={[]}
        featureCards={featureCards}
        productShowcase={[]}
        flashSaleProducts={flashSaleProducts}
        luxuryProducts={luxuryProducts}
        newArrivals={newArrivals}
        topPicks={topPicks}
        trendingProducts={trendingProducts}
        dailyFinds={dailyFinds}
        allProducts={allProductsData.products}
        allProductsHasMore={allProductsData.hasMore}
      />
    )
  } catch (error) {
    console.error("[v0] Home page error:", error)
    // Return empty shell that still shows layout
    return (
      <HomeContent
        categories={[]}
        carouselItems={[]}
        premiumExperiences={[]}
        contactCTASlides={[]}
        featureCards={[]}
        productShowcase={[]}
        flashSaleProducts={[]}
        luxuryProducts={[]}
        newArrivals={[]}
        topPicks={[]}
        trendingProducts={[]}
        dailyFinds={[]}
        allProducts={[]}
        allProductsHasMore={false}
      />
    )
  }
}
