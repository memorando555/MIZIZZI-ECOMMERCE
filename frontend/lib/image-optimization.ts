/**
 * Image Optimization Utility
 * Handles modern image formats, responsive sizing, and efficient loading
 * Estimated savings: 4,376 KiB (from PageSpeed Insights audit)
 */

/**
 * Generate optimized image URL with modern format support
 * Converts external image URLs to use WebP/AVIF with fallbacks
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  options?: {
    width?: number
    quality?: number
    format?: "webp" | "avif" | "auto"
  }
): string {
  if (!imageUrl) return "/placeholder.svg"

  // Handle Unsplash URLs - add WebP quality parameter
  if (imageUrl.includes("unsplash.com")) {
    const separator = imageUrl.includes("?") ? "&" : "?"
    const quality = options?.quality || 80
    return `${imageUrl}${separator}q=${quality}&fm=auto`
  }

  // Handle onrender URLs
  if (imageUrl.includes("onrender.com")) {
    // onrender doesn't support query params for image format
    // but images are already compressed
    return imageUrl
  }

  // Handle svgator GIFs - convert to video
  if (imageUrl.includes("svgator.com") && imageUrl.endsWith(".gif")) {
    // Replace .gif with .webm for video format
    return imageUrl.replace(".gif", ".webm")
  }

  return imageUrl
}

/**
 * Generate srcSet for responsive images
 * Provides multiple sizes for different device widths
 */
export function generateImageSrcSet(
  imageUrl: string,
  sizes: number[] = [320, 640, 960, 1280]
): string {
  if (!imageUrl || imageUrl.includes("svgator")) return ""

  return sizes
    .map((size) => {
      const separator = imageUrl.includes("?") ? "&" : "?"
      const optimizedUrl = `${imageUrl}${separator}w=${size}&q=80`
      return `${optimizedUrl} ${size}w`
    })
    .join(", ")
}

/**
 * Get responsive sizes attribute for image
 * Helps browser choose the best image size
 */
export function getResponsiveSizes(displayWidths: string): string {
  // Example: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  return displayWidths
}

/**
 * Convert GIF URLs to video URLs for animation optimization
 * GIFs can be 5-10x larger than WebM videos with same visual quality
 */
export function convertGifToVideo(gifUrl: string): { webm?: string; mp4?: string } {
  if (!gifUrl.includes(".gif")) {
    return {}
  }

  // For svgator animations
  if (gifUrl.includes("svgator.com")) {
    const baseUrl = gifUrl.replace(".gif", "")
    return {
      webm: `${baseUrl}.webm`,
      mp4: `${baseUrl}.mp4`,
    }
  }

  return {}
}

/**
 * Format image sizes for Next.js Image component
 * Helps Next.js optimize responsive images
 */
export function getNextImageSizes(
  context: "hero" | "product" | "thumbnail" | "banner"
): string {
  const sizeMap: Record<string, string> = {
    hero: "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px",
    product: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
    thumbnail: "(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 15vw",
    banner: "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px",
  }
  return sizeMap[context] || sizeMap.product
}

/**
 * Check if URL points to a GIF that should be converted to video
 */
export function shouldConvertToVideo(url: string): boolean {
  return url.includes(".gif") && (url.includes("svgator.com") || url.includes("cdn"))
}

/**
 * Get performance-optimized image loading strategy
 */
export function getImageLoadingStrategy(
  context: "hero" | "above-fold" | "below-fold"
): {
  loading: "eager" | "lazy"
  priority: boolean
  decoding: "async" | "sync"
} {
  const strategies: Record<
    "hero" | "above-fold" | "below-fold",
    { loading: "eager" | "lazy"; priority: boolean; decoding: "async" | "sync" }
  > = {
    hero: {
      loading: "eager",
      priority: true,
      decoding: "sync",
    },
    "above-fold": {
      loading: "eager",
      priority: true,
      decoding: "async",
    },
    "below-fold": {
      loading: "lazy",
      priority: false,
      decoding: "async",
    },
  }

  return strategies[context]
}
