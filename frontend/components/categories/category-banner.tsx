"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { OptimizedImage } from "@/components/ui/optimized-image"

interface CategoryBanner {
  image: string
  title: string
  subtitle: string
  buttonText: string
  buttonLink: string
  badge?: string
  discount?: string
}

const HARDCODED_BANNERS: CategoryBanner[] = [
  {
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1400&h=280&fit=crop&q=80",
    title: "SPORT INSPIRED SCENTS",
    subtitle: "Get 25% off on premium fragrances and body care products",
    buttonText: "SHOP NOW",
    buttonLink: "/products?category=fragrances",
    badge: "NEW COLLECTION",
    discount: "25% OFF",
  },
  {
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&h=280&fit=crop&q=80",
    title: "SUMMER COLLECTION",
    subtitle: "Discover the latest trends in fashion this season",
    buttonText: "EXPLORE",
    buttonLink: "/products?category=fashion",
    badge: "LIMITED TIME",
    discount: "UP TO 50% OFF",
  },
  {
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&h=280&fit=crop&q=80",
    title: "TECH DEALS",
    subtitle: "Amazing discounts on electronics and gadgets",
    buttonText: "SHOP ELECTRONICS",
    buttonLink: "/products?category=electronics",
    badge: "MEGA SALE",
    discount: "30% OFF",
  },
]

export function CategoryBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const banner = HARDCODED_BANNERS[currentSlide]

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev === 0 ? HARDCODED_BANNERS.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev === HARDCODED_BANNERS.length - 1 ? 0 : prev + 1))
  }

  return (
    <section
      className="relative w-full bg-gray-900 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[200px] sm:h-[220px] md:h-[250px] lg:h-[280px] w-full overflow-hidden">
        {/* Banner Image */}
        <OptimizedImage
          src={banner.image}
          alt={banner.title}
          className="object-cover"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        {/* Banner Content */}
        <div className="absolute inset-0 flex flex-col justify-center p-4 sm:p-6 md:p-8 lg:p-10">
          <div className="max-w-xl">
            {/* Badge */}
            {banner.badge && (
              <div className="mb-2 inline-block">
                <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 text-xs font-semibold rounded-full border border-white/30">
                  {banner.badge}
                </span>
              </div>
            )}

            {/* Main Title - Reduced size */}
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight tracking-wide">
              {banner.title}
            </h2>

            {/* Subtitle - Reduced size */}
            <p className="text-xs sm:text-sm md:text-base text-white/90 mb-3 max-w-md font-medium">
              {banner.subtitle}
            </p>

            {/* CTA Button - Reduced padding */}
            <a
              href={banner.buttonLink}
              className="inline-block bg-white text-gray-900 hover:bg-orange-100 font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-md text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {banner.buttonText}
            </a>

            {/* Discount Badge (optional) - Reduced size */}
            {banner.discount && (
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-orange-500 text-white font-bold px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs">
                {banner.discount}
              </div>
            )}
          </div>
        </div>

        {HARDCODED_BANNERS.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white p-1.5 sm:p-2 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white p-1.5 sm:p-2 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {HARDCODED_BANNERS.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {HARDCODED_BANNERS.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full border border-white/50 ${
                  index === currentSlide ? "bg-white w-6 h-1.5" : "bg-white/40 w-1.5 h-1.5"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
