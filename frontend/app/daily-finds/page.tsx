import { getDailyFinds } from "@/lib/server/get-daily-finds"
import { DailyFindsPageContent } from "@/components/daily-finds/page-content"

export default async function DailyFindsPage() {
  const products = await getDailyFinds(100)

  return <DailyFindsPageContent products={products} />
}
