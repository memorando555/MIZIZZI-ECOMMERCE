import { getFlashSaleProducts, getFlashSaleEvent } from "@/lib/server/get-flash-sale-products"
import { FlashSalesPageContent } from "@/components/flash-sales/page-content"

export default async function FlashSalesPage() {
  const [products, event] = await Promise.all([getFlashSaleProducts(100), getFlashSaleEvent()])

  return <FlashSalesPageContent products={products} event={event} />
}
