/*
  Optimized Carousel Component with LQIP and Blur Transitions
  Features:
  - Uses LQIP (Low Quality Image Placeholder) for instant display
  - Blur-up animation from placeholder to full image
  - Responsive images with srcset
  - Lazy loading for better performance
*/

"use client"

import { useState, useMemo, memo, useEffect } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useCarousel } from "@/hooks/use-carousel"
import { useResponsiveLayout } from "@/hooks/use-responsive-layout"
import { AnimatePresence } from "framer-motion"
import { CarouselSlide } from "@/components/carousel/carousel-slide"
import { CarouselNavigation } from "@/components/carousel/carousel-navigation"
import { FeatureCards } from "@/components/carousel/feature-cards"
import { ContactCTA } from "@/components/carousel/contact-cta"
import { PremiumCustomerExperience } from "@/components/carousel/premium-customer-experience"
import { ProductShowcase } from "@/components/carousel/product-showcase"
import type {
  CarouselItem,
  PremiumExperience,
  ContactCTASlide,
  FeatureCard,
  ProductShowcaseCategory,
} from "@/lib/server/get-carousel-data"

interface OptimizedCarouselProps {
  carouselItems?: CarouselItem[]
  premiumExperiences?: PremiumExperience[]
  contactCTASlides?: ContactCTASlide[]
  featureCards?: FeatureCard[]
  productShowcase?: ProductShowcaseCategory[]
}

/**
 * Ultra-optimized carousel with LQIP and blur transition effects
 * Shows instantly with LQIP, transitions smoothly to full image when loaded
 */
export const OptimizedCarousel = memo(function OptimizedCarousel({
  carouselItems: serverCarouselItems = [],
  premiumExperiences = [],
  contactCTASlides = [],
  featureCards = [],
  productShowcase = [],
}: OptimizedCarouselProps) {
  const { sidePanelsVisible, isDesktop } = useResponsiveLayout()
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({})

  // Memoize carousel items
  const carouselItems = useMemo(() => serverCarouselItems, [serverCarouselItems])

  const { currentSlide, direction, isPaused, nextSlide, prevSlide, pause, resume } = useCarousel({
    itemsLength: carouselItems.length || 1,
    autoPlay: carouselItems.length > 0,
  })

  const [prevSlideIndex, setPrevSlideIndex] = useState(currentSlide)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPrevSlideIndex(currentSlide)
    }, 600)
    return () => clearTimeout(timer)
  }, [currentSlide])

  // Memoize active items
  const activeItem = useMemo(() => carouselItems[currentSlide], [carouselItems, currentSlide])
  const prevItem = useMemo(() => carouselItems[prevSlideIndex], [carouselItems, prevSlideIndex])

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => ({ ...prev, [index]: true }))
  }

  if (carouselItems.length === 0) {
    // Fallback: Show feature cards if no carousel items
    if (featureCards && featureCards.length > 0) {
      return <FeatureCards cards={featureCards} />
    }
    // If no carousel and no features, return minimal placeholder
    return (
      <div className="mx-auto w-full max-w-[1200px] px-2 sm:px-4 py-4">
        <div className="h-[200px] sm:h-[400px] rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden">
      {isDesktop && sidePanelsVisible && (
        <div className="absolute left-0 top-0 z-10 hidden h-full w-[140px] transform p-2 xl:block xl:w-[220px]">
          <ProductShowcase categories={productShowcase} />
        </div>
      )}

      {isDesktop && sidePanelsVisible && (
        <div className="absolute right-0 top-0 z-10 hidden h-full w-[280px] transform p-2 xl:block xl:w-[220px]">
          <PremiumCustomerExperience experiences={premiumExperiences} />
        </div>
      )}

      <div
        className={cn(
          "relative w-full",
          isDesktop && sidePanelsVisible
            ? "mx-auto max-w-[1200px] grid gap-3 sm:gap-4 xl:grid-cols-[1fr,280px] xl:px-2"
            : "sm:mx-auto sm:max-w-[1200px]",
          "transition-all duration-300",
        )}
      >
        {/* Main carousel with LQIP support */}
        <main
          className={cn(
            "relative w-full overflow-hidden",
            "rounded-xl border border-gray-100 shadow-sm",
            "h-[200px] xs:h-[220px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[400px]",
          )}
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocus={pause}
          onBlur={resume}
          role="region"
          aria-label="Featured products carousel"
          aria-live="polite"
        >
          {/* LQIP Placeholder Layer - Shows instantly */}
          {prevItem && (
            <div
              className={cn(
                "absolute inset-0 z-0 bg-gray-100 transition-opacity duration-700",
                imageLoaded[currentSlide] ? "opacity-0" : "opacity-100"
              )}
              style={{
                backgroundImage: prevItem.lqip ? `url(${prevItem.lqip})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(8px)"
              }}
              aria-hidden="true"
            />
          )}

          {/* Full Resolution Image Layer */}
          {prevItem && (
            <Image
              src={prevItem.image || "/placeholder.svg"}
              alt={prevItem.title || "Carousel item"}
              fill
              className={cn(
                "object-cover transition-opacity duration-700 ease-out",
                imageLoaded[currentSlide] ? "opacity-100" : "opacity-0"
              )}
              priority={currentSlide === 0}
              onLoad={() => handleImageLoad(currentSlide)}
              sizes={`(max-width: 640px) 100vw, 
                     (max-width: 1024px) 100vw, 
                     (max-width: 1280px) calc(100vw - 280px),
                     1200px`}
              quality={85}
              placeholder={prevItem.lqip ? "empty" : "blur"}
            />
          )}

          {/* Animated Content */}
          <AnimatePresence initial={false} custom={direction} mode="sync">
            {activeItem && (
              <CarouselSlide
                key={currentSlide}
                item={activeItem as any}
                isActive={true}
                index={currentSlide}
                direction={direction}
              />
            )}
          </AnimatePresence>

          {/* Navigation */}
          {carouselItems.length > 1 && (
            <CarouselNavigation
              onPrevious={prevSlide}
              onNext={nextSlide}
              isPaused={isPaused}
              onPause={pause}
              onResume={resume}
            />
          )}
        </main>

        {/* Side cards */}
        <aside className={cn("hidden flex-col gap-3 lg:flex xl:h-[400px]")} aria-label="Quick actions">
          <FeatureCards cards={featureCards} />
          <ContactCTA slides={contactCTASlides} />
        </aside>
      </div>

      <style jsx global>{`
        @keyframes blurIn {
          0% { filter: blur(20px); opacity: 0.8; }
          100% { filter: blur(0); opacity: 1; }
        }

        .carousel-image-loading {
          animation: blurIn 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  )
})
