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

// ISR revalidation - revalidate every 60 seconds for fresh content
export const revalidate = 60

/**
 * OPTIMIZED HOMEPAGE: All data fetched in parallel for instant rendering
 * No lazy loading, no Suspense delays - all components render immediately
 * Critical and deferred data fetched together via Promise.all() for maximum speed
 */

export default async function Home() {
  try {
    // Fetch all data in parallel - no waterfall, no dynamic imports
    const [
      categories,
      carouselItems,
      premiumExperiences,
      productShowcase,
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
      getCategories(20),
      getCarouselItems(),
      getPremiumExperiences(),
      getProductShowcase(),
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

    return (
      <HomeContent
        categories={categories}
        carouselItems={carouselItems}
        premiumExperiences={premiumExperiences}
        productShowcase={productShowcase}
        contactCTASlides={contactCTASlides}
        featureCards={featureCards}
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
    return (
      <HomeContent
        categories={[]}
        carouselItems={[]}
        premiumExperiences={[]}
        productShowcase={[]}
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
    )
  }
}
