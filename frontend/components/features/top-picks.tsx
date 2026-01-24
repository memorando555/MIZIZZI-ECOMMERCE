import { TopPicksClient } from "@/components/features/top-picks-client"
import type { Product } from "@/types"

interface TopPicksProps {
  products?: Product[]
}

/**
 * Server Component - Hybrid Rendering Pattern (SSR)
 * 
 * Receives pre-fetched data from parent and passes to client component for:
 * ✓ Fast initial page load (data already fetched server-side)
 * ✓ Better SEO (search engines see full content)
 * ✓ Interactive features on client side
 */
export function TopPicks({ products = [] }: TopPicksProps) {
  // No products? Don't render anything
  if (!products || products.length === 0) {
    return null
  }

  // Pass SSR'd data to client component for interactivity
  return <TopPicksClient initialProducts={products} />
}
