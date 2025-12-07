"use client"
import dynamic from "next/dynamic"
import Link from "next/link"
import { motion } from "framer-motion"
import { NetworkStatus } from "@/components/shared/network-status"

import { CategoryGrid } from "@/components/features/category-grid-enhanced"
import { Carousel } from "@/components/features/carousel"

const FlashSales = dynamic(() => import("@/components/features/flash-sales").then((mod) => mod.FlashSales), {
  loading: () => <FlashSalesSkeleton />,
  ssr: false,
})

const BrandShowcase = dynamic(() => import("@/components/features/brand-showcase").then((mod) => mod.BrandShowcase), {
  loading: () => <SectionSkeleton />,
  ssr: false,
})

const LuxuryDeals = dynamic(() => import("@/components/features/luxury-deals").then((mod) => mod.LuxuryDeals), {
  loading: () => <SectionSkeleton />,
  ssr: false,
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

const FlashSalesSkeleton = () => (
  <div className="w-full p-4">
    <div className="flex justify-between items-center mb-4">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-[4/3] w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
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

export default function Home() {
  return (
    <div
      className="flex min-h-screen flex-col pb-8 overflow-x-hidden w-full max-w-full box-border"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <NetworkStatus className="mx-auto w-full max-w-[1200px] px-1 sm:px-2 md:px-4 pt-2" />

      <div className="w-full sm:py-2 overflow-hidden" style={{ backgroundColor: "var(--color-background)" }}>
        <Carousel />
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-1 sm:px-2 md:px-4 overflow-x-hidden box-border mt-1 sm:mt-0">
        <motion.div
          className="mb-2 rounded-lg bg-white overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <CategoryGrid />
        </motion.div>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-1 sm:px-2 md:px-4 overflow-x-hidden box-border">
        <div className="grid gap-2 sm:gap-4 md:gap-8 py-2 sm:py-4">
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
