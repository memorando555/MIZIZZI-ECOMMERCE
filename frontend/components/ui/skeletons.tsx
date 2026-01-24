'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton for carousel section header + product grid
 */
export function CarouselSectionSkeleton() {
  return (
    <div className="rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Header skeleton */}
      <div className="bg-[#8B1538] text-white px-2 sm:px-4 py-1.5 sm:py-2">
        <Skeleton className="h-5 w-32 bg-white/20" />
      </div>

      {/* Carousel items skeleton */}
      <div className="p-1 sm:p-2">
        <div className="flex gap-1 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-1/6">
              <div className="space-y-2">
                <Skeleton className="w-full aspect-square rounded" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for carousel slider
 */
export function CarouselSkeleton() {
  return (
    <div className="w-full rounded-lg overflow-hidden">
      <Skeleton className="w-full aspect-[16/9]" />
    </div>
  )
}

/**
 * Skeleton for category grid
 */
export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 p-2 sm:p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="w-full aspect-square rounded-lg" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for product grid
 */
export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2 sm:p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="w-full aspect-square rounded" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}
