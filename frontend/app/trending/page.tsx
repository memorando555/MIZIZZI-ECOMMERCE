import { getTrendingProducts } from "@/lib/server/get-trending-products"
import { TrendingPageContent } from "@/components/trending/page-content"

export default async function TrendingPage() {
  const products = await getTrendingProducts(100)

  return <TrendingPageContent products={products} />
}
