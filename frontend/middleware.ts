import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requestHeaders = new Headers(request.headers)
  
  // Set a custom header with the pathname
  requestHeaders.set('x-pathname', pathname)
  
  // Get cookies for admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_token')?.value
    const refreshToken = request.cookies.get('admin_refresh_token')?.value
    
    if (token) {
      requestHeaders.set('x-admin-token', token)
      console.log('[v0] Middleware: admin_token cookie found')
    } else {
      console.log('[v0] Middleware: admin_token cookie NOT found')
    }
    
    if (refreshToken) {
      requestHeaders.set('x-admin-refresh-token', refreshToken)
      console.log('[v0] Middleware: admin_refresh_token cookie found')
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
