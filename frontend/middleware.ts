import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Edge Middleware: Executes at Vercel edge before server components render
 * Provides ultra-fast auth checks and redirects (~50-100ms at edge vs 1-2s on client)
 * 
 * This is the fastest possible auth check - happens before ANY server processing
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requestHeaders = new Headers(request.headers)
  
  // Extract auth token from HTTP-only cookie (set by server auth actions)
  const token = request.cookies.get('mizizzi_token')?.value
  const isAuthenticated = !!token
  
  // Set custom headers for downstream use in server components and API routes
  requestHeaders.set('x-pathname', pathname)
  requestHeaders.set('x-authenticated', isAuthenticated.toString())
  requestHeaders.set('x-has-token', isAuthenticated.toString())
  
  // Route categorization for auth checks
  const isAuthPage = pathname.startsWith('/auth')
  const protectedPaths = ['/profile', '/account', '/wishlist', '/orders', '/checkout', '/admin', '/dashboard']
  const isProtectedPage = protectedPaths.some(path => pathname.startsWith(path))
  
  console.log("[v0] Middleware: Processing", pathname, "| Authenticated:", isAuthenticated)

  // EDGE-LEVEL REDIRECTS: These execute at Vercel edge for ultra-fast performance
  
  // 1. Authenticated user accessing auth page → redirect to home (fast path out of auth)
  if (isAuthenticated && isAuthPage) {
    console.log("[v0] Middleware: Authenticated user on auth page, redirecting to /")
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 2. Unauthenticated user accessing protected page → redirect to login
  if (!isAuthenticated && isProtectedPage) {
    console.log("[v0] Middleware: Unauthenticated access to protected page, redirecting to /auth/login")
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 3. Continue to next middleware/route handler with auth status in headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Cache optimization: Don't cache auth pages to prevent showing wrong user content
  if (isAuthPage && !isAuthenticated) {
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
  } else if (isAuthPage && isAuthenticated) {
    // Cache successful redirects
    response.headers.set('Cache-Control', 'public, max-age=3600')
  }

  return response
}

/**
 * Configure which paths trigger middleware
 * Executes at edge for maximum performance on every request
 */
export const config = {
  matcher: [
    // Match all routes except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.webp).*)',
  ],
}

