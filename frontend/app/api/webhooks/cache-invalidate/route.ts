/**
 * Webhook receiver for backend cache invalidation events
 * Called by backend when admin updates carousel, products, or categories
 * 
 * Setup on backend: POST to https://your-frontend/api/webhooks/cache-invalidate
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  revalidateHomepage, 
  revalidateProducts, 
  revalidateCategories 
} from '@/lib/cache-management'

// Webhook secret for authentication
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || process.env.REVALIDATION_SECRET || 'default-secret'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const secret = request.headers.get('x-webhook-secret') || 
                   request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (secret !== WEBHOOK_SECRET) {
      console.warn('[v0] Webhook rejected: Invalid secret')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const eventType = body.event_type || body.type || 'unknown'

    console.log(`[v0] Webhook received: ${eventType}`)

    // Route to appropriate cache revalidation based on event type
    switch (eventType) {
      case 'carousel.updated':
      case 'carousel.created':
      case 'carousel.deleted':
        await revalidateHomepage()
        break

      case 'product.updated':
      case 'product.created':
      case 'product.deleted':
      case 'flash_sale.updated':
      case 'flash_sale.created':
        await revalidateProducts()
        break

      case 'category.updated':
      case 'category.created':
      case 'category.deleted':
        await revalidateCategories()
        break

      case 'all':
      case 'full_cache_clear':
        // Revalidate everything
        await Promise.all([
          revalidateHomepage(),
          revalidateProducts(),
          revalidateCategories(),
        ])
        break

      default:
        console.log(`[v0] Unknown webhook event type: ${eventType}`)
    }

    return NextResponse.json(
      {
        success: true,
        message: `Cache invalidated for event: ${eventType}`,
        timestamp: new Date().toISOString(),
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        }
      }
    )
  } catch (error) {
    console.error('[v0] Webhook error:', error)
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store' }
      }
    )
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json(
    {
      status: 'ok',
      message: 'Webhook endpoint is active',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-cache' }
    }
  )
}
