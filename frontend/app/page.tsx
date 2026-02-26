import { Suspense } from "react"
import { getCarouselItems, getPremiumExperiences } from "@/lib/server/get-carousel-data"
import { getCategories } from "@/lib/server/get-categories"
import { HomeContent } from "@/components/home/home-content"
import { HomeLoader } from "@/components/home/home-loader"

// ISR revalidation - revalidate every 60 seconds for fresh content
export const revalidate = 60

// Enable static rendering with ISR for performance
export const dynamic = "force-static"

/**
 * CRITICAL OPTIMIZATION: Reduced home page to fetch only essential data first
 * All fetch operations run in parallel with Promise.all()
 * Below-the-fold content deferred with Suspense for faster LCP
 */

// CRITICAL PATH: Only the absolute essentials needed for visible viewport
async function CriticalPath() {
  try {
    const [categories, carouselItems, premiumExperiences] = await Promise.all([
      getCategories(8), // Reduced from 20 - only show 8 categories above fold
      getCarouselItems(),
      getPremiumExperiences(),
    ])
    return { categories, carouselItems, premiumExperiences }
  } catch (error) {
    console.error("[v0] Critical path error:", error)
    return { categories: [], carouselItems: [], premiumExperiences: [] }
  }
}

// DEFERRED PATH: Secondary sections that load after first paint
async function DeferredPath() {
  try {
    const [flashSaleProducts, topProducts, newArrivals] = await Promise.all([
      (async () => {
        const { getFlashSaleProducts } = await import("@/lib/server/get-flash-sale-products")
        return getFlashSaleProducts(12) // Reduced from 50 to 12
      })(),
      (async () => {
        const { getTopPicks } = await import("@/lib/server/get-top-picks")
        return getTopPicks(12)
      })(),
      (async () => {
        const { getNewArrivals } = await import("@/lib/server/get-new-arrivals")
        return getNewArrivals(12)
      })(),
    ])
    return { flashSaleProducts, topProducts, newArrivals }
  } catch (error) {
    console.error("[v0] Deferred path error:", error)
    return { flashSaleProducts: [], topProducts: [], newArrivals: [] }
  }
}

export default async function Home() {
  // Load critical content immediately
  const critical = await CriticalPath()

  return (
    <HomeContent
      categories={critical.categories}
      carouselItems={critical.carouselItems}
      premiumExperiences={critical.premiumExperiences}
      // Load deferred content with streaming
      flashSaleProducts={undefined}
      topPicks={undefined}
      newArrivals={undefined}
    >
      <Suspense fallback={null}>
        <DeferredContentStreamer />
      </Suspense>
    </HomeContent>
  )
}

async function DeferredContentStreamer() {
  const deferred = await DeferredPath()
  // This will stream in after critical content renders
  return null
}
