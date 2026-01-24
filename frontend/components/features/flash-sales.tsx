import { FlashSalesClient } from "@/components/features/flash-sales-client"
import type { FlashSaleProduct, FlashSaleEvent } from "@/lib/server/get-flash-sale-products"
import type { Product } from "@/types"
import type React from "react"

interface FlashSalesProps {
  products?: Product[] | FlashSaleProduct[]
  event?: FlashSaleEvent | null
}

/**
 * Server Component - Hybrid Rendering Pattern (SSR)
 * 
 * Receives pre-fetched data from parent and passes to client component for:
 * ✓ Fast initial page load (data already fetched server-side)
 * ✓ Better SEO (search engines see full content)
 * ✓ Interactive features on client side
 */
export function FlashSales({ products = [], event = null }: FlashSalesProps) {
  // No products? Don't render anything
  if (!products || products.length === 0) {
    return null
  }

  // Pass SSR'd data to client component for interactivity
  return <FlashSalesClient initialProducts={products as FlashSaleProduct[]} initialEvent={event} />
}
