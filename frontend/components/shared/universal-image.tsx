"use client"

import { useState, useEffect, useRef, CSSProperties } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface UniversalImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  containerClassName?: string
  priority?: boolean
  quality?: number
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down"
  objectPosition?: string
  sizes?: string
  placeholder?: "blur" | "empty"
  blurDataURL?: string
  fallbackSrc?: string
  onLoad?: () => void
  onError?: () => void
  showLoadingIndicator?: boolean
  style?: CSSProperties
}

/**
 * UniversalImage Component
 * 
 * Optimized image component with:
 * - Automatic AVIF/WebP format selection with fallbacks
 * - Responsive srcset generation
 * - Progressive loading with IntersectionObserver
 * - Error handling with retry logic
 * - Loading states with skeleton placeholders
 * - Proper cache directives via Next.js Image optimization
 */
export function UniversalImage({
  src,
  alt,
  width = 500,
  height = 500,
  className,
  containerClassName,
  priority = false,
  quality = 82,
  objectFit = "cover",
  objectPosition = "center",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  placeholder = "empty",
  blurDataURL,
  fallbackSrc = "/placeholder.svg",
  onLoad,
  onError,
  showLoadingIndicator = true,
  style,
}: UniversalImageProps) {
  const [isLoading, setIsLoading] = useState(!priority)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isVisible, setIsVisible] = useState(priority)
  const containerRef = useRef<HTMLDivElement>(null)

  const imageSrc = src || fallbackSrc

  // Intersection Observer for lazy loading below-the-fold images
  useEffect(() => {
    if (priority || isVisible) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: "200px" }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [priority, isVisible])

  const handleImageLoad = () => {
    setIsLoading(false)
    setError(false)
    onLoad?.()
  }

  const handleImageError = () => {
    console.warn(`[v0] Image failed to load: ${imageSrc}`)
    
    // Retry logic with exponential backoff (max 3 retries)
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000
      setTimeout(() => {
        setRetryCount(retryCount + 1)
      }, delay)
    } else {
      setError(true)
      setIsLoading(false)
      onError?.()
    }
  }

  // Show image if priority or visible
  if (!isVisible) {
    return (
      <div
        ref={containerRef}
        className={cn("relative overflow-hidden bg-gray-100", containerClassName)}
        style={{
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : "auto",
          aspectRatio: width && height ? `${width}/${height}` : undefined,
          ...style,
        }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-gray-100", containerClassName)}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
        aspectRatio: width && height ? `${width}/${height}` : undefined,
        ...style,
      }}
    >
      {/* Loading skeleton */}
      {isLoading && showLoadingIndicator && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-100 z-10" />
      )}

      {/* Next.js Image with optimization */}
      {!error && (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes={sizes}
          decoding="async"
          className={cn(
            "w-full h-full transition-all duration-300",
            isLoading ? "scale-105 blur-md" : "scale-100 blur-0",
            objectFit === "cover" && "object-cover",
            objectFit === "contain" && "object-contain",
            objectFit === "fill" && "object-fill",
            objectFit === "none" && "object-none",
            objectFit === "scale-down" && "object-scale-down",
            className
          )}
          style={{
            objectPosition,
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          placeholder={placeholder === "blur" ? "blur" : undefined}
          blurDataURL={placeholder === "blur" ? (blurDataURL || undefined) : undefined}
        />
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs text-gray-500 mt-2">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  )
}
