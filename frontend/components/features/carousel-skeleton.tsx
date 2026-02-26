/*
  Carousel Skeleton Loader Component
  Displays a beautiful placeholder that transforms into the carousel content
  Provides visual continuity while carousel data is loading
*/

"use client"

import { cn } from "@/lib/utils"
import { memo } from "react"

interface CarouselSkeletonProps {
  count?: number
  height?: string
}

/**
 * Skeleton loader for carousel - shows while data is loading
 * Automatically hides when carousel content is rendered
 */
export const CarouselSkeleton = memo(function CarouselSkeleton({
  count = 1,
  height = "h-[200px] xs:h-[220px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[400px]"
}: CarouselSkeletonProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Main carousel skeleton */}
      <div
        className={cn(
          "relative w-full",
          "rounded-xl border border-gray-100 shadow-sm",
          "mx-auto max-w-[1200px]",
          height,
          "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
          "animate-pulse"
        )}
      >
        {/* Shimmer effect */}
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            animationDuration: "2s",
            animationIterationCount: "infinite"
          }}
        />

        {/* Content skeleton */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 md:p-8">
          {/* Title skeleton */}
          <div className="space-y-2 sm:space-y-3">
            <div className="h-6 sm:h-8 w-2/3 rounded bg-gray-300/50" />
            <div className="h-4 sm:h-5 w-1/2 rounded bg-gray-300/40" />
          </div>

          {/* Button skeleton */}
          <div className="h-10 sm:h-12 w-32 sm:w-40 rounded bg-gray-300/50" />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
})

/**
 * Carousel skeleton for responsive layouts
 */
export const CarouselResponsiveSkeleton = memo(function CarouselResponsiveSkeleton() {
  return (
    <div className="relative overflow-hidden">
      <div className="w-full">
        {/* Desktop layout */}
        <div className="hidden xl:block">
          <div className="mx-auto max-w-[1200px] grid gap-4 grid-cols-[1fr,280px]">
            {/* Main carousel skeleton */}
            <div
              className={cn(
                "relative w-full",
                "rounded-xl border border-gray-100 shadow-sm",
                "h-[400px]",
                "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
                "animate-pulse"
              )}
            >
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Side content skeleton */}
            <div className="flex flex-col gap-4">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet layout */}
        <div className="xl:hidden">
          <div
            className={cn(
              "relative w-full mx-auto max-w-[1200px]",
              "rounded-xl border border-gray-100 shadow-sm",
              "h-[200px] xs:h-[220px] sm:h-[400px] md:h-[450px] lg:h-[500px]",
              "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
              "animate-pulse"
            )}
          >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
})
