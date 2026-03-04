import { NextResponse } from 'next/server'
import type { Product } from '@/types'
import { API_BASE_URL } from '@/lib/config'

/**
 * UNIFIED HOMEPAGE BATCH ENDPOINT
 * 
 * This is a PROXY that forwards requests to the backend's high-performance
 * /api/homepage/batch endpoint which uses parallel ThreadPoolExecutor execution.
 * 
 * The backend endpoint returns all homepage sections in a single optimized request:
 * - Flash Sales
 * - Trending
 * - Top Picks
 * - New Arrivals
 * - Daily Finds
 * - Luxury Deals
 * 
 * Backend handles the heavy lifting with parallel queries (~150ms total execution)
 * Frontend just proxies and caches the response
 */

interface BackendBatchResponse {
  timestamp: string
  total_execution_ms: number
  cached: boolean
  sections: {
    flash_sales?: { products: Product[]; count: number; success: boolean }
    trending?: { products: Product[]; count: number; success: boolean }
    top_picks?: { products: Product[]; count: number; success: boolean }
    new_arrivals?: { products: Product[]; count: number; success: boolean }
    daily_finds?: { products: Product[]; count: number; success: boolean }
    luxury_deals?: { products: Product[]; count: number; success: boolean }
  }
  meta?: {
    total_products: number
    sections_fetched: number
    parallel_execution: boolean
  }
}

interface HomepageBatchResponse {
  flashSaleProducts: Product[]
  flashSaleEvent: any | null
  trendingProducts: Product[]
  topPicksProducts: Product[]
  newArrivalsProducts: Product[]
  dailyFindsProducts: Product[]
  luxuryDealsProducts: Product[]
  timestamp: number
  duration: number
  cached: boolean
  backendExecutionMs: number
}

export async function GET(request: Request) {
  const startTime = performance.now()

  try {
    const { searchParams } = new URL(request.url)
    
    // Forward cache parameter to backend
    const cacheParam = searchParams.get('cache') ?? 'true'
    
    // Call the backend's unified batch endpoint with parallel execution
    const backendUrl = `${API_BASE_URL}/api/homepage/batch?cache=${cacheParam}`
    
    console.log('[v0] Calling backend batch endpoint:', backendUrl)
    
    const backendResponse = await fetch(backendUrl, {
      next: { revalidate: 60, tags: ['homepage-batch'] },
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!backendResponse.ok) {
      console.error(`[v0] Backend batch failed: ${backendResponse.status}`)
      return getDefaultResponse(performance.now() - startTime)
    }

    const backendData: BackendBatchResponse = await backendResponse.json()
    
    // Transform backend response to frontend format
    const duration = performance.now() - startTime
    
    const response: HomepageBatchResponse = {
      flashSaleProducts: backendData.sections.flash_sales?.products ?? [],
      flashSaleEvent: null,
      trendingProducts: backendData.sections.trending?.products ?? [],
      topPicksProducts: backendData.sections.top_picks?.products ?? [],
      newArrivalsProducts: backendData.sections.new_arrivals?.products ?? [],
      dailyFindsProducts: backendData.sections.daily_finds?.products ?? [],
      luxuryDealsProducts: backendData.sections.luxury_deals?.products ?? [],
      timestamp: Date.now(),
      duration,
      cached: backendData.cached,
      backendExecutionMs: backendData.total_execution_ms,
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Response-Time': `${duration.toFixed(2)}ms`,
        'X-Backend-Execution': `${backendData.total_execution_ms}ms`,
        'X-Cache': backendData.cached ? 'HIT' : 'MISS',
      },
    })
  } catch (error) {
    console.error('[v0] Batch endpoint error:', error)
    return getDefaultResponse(performance.now() - startTime)
  }
}

function getDefaultResponse(duration: number) {
  return NextResponse.json(
    {
      flashSaleProducts: [],
      flashSaleEvent: null,
      trendingProducts: [],
      topPicksProducts: [],
      newArrivalsProducts: [],
      dailyFindsProducts: [],
      luxuryDealsProducts: [],
      timestamp: Date.now(),
      duration,
      cached: false,
      backendExecutionMs: 0,
      error: 'Failed to fetch homepage data',
    },
    { status: 500 }
  )
}
