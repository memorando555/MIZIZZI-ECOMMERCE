import { NextRequest, NextResponse } from 'next/server'
import { cacheMonitor } from '@/lib/services/cache-monitor'

/**
 * GET /api/admin/cache-status
 * 
 * Returns real-time cache health status for dashboard
 * - Health indicator (excellent/good/warning/critical)
 * - List of issues detected
 * - Recommendations for improvement
 * 
 * Lightweight endpoint for frequent polling
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const status = cacheMonitor.getStatus()

    return NextResponse.json(
      {
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('[cache-status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cache status' },
      { status: 500 }
    )
  }
}
