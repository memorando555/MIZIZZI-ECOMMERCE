'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * Cache invalidation endpoint for carousel updates
 * Called by backend webhook when carousel items are updated in admin panel
 * 
 * Usage: POST /api/carousel/invalidate
 * Body: { secret: REVALIDATION_SECRET }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    
    // Verify secret to prevent unauthorized cache invalidation
    const secret = process.env.REVALIDATION_SECRET || 'default-secret'
    if (body.secret !== secret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      )
    }

    // Revalidate carousel data cache
    revalidateTag('carousel-items')
    revalidateTag('premium-experiences')
    revalidateTag('contact-cta-slides')
    
    // Revalidate home page to regenerate with fresh carousel data
    revalidatePath('/', 'page')

    console.log('[v0] Cache invalidated for carousel')

    return NextResponse.json(
      { 
        revalidated: true,
        message: 'Carousel cache invalidated successfully',
        timestamp: new Date().toISOString()
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        }
      }
    )
  } catch (error) {
    console.error('[v0] Cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok',
      message: 'Cache invalidation endpoint is ready'
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
      }
    }
  )
}
