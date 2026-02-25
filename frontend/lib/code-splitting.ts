/**
 * Code Splitting & Dynamic Import Utilities
 * Implements lazy loading for heavy components to reduce initial bundle size
 */

import dynamic from "next/dynamic"
import type { ComponentType } from "react"

/**
 * Lazy load heavy components that are not immediately visible
 * Reduces initial JS bundle by deferring non-critical component imports
 */
export const DynamicCarousel = dynamic(
  () => import("@/components/features/carousel").then((mod) => mod.Carousel),
  {
    loading: () => <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />,
    ssr: true,
  }
)

export const DynamicProductCard = dynamic(
  () => import("@/components/ui/product-card").then((mod) => mod.ProductCard),
  {
    loading: () => <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />,
    ssr: true,
  }
)

export const DynamicEnhancedImage = dynamic(
  () => import("@/components/shared/enhanced-image").then((mod) => mod.EnhancedImage),
  {
    loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />,
    ssr: false, // Client-side only due to interactive hooks
  }
)

export const DynamicAnimatedImage = dynamic(
  () => import("@/components/shared/animated-image").then((mod) => mod.AnimatedImage),
  {
    loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />,
    ssr: true,
  }
)

export const DynamicUniversalImage = dynamic(
  () => import("@/components/shared/universal-image").then((mod) => mod.UniversalImage),
  {
    loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />,
    ssr: true,
  }
)

/**
 * Generic dynamic component loader with custom loading state
 */
export function createDynamicComponent<P extends Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  LoadingComponent?: ComponentType
) {
  return dynamic(importFn, {
    loading: LoadingComponent
      ? () => <LoadingComponent />
      : () => <div className="animate-pulse bg-gray-200 rounded h-96" />,
    ssr: true,
  })
}

/**
 * Intersection Observer hook for lazy loading below-the-fold content
 * Triggers image loading when elements enter viewport
 */
export function useLazyLoad(options?: IntersectionObserverInit) {
  if (typeof window === "undefined") return null

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLImageElement
        if (element.dataset.src) {
          element.src = element.dataset.src
          element.removeAttribute("data-src")
        }
        observer.unobserve(element)
      }
    })
  }, {
    rootMargin: "200px",
    threshold: 0.1,
    ...options,
  })
}

/**
 * Prefetch resource hint for critical assets
 * Improves performance by downloading important files in parallel
 */
export function prefetchResource(url: string, type: "image" | "style" | "script" | "font" = "image") {
  if (typeof window === "undefined") return

  const link = document.createElement("link")
  link.rel = type === "font" ? "preload" : "prefetch"
  link.as = type === "font" ? "font" : type
  link.href = url

  if (type === "font") {
    link.crossOrigin = "anonymous"
  }

  document.head.appendChild(link)
}

/**
 * Preload critical above-the-fold images
 */
export function preloadCriticalImages(imageUrls: string[]) {
  imageUrls.forEach((url) => {
    prefetchResource(url, "image")
  })
}

/**
 * Enable lazy loading for all img elements with data-src attribute
 */
export function initializeLazyLoading() {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    // Fallback for browsers without IntersectionObserver
    const images = document.querySelectorAll("img[data-src]")
    images.forEach((img: any) => {
      img.src = img.dataset.src
    })
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute("data-src")
            observer.unobserve(img)
          }
        }
      })
    },
    { rootMargin: "200px" }
  )

  const images = document.querySelectorAll("img[data-src]")
  images.forEach((img) => observer.observe(img))
}

/**
 * Performance monitoring utility
 */
export function reportWebVitals(metric: any) {
  if (typeof window !== "undefined" && "navigator" in window) {
    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      const body = JSON.stringify(metric)
      navigator.sendBeacon("/api/metrics", body)
    }
  }
}
