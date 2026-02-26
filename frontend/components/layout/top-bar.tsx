"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTopBar } from "@/hooks/use-swr-topbar"

interface TopBarSlide {
  id: number
  campaign: string
  subtext: string
  bgColor: string
  productImageUrl: string
  productAlt: string
  centerContentType: "phone" | "brands" | "text"
  centerContentData: any
  buttonText: string
  buttonLink: string
  isActive: boolean
  sortOrder: number
}

export function TopBar() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { slides, isLoading, hasData } = useTopBar()

  useEffect(() => {
    if (slides.length === 0) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [slides.length])

  const renderCenterContent = (slide: TopBarSlide) => {
    switch (slide.centerContentType) {
      case "phone":
        return (
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm md:text-base font-medium">Call or WhatsApp</span>
            <span className="text-lg md:text-2xl font-black tracking-wide">
              {slide.centerContentData?.phoneNumber || "0711 011 011"}
            </span>
            <span className="text-sm md:text-base font-medium">to order</span>
          </div>
        )
      case "brands":
        return (
          <div className="flex items-center gap-6 opacity-90">
            {(slide.centerContentData?.brands || []).map((brand: string, i: number) => (
              <span key={i} className="text-white font-bold text-sm tracking-wider uppercase">
                {brand}
              </span>
            ))}
          </div>
        )
      case "text":
      default:
        return (
          <span className="text-lg md:text-2xl font-bold text-white tracking-wide">
            {slide.centerContentData?.text || ""}
          </span>
        )
    }
  }

  if (isLoading && !hasData) {
    return null
  }

  if (slides.length === 0) {
    return null
  }

  return (
    <div className="sticky top-0 z-50 w-full overflow-hidden h-[50px] md:h-[60px] bg-black text-white">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out flex items-center justify-between px-4 md:px-8",
            currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0",
          )}
          style={{ backgroundColor: slide.bgColor }}
        >
          {/* Left Side: Mizizzi Brand & Campaign */}
          <div className="flex items-center gap-4 md:gap-8 flex-1 overflow-hidden">
            {/* Mizizzi Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 group z-10">
              <div className="relative w-6 h-6 md:w-8 md:h-8">
                <Image src="/logo.png" alt="Mizizzi Logo" fill sizes="32px" className="object-contain" />
              </div>

              <span className="text-xl md:text-2xl font-bold tracking-tighter text-white group-hover:text-gray-200 transition-colors">
                MIZIZZI
              </span>

              <div className="flex items-center gap-0.5 bg-orange-500/90 px-1.5 py-0.5 rounded">
                <span className="text-white font-bold text-xs md:text-sm">5</span>
                <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-white fill-white" />
              </div>
            </Link>

            {/* Campaign Text */}
            <div className="hidden sm:flex flex-col leading-none flex-shrink-0 text-white">
              <span className="font-black text-lg md:text-xl tracking-tighter text-yellow-400">{slide.campaign}</span>
              <span className="font-bold text-[10px] md:text-xs tracking-widest opacity-90">{slide.subtext}</span>
            </div>

            {/* Vertical Divider */}
            <div className="h-8 w-px bg-white/20 hidden md:block" />

            {/* Center Content */}
            <div className="hidden md:flex items-center justify-center flex-1 px-4">{renderCenterContent(slide)}</div>
          </div>

          {/* Right Side: Product Image & CTA */}
          <div className="flex items-center gap-4 flex-shrink-0 z-10">
            <div className="relative w-12 h-12 md:w-16 md:h-16 -my-2">
              <Image
                src={slide.productImageUrl || "/placeholder.svg"}
                alt={slide.productAlt}
                fill
                className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transform hover:scale-110 transition-transform duration-300"
              />
            </div>

            <Link
              href={slide.buttonLink}
              className="bg-white text-black hover:bg-orange-500 hover:text-white transition-all duration-300 font-bold text-xs md:text-sm px-4 py-2 rounded-sm uppercase tracking-wide whitespace-nowrap flex items-center gap-1 group"
            >
              {slide.buttonText}
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
