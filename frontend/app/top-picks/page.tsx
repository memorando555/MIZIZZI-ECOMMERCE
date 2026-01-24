import { getTopPicks } from "@/lib/server/get-top-picks"
import { TopPicksPageContent } from "@/components/top-picks/page-content"

export default async function TopPicksPage() {
  const products = await getTopPicks(100)

  return <TopPicksPageContent products={products} />
}
