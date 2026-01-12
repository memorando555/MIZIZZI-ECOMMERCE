import { getFlashSaleProducts } from "@/lib/server/get-flash-sale-products"
import { getLuxuryProducts } from "@/lib/server/get-luxury-products"
import { getNewArrivals } from "@/lib/server/get-new-arrivals"
import { getTopPicks } from "@/lib/server/get-top-picks"
import { getTrendingProducts } from "@/lib/server/get-trending-products"
import { getDailyFinds } from "@/lib/server/get-daily-finds"
import { getAllProducts } from "@/lib/server/get-all-products"
import { HomeContent } from "@/components/home/home-content"

export default async function Home() {
  const [flashSaleProducts, luxuryProducts, newArrivals, topPicks, trendingProducts, dailyFinds, allProductsData] =
    await Promise.all([
      getFlashSaleProducts(50),
      getLuxuryProducts(12),
      getNewArrivals(20),
      getTopPicks(20),
      getTrendingProducts(20),
      getDailyFinds(20),
      getAllProducts(12),
    ])

  return (
    <HomeContent
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
}
