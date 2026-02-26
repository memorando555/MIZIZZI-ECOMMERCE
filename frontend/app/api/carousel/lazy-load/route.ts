import { NextResponse } from 'next/server';
import { getCarouselItems, getPremiumExperiences, getContactCTASlides, getProductShowcase } from '@/lib/server/get-carousel-data';

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    // Fetch all carousel data in parallel
    const [carouselItems, premiumExperiences, contactCTASlides, productShowcase] = await Promise.all([
      getCarouselItems(),
      getPremiumExperiences(),
      getContactCTASlides(),
      getProductShowcase(),
    ]);

    // Return carousel data
    return NextResponse.json({
      success: true,
      carouselItems,
      premiumExperiences,
      contactCTASlides,
      productShowcase,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache + 10 min stale
      },
    });
  } catch (error) {
    console.error('[v0] Carousel lazy load API error:', error);
    return NextResponse.json({
      success: false,
      carouselItems: [],
      premiumExperiences: [],
      contactCTASlides: [],
      productShowcase: [],
      error: 'Failed to fetch carousel data',
    }, {
      status: 200, // Return 200 so client doesn't retry aggressively
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
