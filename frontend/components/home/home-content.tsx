'use client';

import Link from "next/link"
import { NetworkStatus } from "@/components/shared/network-status"
import { CategoryGrid } from "@/components/features/category-grid-enhanced"
import { Carousel } from "@/components/features/carousel"
import { ShoppingBag } from "lucide-react"
import { FlashSales } from "@/components/features/flash-sales"
import { LuxuryDeals } from "@/components/features/luxury-deals"
import { NewArrivals } from "@/components/features/new-arrivals"
import { TopPicks } from "@/components/features/top-picks"
import { TrendingNow } from "@/components/features/trending-now"
import { DailyFinds } from "@/components/features/daily-finds"
import { ProductGrid } from "@/components/products/product-grid"
import { BrandShowcase } from "@/components/features/brand-showcase"
import type { Product } from "@/types"
import type { Category } from "@/lib/server/get-categories"
import type {
  CarouselItem,
  PremiumExperience,
  ContactCTASlide,
  FeatureCard,
  ProductShowcaseCategory,
} from "@/lib/server/get-carousel-data"

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
