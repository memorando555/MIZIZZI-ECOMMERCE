'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import useSWR from 'swr';
import { Carousel } from '@/components/features/carousel';
import type {
  CarouselItem,
  PremiumExperience,
  ContactCTASlide,
  FeatureCard,
  ProductShowcaseCategory,
} from "@/lib/server/get-carousel-data"
import { FeatureCards } from "@/components/carousel/feature-cards"

interface CarouselLazyProps {
  initialFeatureCards: FeatureCard[];
}

// Fetcher function for SWR
const carouselFetcher = async () => {
  const response = await fetch('/api/carousel/lazy-load', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch carousel data');
  }
  
  return response.json();
};

export const CarouselLazy = memo(function CarouselLazy({ initialFeatureCards }: CarouselLazyProps) {
  const [isClient, setIsClient] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  
  // Use SWR to fetch carousel data with caching and retry logic
  const { data, isLoading, error } = useSWR(
    isClient ? 'carousel-data' : null,
    carouselFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      focusThrottleInterval: 300000, // 5 minutes
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      shouldRetryOnError: true,
    }
  );

  // Mark as client-side after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Hide placeholder once data is loaded or error occurs
  useEffect(() => {
    if (!isLoading && (data || error)) {
      // Add small delay to avoid flashing
      const timer = setTimeout(() => {
        setShowPlaceholder(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, data, error]);

  // Extract carousel data
  const carouselItems: CarouselItem[] = data?.carouselItems || [];
  const premiumExperiences: PremiumExperience[] = data?.premiumExperiences || [];
  const contactCTASlides: ContactCTASlide[] = data?.contactCTASlides || [];
  const productShowcase: ProductShowcaseCategory[] = data?.productShowcase || [];

  return (
    <div className="relative">
      {/* Show placeholder feature cards while carousel is loading */}
      {showPlaceholder && (
        <div className="animate-fade-in">
          <div className="hidden xl:block">
            <div className="rounded-lg bg-white shadow-sm p-4 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-48 mx-auto bg-gray-200 rounded-lg animate-pulse mb-4"></div>
                <div className="h-4 w-32 mx-auto bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show carousel once loaded */}
      {!showPlaceholder && isClient && (
        <Carousel
          carouselItems={carouselItems}
          premiumExperiences={premiumExperiences}
          contactCTASlides={contactCTASlides}
          featureCards={initialFeatureCards}
          productShowcase={productShowcase}
        />
      )}

      {/* Fallback: show feature cards if carousel fails to load */}
      {error && (
        <div className="hidden lg:block">
          <FeatureCards cards={initialFeatureCards} />
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 200ms ease-in-out;
        }
      `}</style>
    </div>
  );
});
