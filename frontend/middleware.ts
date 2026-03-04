import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Decode JWT token to extract claims (fast, no verification needed)
 */
function decodeJWT(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return decoded
  } catch {
    return null
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token)
  if (!decoded?.exp) return true
  
  const expirationTime = decoded.exp * 1000
  const currentTime = Date.now()
  return expirationTime - currentTime < 60000 // Less than 1 minute left
}

/**
 * Check if path requires authentication
 */
function isProtectedPath(pathname: string): boolean {
  const protectedPaths = [
    '/admin',
    '/profile',
    '/orders',
    '/cart',
    '/checkout',
  ]
  return protectedPaths.some(path => pathname.startsWith(path))
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requestHeaders = new Headers(request.headers)
  
  // Set pathname header for debugging/tracking
  requestHeaders.set('x-pathname', pathname)
  
  // Extract tokens from cookies
  const userToken = request.cookies.get('mizizzi_token')?.value
  const adminToken = request.cookies.get('admin_token')?.value
  const token = adminToken || userToken
  
  // Fast-path: decode token and add user info to headers if valid
  if (token && !isTokenExpired(token)) {
    const decoded = decodeJWT(token)
    if (decoded) {
      requestHeaders.set('x-user-id', decoded.userId || decoded.id || '')
      requestHeaders.set('x-user-email', decoded.email || '')
      requestHeaders.set('x-user-role', decoded.role || 'user')
      requestHeaders.set('x-auth-token', token)
      requestHeaders.set('x-is-authenticated', 'true')
    }
  }
  
  // Check protected paths - redirect to login if not authenticated
  if (isProtectedPath(pathname) && !token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Check admin paths - require admin role
  if (pathname.startsWith('/admin') && token) {
    const decoded = decodeJWT(token)
    if (!decoded?.role?.includes('admin')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Run middleware on all routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',
            '/admin/:path*',
            '/profile/:path*',
            '/orders/:path*',
  ],
}
