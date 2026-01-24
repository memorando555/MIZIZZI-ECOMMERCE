import { getNewArrivals } from "@/lib/server/get-new-arrivals"
import { NewArrivalsPageContent } from "@/components/new-arrivals/page-content"

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(100)

  return <NewArrivalsPageContent products={products} />
}
