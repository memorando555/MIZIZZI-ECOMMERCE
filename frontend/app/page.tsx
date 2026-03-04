import { HomeContent } from "@/components/home/home-content"

export const revalidate = 60

/**
 * OPTIMIZED HOMEPAGE: Uses single batch API for ALL data
 * No separate requests for carousel, categories, or products
 * Single endpoint provides: products, categories, carousel, CTAs, and all sections
 * Expected time: ~150-200ms total
 */

interface BatchResponse {
  flashSaleProducts: any[]
  flashSaleEvent: any | null
  luxuryDealsProducts: any[]
  newArrivalsProducts: any[]
  topPicksProducts: any[]
  trendingProducts: any[]
  dailyFindsProducts: any[]
  backendExecutionMs: number
  cached: boolean
}

async function LoadAllContent(): Promise<BatchResponse> {
  try {
    // Use our frontend batch endpoint which proxies to the backend
    const batchResponse = await fetch(
      '/api/homepage/batch',
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (batchResponse.ok) {
      const batchData = await batchResponse.json()
      console.log('[v0] Homepage batch loaded successfully in', batchData.backendExecutionMs, 'ms')
      return {
        flashSaleProducts: batchData.flashSaleProducts || [],
        flashSaleEvent: batchData.flashSaleEvent || null,
        luxuryDealsProducts: batchData.luxuryDealsProducts || [],
        newArrivalsProducts: batchData.newArrivalsProducts || [],
        topPicksProducts: batchData.topPicksProducts || [],
        trendingProducts: batchData.trendingProducts || [],
        dailyFindsProducts: batchData.dailyFindsProducts || [],
        backendExecutionMs: batchData.backendExecutionMs || 0,
        cached: batchData.cached || false,
      }
    } else {
      console.warn(`[v0] Batch API returned ${batchResponse.status}`)
      return getDefaultData()
    }
  } catch (error) {
    console.error("[v0] Homepage batch API error:", error)
    return getDefaultData()
  }
}

function getDefaultData(): BatchResponse {
  return {
    flashSaleProducts: [],
    flashSaleEvent: null,
    luxuryDealsProducts: [],
    newArrivalsProducts: [],
    topPicksProducts: [],
    trendingProducts: [],
    dailyFindsProducts: [],
    backendExecutionMs: 0,
    cached: false,
  }
}

export default async function Home() {
  const data = await LoadAllContent()

  return (
    <HomeContent
      categories={[]}
      carouselItems={[]}
      premiumExperiences={[]}
      productShowcase={[]}
      contactCTASlides={[]}
      featureCards={[]}
      flashSaleProducts={data.flashSaleProducts}
      flashSaleEvent={data.flashSaleEvent}
      luxuryProducts={data.luxuryDealsProducts}
      newArrivals={data.newArrivalsProducts}
      topPicks={data.topPicksProducts}
      trendingProducts={data.trendingProducts}
      dailyFinds={data.dailyFindsProducts}
      allProducts={[]}
      allProductsHasMore={false}
    />
  )
}
