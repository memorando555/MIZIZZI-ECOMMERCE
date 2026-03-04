import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requestHeaders = new Headers(request.headers)
  
  // Set a custom header with the pathname
  requestHeaders.set('x-pathname', pathname)
  
  // Optimization: Check auth tokens before rendering auth pages
  const token = request.cookies.get('mizizzi_token')?.value
  const isAuthPage = pathname.startsWith('/auth')
  
  // If user is authenticated and tries to access auth pages, redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
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
