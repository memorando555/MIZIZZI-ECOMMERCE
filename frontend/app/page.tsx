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
  luxuryProducts: any[]
  newArrivals: any[]
  topPicks: any[]
  trendingProducts: any[]
  dailyFinds: any[]
  allProducts: any[]
  allProductsHasMore: boolean
  categories: any[]
  carouselItems: any[]
  premiumExperiences: any[]
  productShowcase: any[]
  contactCTASlides: any[]
  featureCards: any[]
}

async function LoadAllContent(): Promise<BatchResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  
  try {
    const batchResponse = await fetch(
      `${apiUrl}/api/homepage/batch`,
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (batchResponse.ok) {
      const batchData = await batchResponse.json()
      console.log('[v0] Homepage batch API loaded successfully')
      return {
        flashSaleProducts: batchData.flashSaleProducts || [],
        flashSaleEvent: batchData.flashSaleEvent || null,
        luxuryProducts: batchData.luxuryProducts || [],
        newArrivals: batchData.newArrivals || [],
        topPicks: batchData.topPicks || [],
        trendingProducts: batchData.trendingProducts || [],
        dailyFinds: batchData.dailyFinds || [],
        allProducts: batchData.allProducts || [],
        allProductsHasMore: batchData.allProductsHasMore || false,
        categories: batchData.categories || [],
        carouselItems: batchData.carouselItems || [],
        premiumExperiences: batchData.premiumExperiences || [],
        productShowcase: batchData.productShowcase || [],
        contactCTASlides: batchData.contactCTASlides || [],
        featureCards: batchData.featureCards || [],
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
    luxuryProducts: [],
    newArrivals: [],
    topPicks: [],
    trendingProducts: [],
    dailyFinds: [],
    allProducts: [],
    allProductsHasMore: false,
    categories: [],
    carouselItems: [],
    premiumExperiences: [],
    productShowcase: [],
    contactCTASlides: [],
    featureCards: [],
  }
}

export default async function Home() {
  const data = await LoadAllContent()

  return (
    <HomeContent
      categories={data.categories}
      carouselItems={data.carouselItems}
      premiumExperiences={data.premiumExperiences}
      productShowcase={data.productShowcase}
      contactCTASlides={data.contactCTASlides}
      featureCards={data.featureCards}
      flashSaleProducts={data.flashSaleProducts}
      flashSaleEvent={data.flashSaleEvent}
      luxuryProducts={data.luxuryProducts}
      newArrivals={data.newArrivals}
      topPicks={data.topPicks}
      trendingProducts={data.trendingProducts}
      dailyFinds={data.dailyFinds}
      allProducts={data.allProducts}
      allProductsHasMore={data.allProductsHasMore}
    />
  )
}
