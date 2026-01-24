"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Search, X, Crown } from "lucide-react"
import Image from "next/image"
import type { Product } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LuxuryDealsBannerCarousel } from "@/components/luxury-deals/banner-carousel"

interface LuxuryDealsPageContentProps {
  products: Product[]
}

export function LuxuryDealsPageContent({ products: initialProducts }: LuxuryDealsPageContentProps) {
  const [sortBy, setSortBy] = useState("discount")
  const [searchQuery, setSearchQuery] = useState("")

  // Calculate discount percentage
  const calculateDiscount = (price: number, salePrice: number | null) => {
    if (!salePrice || salePrice >= price) return 0
    return Math.round(((price - salePrice) / price) * 100)
  }

  // Filter and sort products
  const filteredProducts = initialProducts
    .filter((product) => {
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        return (a.sale_price || a.price) - (b.sale_price || b.price)
      } else if (sortBy === "price-desc") {
        return (b.sale_price || b.price) - (a.sale_price || a.price)
      } else if (sortBy === "discount") {
        const discountA = a.sale_price ? (a.price - a.sale_price) / a.price : 0
        const discountB = b.sale_price ? (b.price - b.sale_price) / b.price : 0
        return discountB - discountA
      }
      return 0
    })

  if (!initialProducts || initialProducts.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900">Luxury Deals</h1>
            <Crown className="h-6 w-6 text-amber-600" />
          </div>
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-neutral-600 mb-4">No luxury products available at the moment.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <div className="container py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">Luxury Deals</h1>
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Crown className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
              </motion.div>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto sm:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-4 w-full rounded-full border-neutral-200 bg-white focus:ring-2 focus:ring-amber-600 focus:border-transparent"
            />
            {searchQuery && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearchQuery("")}>
                <X className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Premium Luxury Banner */}
        <LuxuryDealsBannerCarousel />

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            <span className="font-medium text-neutral-900">{filteredProducts.length}</span> deals available
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-[160px] text-sm rounded-full border-neutral-200">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discount">Highest Discount</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: index * 0.015 }}
              >
                <Link href={`/product/${product.id}`}>
                  <div className="group h-full overflow-hidden bg-white border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 rounded-lg">
                    <div className="relative aspect-square overflow-hidden bg-[#f5f5f7]">
                      <Image
                        src={
                          product.thumbnail_url?.startsWith("http")
                            ? product.thumbnail_url
                            : product.image_urls?.[0]?.startsWith("http")
                              ? product.image_urls[0]
                              : product.thumbnail_url || product.image_urls?.[0] || "/placeholder.svg"
                        }
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 14vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          console.log("[v0] Image failed to load for product", product.id)
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                      {product.sale_price && product.sale_price < product.price && (
                        <div className="absolute left-0 top-1.5 bg-amber-600 text-white text-[9px] font-semibold px-1.5 py-0.5">
                          -{calculateDiscount(product.price, product.sale_price)}%
                        </div>
                      )}
                    </div>
                    <div className="p-1.5 sm:p-2 space-y-0.5">
                      <span className="inline-block rounded-sm bg-amber-50 px-1 py-0.5 text-[8px] sm:text-[9px] font-medium text-amber-700">
                        LUXURY DEAL
                      </span>
                      <h3 className="line-clamp-2 text-[10px] sm:text-xs font-medium text-gray-900 leading-tight">
                        {product.name}
                      </h3>
                      <div className="pt-0.5">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">
                          KSh {(product.sale_price || product.price).toLocaleString()}
                        </span>
                        {product.sale_price && product.sale_price < product.price && (
                          <div className="text-[9px] sm:text-[10px] text-gray-400 line-through">
                            KSh {product.price.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
