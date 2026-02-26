/*
  Cache Invalidation Webhook Endpoint
  Triggered by backend when admin updates carousel
  Uses Next.js revalidateTag to instantly update ISR cache
*/

import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import type { NextApiRequest, NextApiResponse } from "next"

// Webhook secret from environment
const WEBHOOK_SECRET = process.env.CAROUSEL_WEBHOOK_SECRET || "your-secret-key"

/**
 * POST /api/webhooks/carousel-invalidate
 * Triggered by backend when carousel is updated
 * Invalidates ISR cache tags to refresh content instantly
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { position = "homepage", action = "update", secret } = body

    // Verify webhook secret
    if (secret !== WEBHOOK_SECRET) {
      console.error("[v0] Invalid webhook secret received")
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log(`[v0] Webhook triggered: ${action} for carousel at ${position}`)

    // Invalidate relevant cache tags based on position and action
    const tagsToInvalidate = [
      "carousel-items",
      "carousel-items-optimized",
      "feature-cards",
      "premium-experiences",
      "contact-cta",
      "product-showcase"
    ]

    // Position-specific invalidation
    if (position === "homepage") {
      tagsToInvalidate.push("homepage-carousel")
    } else if (position.includes("category")) {
      tagsToInvalidate.push("category-carousel")
    } else if (position.includes("flash")) {
      tagsToInvalidate.push("flash-sale-carousel")
    }

    // Revalidate all affected tags
    for (const tag of tagsToInvalidate) {
      revalidateTag(tag)
      console.log(`[v0] Revalidated tag: ${tag}`)
    }

    // Revalidate the homepage and relevant pages
    const pagesToRevalidate = ["/", "/categories", "/flash-sales", "/luxury"]

    return NextResponse.json({
      success: true,
      message: `Cache invalidated for ${position} carousel`,
      action,
      invalidated_tags: tagsToInvalidate,
      revalidated_at: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/carousel-invalidate
 * Health check and documentation
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "carousel-cache-invalidation",
    description: "Webhook endpoint for backend to trigger frontend cache invalidation",
    expects: {
      method: "POST",
      body: {
        position: "homepage | category_page | flash_sales | luxury_deals",
        action: "create | update | delete",
        secret: "CAROUSEL_WEBHOOK_SECRET environment variable"
      }
    },
    endpoints: [
      "POST /api/webhooks/carousel-invalidate - Invalidate carousel cache",
      "GET /api/webhooks/carousel-invalidate - Health check"
    ]
  })
}
