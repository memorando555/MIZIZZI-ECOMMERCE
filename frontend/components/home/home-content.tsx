'use client';

import Link from "next/link"
import dynamic from "next/dynamic"
import { NetworkStatus } from "@/components/shared/network-status"
import { CategoryGrid } from "@/components/features/category-grid-enhanced"
import { Carousel } from "@/components/features/carousel"
import { ShoppingBag } from "lucide-react"
import { ProductGrid } from "@/components/products/product-grid"
import type { Product } from "@/types"
import type { Category } from "@/lib/server/get-categories"
import type {
  CarouselItem,
  PremiumExperience,
  ContactCTASlide,
  FeatureCard,
  ProductShowcaseCategory,
} from "@/lib/server/get-carousel-data"

// Lazy load heavy product sections - only load when visible
const FlashSales = dynamic(() => import("@/components/features/flash-sales").then(m => ({ default: m.FlashSales })), {
  loading: () => null, // No loader - render instantly
})

const LuxuryDeals = dynamic(() => import("@/components/features/luxury-deals").then(m => ({ default: m.LuxuryDeals })), {
  loading: () => null, // No loader - render instantly
})

const TopPicks = dynamic(() => import("@/components/features/top-picks").then(m => ({ default: m.TopPicks })), {
  loading: () => null, // No loader - render instantly
})

const NewArrivals = dynamic(() => import("@/components/features/new-arrivals").then(m => ({ default: m.NewArrivals })), {
  loading: () => null, // No loader - render instantly
})

const TrendingNow = dynamic(() => import("@/components/features/trending-now").then(m => ({ default: m.TrendingNow })), {
  loading: () => null, // No loader - render instantly
})

const DailyFinds = dynamic(() => import("@/components/features/daily-finds").then(m => ({ default: m.DailyFinds })), {
  loading: () => null, // No loader - render instantly
})

const BrandShowcase = dynamic(() => import("@/components/features/brand-showcase").then(m => ({ default: m.BrandShowcase })), {
  loading: () => null, // No loader - render instantly
})

interface HomeContentProps {
  flashSaleProducts: Product[]
  luxuryProducts: Product[]
  newArrivals: Product[]
  topPicks: Product[]
  trendingProducts: Product[]
  dailyFinds: Product[]
  allProducts: Product[]
  allProductsHasMore: boolean
  categories?: Category[]
  carouselItems?: CarouselItem[]
  premiumExperiences?: PremiumExperience[]
  contactCTASlides?: ContactCTASlide[]
  featureCards?: FeatureCard[]
  productShowcase?: ProductShowcaseCategory[]
}

export function HomeContent({
  flashSaleProducts,
  luxuryProducts,
  newArrivals,
  topPicks,
  trendingProducts,
  dailyFinds,
  allProducts,
  allProductsHasMore,
  categories = [],
  carouselItems = [],
  premiumExperiences = [],
  contactCTASlides = [],
  featureCards = [],
  productShowcase = [],
}: HomeContentProps) {
  return (
    <>
      <div className="page-root flex flex-col pb-8 w-full" style={{ backgroundColor: "var(--color-background)" }}>
        <NetworkStatus className="mx-auto w-full max-w-[1200px] px-1 sm:px-2 md:px-4 pt-2" />

        <div className="w-full mt-2 sm:mt-3 sm:py-2" style={{ backgroundColor: "var(--color-background)" }}>
          {/* Carousel with LQIP and blur transitions for instant display */}
          <Carousel
            carouselItems={carouselItems}
            premiumExperiences={premiumExperiences}
            contactCTASlides={contactCTASlides}
            featureCards={featureCards}
            productShowcase={productShowcase}
          />
        </div>

        <div className="mx-auto w-full max-w-[1200px] px-0 sm:px-3 md:px-4 mt-3 sm:mt-4">
          <div className="mb-3 sm:rounded-lg bg-white overflow-hidden shadow-sm">
            <CategoryGrid categories={categories} />
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1200px] px-2 sm:px-3 md:px-4">
          <div className="grid gap-3 sm:gap-4 md:gap-8 py-2 sm:py-4">
            <section className="rounded-lg bg-white shadow-sm overflow-hidden">
              <FlashSales {...({ products: flashSaleProducts } as any)} />
            </section>

            <section className="rounded-lg bg-white shadow-sm overflow-hidden">
              <LuxuryDeals products={luxuryProducts} />
            </section>

            <section className="rounded-lg bg-white shadow-sm overflow-hidden">
              <TopPicks products={topPicks} />
            </section>

            <section className="rounded-lg bg-white shadow-sm overflow-hidden">
              <NewArrivals products={newArrivals} />
            </section>

            <section className="rounded-lg bg-white shadow-sm overflow-hidden">
              <TrendingNow products={trendingProducts} />
            </section>

            <section className="rounded-lg bg-white shadow-sm overflow-hidden">
              <DailyFinds products={dailyFinds} />
            </section>

            <section className="rounded-lg bg-white shadow-sm overflow-hidden">
              <div className="bg-[#8B1538] text-white flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300" />
                  <h2 className="font-bold text-sm sm:text-base md:text-lg whitespace-nowrap">All Products</h2>
                </div>
                <Link
                  href="/products"
                  className="group flex items-center gap-1 text-xs sm:text-sm font-medium text-white hover:text-yellow-300 transition-colors"
                >
                  View All
                  <span className="inline-block arrow-animate">→</span>
                </Link>
              </div>
              <div className="p-1 sm:p-2">
                <ProductGrid initialProducts={allProducts} initialHasMore={allProductsHasMore} limit={12} />
              </div>
            </section>

            <section className="rounded-lg bg-white shadow-sm overflow-hidden">
              <BrandShowcase />
            </section>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .page-root {
          touch-action: pan-y;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        .arrow-animate {
          display: inline-block;
          will-change: transform;
          animation: arrowMove 1.5s ease-in-out infinite;
        }
        @keyframes arrowMove {
          0% { transform: translateX(0); }
          50% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        .page-root .carousel,
        .page-root .category-grid,
        .page-root .ProductGrid {
          will-change: transform, opacity;
        }
      `}</style>
    </>
  )
}
