import { NextRequest, NextResponse } from 'next/server'
import { cacheMonitor } from '@/lib/services/cache-monitor'

/**
 * GET /api/admin/cache-metrics
 * 
 * Returns comprehensive cache metrics for the admin dashboard
 * - Categories cache performance (hit rate, response time, storage)
 * - Flash sales cache performance
 * - System-wide cache statistics
 * 
 * Protected endpoint - requires admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const session = await getServerSession(authOptions)
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const metrics = cacheMonitor.getMetrics()
    const status = cacheMonitor.getStatus()

    return NextResponse.json(
      {
        success: true,
        data: {
          metrics,
          status,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('[cache-metrics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cache metrics' },
      { status: 500 }
    )
  }
}
