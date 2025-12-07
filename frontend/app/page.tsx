"use client"
import { useEffect } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { motion } from "framer-motion"
import { NetworkStatus } from "@/components/shared/network-status"
import { CategoryGrid } from "@/components/features/category-grid-enhanced"
import { Carousel } from "@/components/features/carousel"
import { prefetchHomeData } from "@/lib/prefetch-home-data"

const FlashSalesSkeleton = () => (
  <div className="w-full">
    <div className="bg-[#8B1538] text-white flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 bg-yellow-300/50 rounded animate-pulse"></div>
        <div className="h-5 w-24 bg-white/20 rounded animate-pulse"></div>
      </div>
      <div className="h-5 w-16 bg-white/20 rounded animate-pulse"></div>
    </div>
    <div className="p-2">
      <div className="flex gap-[1px] bg-gray-100">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-1 bg-white p-3">
            <div className="aspect-square w-full bg-gray-100 mb-2 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
            </div>
            <div className="h-3 w-3/4 bg-gray-100 rounded mb-2 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
            </div>
            <div className="h-4 w-1/2 bg-gray-100 rounded relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <style jsx>{`
      @keyframes shimmer {
        100% {
          transform: translateX(100%);
        }
      }
    `}</style>
  </div>
)

const SectionSkeleton = () => (
  <div className="w-full p-4">
    <div className="flex justify-between items-center mb-4">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-square w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
)

const ProductGridSkeleton = () => (
  <div className="w-full">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-2 bg-white p-3">
          <div className="aspect-[4/3] w-full bg-[#f5f5f7] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#f5f5f7] via-[#e0e0e3] to-[#f5f5f7] bg-[length:400%_400%] animate-pulse"></div>
          </div>
          <div className="h-3 w-3/4 bg-[#f5f5f7] rounded-full"></div>
          <div className="h-3 w-1/2 bg-[#f5f5f7] rounded-full"></div>
          <div className="h-4 w-1/3 bg-[#f5f5f7] rounded-full"></div>
        </div>
      ))}
    </div>
  </div>
)

const FlashSales = dynamic(() => import("@/components/features/flash-sales").then((mod) => mod.FlashSales), {
  loading: () => <FlashSalesSkeleton />,
})

const BrandShowcase = dynamic(() => import("@/components/features/brand-showcase").then((mod) => mod.BrandShowcase), {
  loading: () => <SectionSkeleton />,
  ssr: false,
})

const LuxuryDeals = dynamic(() => import("@/components/features/luxury-deals").then((mod) => mod.LuxuryDeals), {
  loading: () => <FlashSalesSkeleton />,
})

const ProductGrid = dynamic(() => import("@/components/products/product-grid").then((mod) => mod.ProductGrid), {
  loading: () => <ProductGridSkeleton />,
  ssr: false,
})

const TrendingNow = dynamic(() => import("@/components/features/trending-now").then((mod) => mod.TrendingNow), {
  loading: () => <SectionSkeleton />,
  ssr: false,
})

const NewArrivals = dynamic(() => import("@/components/features/new-arrivals").then((mod) => mod.NewArrivals), {
  loading: () => <SectionSkeleton />,
  ssr: false,
})

const TopPicks = dynamic(() => import("@/components/features/top-picks").then((mod) => mod.TopPicks), {
  loading: () => <SectionSkeleton />,
  ssr: false,
})

const DailyFinds = dynamic(() => import("@/components/features/daily-finds").then((mod) => mod.DailyFinds), {
  loading: () => <SectionSkeleton />,
  ssr: false,
})

export default function Home() {
  useEffect(() => {
    // Prefetch flash sales and luxury deals data immediately
    prefetchHomeData()
  }, [])

  return (
    <div className="flex flex-col pb-8 w-full" style={{ backgroundColor: "var(--color-background)" }}>
      <NetworkStatus className="mx-auto w-full max-w-[1200px] px-1 sm:px-2 md:px-4 pt-2" />

      <div className="w-full mt-2 sm:mt-3 sm:py-2" style={{ backgroundColor: "var(--color-background)" }}>
        <Carousel />
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-0 sm:px-3 md:px-4 mt-3 sm:mt-4">
        <motion.div
          className="mb-3 sm:rounded-lg bg-white overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <CategoryGrid />
        </motion.div>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-2 sm:px-3 md:px-4">
        <div className="grid gap-3 sm:gap-4 md:gap-8 py-2 sm:py-4">
          <section className="rounded-lg bg-white shadow-sm overflow-hidden">
            <FlashSales />
          </section>

          <section className="rounded-lg bg-white shadow-sm overflow-hidden">
            <LuxuryDeals />
          </section>

          <section className="rounded-lg bg-white shadow-sm overflow-hidden">
            <TopPicks />
          </section>

          <section className="rounded-lg bg-white shadow-sm overflow-hidden">
            <NewArrivals />
          </section>

          <section className="rounded-lg bg-white shadow-sm overflow-hidden">
            <TrendingNow />
          </section>

          <section className="rounded-lg bg-white shadow-sm overflow-hidden">
            <DailyFinds />
          </section>

          <section className="rounded-lg bg-white p-2 sm:p-4 shadow-sm overflow-hidden">
            <motion.div
              className="mb-4 flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-base sm:text-xl font-bold text-gray-900">All Products</h2>
              <Link
                href="/products"
                className="group flex items-center gap-1 text-xs sm:text-sm font-medium text-cherry-700 hover:text-cherry-900 transition-colors"
              >
                View All
                <motion.span
                  className="inline-block"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
            <ProductGrid limit={12} />
          </section>

          <section className="rounded-lg bg-white shadow-sm overflow-hidden">
            <BrandShowcase />
          </section>
        </div>
      </div>
    </div>
  )
}
