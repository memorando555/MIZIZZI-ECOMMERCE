import { getLuxuryProducts } from "@/lib/server/get-luxury-products"
import { LuxuryDealsPageContent } from "@/components/luxury-deals/page-content"

export default async function LuxuryDealsPage() {
  const products = await getLuxuryProducts(100)

  return <LuxuryDealsPageContent products={products} />
}
