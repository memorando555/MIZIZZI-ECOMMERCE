import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware runs at the Edge (Vercel servers) before reaching the app
 * This provides ultra-fast auth checks and redirects without client latency
 * 
 * Performance: ~50-100ms at edge vs 1-2s on client
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requestHeaders = new Headers(request.headers)
  
  // Set custom headers for downstream use
  requestHeaders.set('x-pathname', pathname)
  
  // Get auth token from HTTP-only cookie
  const token = request.cookies.get('mizizzi_token')?.value
  const isAuthenticated = !!token
  
  // Check if this is an auth page
  const isAuthPage = pathname.startsWith('/auth')
  
  // Check if this is a protected page (requires authentication)
  const protectedPaths = ['/profile', '/account', '/wishlist', '/orders', '/admin']
  const isProtectedPage = protectedPaths.some(path => pathname.startsWith(path))
  
  // Pass auth status to downstream components via headers
  requestHeaders.set('x-authenticated', isAuthenticated.toString())
  requestHeaders.set('x-has-token', isAuthenticated.toString())

  // REDIRECT LOGIC: Edge-level redirects execute at Vercel edge
  // These are the fastest possible redirects (~50ms vs 1-2s client-side)

  // 1. If authenticated and on auth page, redirect to home (fast path out of auth flow)
  if (isAuthenticated && isAuthPage) {
    console.log("[v0] Middleware: Authenticated user on auth page, redirecting to home")
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 2. If not authenticated and on protected page, redirect to login
  if (!isAuthenticated && isProtectedPage) {
    console.log("[v0] Middleware: Unauthenticated access to protected page, redirecting to login")
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 3. Continue to next middleware/route handler with auth status in headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Set Cache-Control headers based on auth status
  if (isAuthPage && !isAuthenticated) {
    // Don't cache auth pages to prevent showing cached content to wrong user
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
  } else if (isAuthPage && isAuthenticated) {
    // Cache redirect response for authenticated users accessing auth page
    response.headers.set('Cache-Control', 'public, max-age=3600')
  }

  return response
}

/**
 * Configure which paths trigger middleware
 * Edge execution for maximum performance
 */
export const config = {
  matcher: [
    // Run on all routes except Next.js internals and assets
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}

