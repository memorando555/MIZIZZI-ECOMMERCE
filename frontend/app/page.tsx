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

/**
 * Optimized homepage - fetches all data in parallel for instant rendering
 * No Suspense boundaries = fully rendered page displays immediately
 * ISR revalidates every 60 seconds for fresh content
 */
export default async function Home() {
  try {
    // Fetch all data in parallel with ISR support
    // All critical and non-critical data fetches together for fast rendering
    const [
      categories,
      carouselItems,
      premiumExperiences,
      contactCTASlides,
      featureCards,
      productShowcase,
      flashSaleProducts,
      luxuryProducts,
      newArrivals,
      topPicks,
      trendingProducts,
      dailyFinds,
      allProductsData,
    ] = await Promise.all([
      getCategories(20),
      getCarouselItems(),
      getPremiumExperiences(),
      getContactCTASlides(),
      getFeatureCards(),
      getProductShowcase(),
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
        carouselItems={carouselItems}
        premiumExperiences={premiumExperiences}
        contactCTASlides={contactCTASlides}
        featureCards={featureCards}
        productShowcase={productShowcase}
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
