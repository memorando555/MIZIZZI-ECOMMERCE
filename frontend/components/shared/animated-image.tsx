"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { shouldConvertToVideo, convertGifToVideo } from "@/lib/image-optimization"

interface AnimatedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  loading?: "eager" | "lazy"
  decoding?: "async" | "sync"
  objectFit?: "contain" | "cover" | "fill" | "scale-down"
  objectPosition?: string
}

/**
 * Optimized image component that converts GIFs to WebM/MP4 videos
 * Savings: ~1.2 MB for svgator animations
 */
export function AnimatedImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  priority,
  loading = "lazy",
  decoding = "async",
  objectFit = "cover",
  objectPosition = "center",
}: AnimatedImageProps) {
  const [isVideoFormat, setIsVideoFormat] = useState(false)
  const [videoFormats, setVideoFormats] = useState<{
    webm?: string
    mp4?: string
  }>({})

  useEffect(() => {
    if (shouldConvertToVideo(src)) {
      setIsVideoFormat(true)
      const formats = convertGifToVideo(src)
      setVideoFormats(formats)
    }
  }, [src])

  // Render as video if it's a GIF that should be converted
  if (isVideoFormat && (videoFormats.webm || videoFormats.mp4)) {
    return (
      <video
        className={className}
        autoPlay
        loop
        muted
        playsInline
        style={{
          objectFit: objectFit as any,
          objectPosition: objectPosition,
        }}
      >
        {videoFormats.webm && <source src={videoFormats.webm} type="video/webm" />}
        {videoFormats.mp4 && <source src={videoFormats.mp4} type="video/mp4" />}
        <img src={src} alt={alt} className={className} />
      </video>
    )
  }

  // Render as regular image
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        style={{ objectFit, objectPosition }}
        priority={priority}
        loading={loading}
        decoding={decoding}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ objectFit, objectPosition }}
      priority={priority}
      loading={loading}
      decoding={decoding}
    />
  )
}
