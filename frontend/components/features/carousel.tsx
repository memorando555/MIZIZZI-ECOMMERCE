"use client"

import { AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { useCarousel } from "@/hooks/use-carousel"
import { useResponsiveLayout } from "@/hooks/use-responsive-layout"
import { CarouselSlide } from "@/components/carousel/carousel-slide"
import { CarouselNavigation } from "@/components/carousel/carousel-navigation"
import { FeatureCards } from "@/components/carousel/feature-cards"
import { ContactCTA } from "@/components/carousel/contact-cta"
import { PremiumCustomerExperience } from "@/components/carousel/premium-customer-experience"
import { ProductShowcase } from "@/components/carousel/product-showcase"
import useSWR from "swr"
import type { CarouselItem } from "@/types/carousel"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://mizizzi-ecommerce-1.onrender.com"

const FALLBACK_CAROUSEL_ITEMS: CarouselItem[] = [
  {
    image: "https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    title: "Summer Collection 2025",
    description: "Discover the latest trends in fashion with our exclusive summer collection",
    buttonText: "Shop Now",
    href: "/products?category=fashion",
    badge: "NEW",
    discount: "20% OFF",
  },
  {
    image: "https://images.pexels.com/photos/5632381/pexels-photo-5632381.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    title: "Premium Streetwear",
    description: "Urban style meets premium quality in our streetwear collection",
    buttonText: "Explore",
    href: "/products?category=streetwear",
    badge: "TRENDING",
    discount: "15% OFF",
  },
  {
    image: "https://images.pexels.com/photos/5709661/pexels-photo-5709661.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    title: "Luxury Accessories",
    description: "Complete your look with our handpicked luxury accessories",
    buttonText: "View Collection",
    href: "/products?category=accessories",
    badge: "EXCLUSIVE",
    discount: "",
  },
  {
    image: "https://images.pexels.com/photos/6567607/pexels-photo-6567607.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    title: "Athletic Performance",
    description: "Gear up with our high-performance athletic wear",
    buttonText: "Shop Athletic",
    href: "/products?category=athletic",
    badge: "POPULAR",
    discount: "25% OFF",
  },
  {
    image: "https://images.pexels.com/photos/5868722/pexels-photo-5868722.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    title: "Evening Elegance",
    description: "Make a statement with our stunning evening wear collection",
    buttonText: "Discover",
    href: "/products?category=evening",
    badge: "LIMITED",
    discount: "30% OFF",
  },
]

const carouselFetcher = async (url: string): Promise<CarouselItem[]> => {
  const response = await fetch(url)
  const data = await response.json()

  if (data.success && data.items && data.items.length > 0) {
    return data.items.map((item: any) => ({
      image: item.image_url,
      title: item.title,
      description: item.description,
      buttonText: item.button_text || "Shop Now",
      href: item.link_url || "/products",
      badge: item.badge_text,
      discount: item.discount,
    }))
  }
  // Return fallback if API returns empty
  return FALLBACK_CAROUSEL_ITEMS
}

export function Carousel() {
  const { sidePanelsVisible, isDesktop } = useResponsiveLayout()

  const { data: carouselItems = FALLBACK_CAROUSEL_ITEMS } = useSWR(
    `${API_BASE_URL}/api/carousel/items?position=homepage`,
    carouselFetcher,
    {
      fallbackData: FALLBACK_CAROUSEL_ITEMS, // Shows immediately
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
      errorRetryCount: 2,
    },
  )

  const { currentSlide, isPaused, nextSlide, prevSlide, pause, resume } = useCarousel({
    itemsLength: carouselItems.length,
    autoPlay: true,
  })

  useEffect(() => {
    if (carouselItems.length > 1) {
      const nextIndex = (currentSlide + 1) % carouselItems.length
      const img = new Image()
      img.src = carouselItems[nextIndex].image
    }
  }, [currentSlide, carouselItems])

  const activeItem = carouselItems[currentSlide]

  return (
    <div className="relative w-full overflow-hidden max-w-full">
      {isDesktop && sidePanelsVisible && (
        <div className="absolute left-0 top-0 z-10 hidden h-full w-[140px] transform p-2 xl:block xl:w-[220px]">
          <ProductShowcase />
        </div>
      )}

      {isDesktop && sidePanelsVisible && (
        <div className="absolute right-0 top-0 z-10 hidden h-full w-[280px] transform p-2 xl:block xl:w-[220px]">
          <PremiumCustomerExperience />
        </div>
      )}

      {/* Main carousel content */}
      <div
        className={cn(
          "relative mx-auto grid w-full max-w-[1200px] gap-3 sm:gap-4 overflow-hidden",
          isDesktop && sidePanelsVisible ? "xl:grid-cols-[1fr,280px] xl:px-2" : "px-2 sm:px-4",
          "transition-all duration-300",
        )}
      >
        {/* Enhanced main carousel */}
        <main
          className="relative h-[300px] overflow-hidden rounded-xl border border-gray-100 shadow-sm sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[400px]"
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocus={pause}
          onBlur={resume}
          role="region"
          aria-label="Featured products carousel"
          aria-live="polite"
          style={{ backgroundColor: "var(--color-background, #FFFFFF)" }}
        >
          <div className="absolute inset-0">
            <AnimatePresence mode="sync" initial={false}>
              {activeItem ? (
                <CarouselSlide
                  key={String(currentSlide)}
                  item={activeItem as any}
                  isActive={true}
                  index={currentSlide}
                />
              ) : (
                <div key="empty" className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No carousel items available</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          {carouselItems.length > 0 && (
            <CarouselNavigation
              onPrevious={prevSlide}
              onNext={nextSlide}
              isPaused={isPaused}
              onPause={pause}
              onResume={resume}
            />
          )}
        </main>

        {/* Side cards - Large tablets and desktop only */}
        <aside className={cn("hidden flex-col gap-3 lg:flex xl:h-[400px]")} aria-label="Quick actions and promotions">
          <FeatureCards />
          <ContactCTA />
        </aside>
      </div>
    </div>
  )
}
