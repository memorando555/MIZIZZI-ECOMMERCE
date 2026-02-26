'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { Product } from '@/types'

// Lazy load product section components
const FlashSales = dynamic(() => import('@/components/features/flash-sales').then(m => ({ default: m.FlashSales })), {
  loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />,
  ssr: false
})

const LuxuryDeals = dynamic(() => import('@/components/features/luxury-deals').then(m => ({ default: m.LuxuryDeals })), {
  loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />,
  ssr: false
})

const TopPicks = dynamic(() => import('@/components/features/top-picks').then(m => ({ default: m.TopPicks })), {
  loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />,
  ssr: false
})

const NewArrivals = dynamic(() => import('@/components/features/new-arrivals').then(m => ({ default: m.NewArrivals })), {
  loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />,
  ssr: false
})

const TrendingNow = dynamic(() => import('@/components/features/trending-now').then(m => ({ default: m.TrendingNow })), {
  loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />,
  ssr: false
})

const DailyFinds = dynamic(() => import('@/components/features/daily-finds').then(m => ({ default: m.DailyFinds })), {
  loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />,
  ssr: false
})

const BrandShowcase = dynamic(() => import('@/components/features/brand-showcase').then(m => ({ default: m.BrandShowcase })), {
  loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />,
  ssr: false
})

interface LazyProductSectionProps {
  products: Product[]
  title: string
  Component: any
}

function LazyProductSection({ products, title, Component }: LazyProductSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '100px' } // Start loading 100px before entering viewport
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="rounded-lg bg-white shadow-sm overflow-hidden">
      {isVisible ? (
        <Component products={products} />
      ) : (
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      )}
    </div>
  )
}

export { LazyProductSection, FlashSales, LuxuryDeals, TopPicks, NewArrivals, TrendingNow, DailyFinds, BrandShowcase }
