import { NextRequest, NextResponse } from 'next/server'
import { cacheMonitor } from '@/lib/services/cache-monitor'

/**
 * GET /api/admin/cache-events
 * 
 * Returns cache events log for analytics and troubleshooting
 * - All cache hits, misses, invalidations
 * - Error events with details
 * - Queryable by source (categories / flash-sales)
 * 
 * Query parameters:
 * - source: 'categories' | 'flash-sales' (optional)
 * - limit: number (default: 100, max: 1000)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source') as 'categories' | 'flash-sales' | null
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

    const events = cacheMonitor.getEvents(source || undefined, limit)

    return NextResponse.json(
      {
        success: true,
        data: {
          events,
          total: events.length,
          source: source || 'all',
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('[cache-events] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cache events' },
      { status: 500 }
    )
  }
}
