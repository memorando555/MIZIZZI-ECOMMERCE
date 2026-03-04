import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })

    // Clear all auth cookies
    response.cookies.set({
      name: 'mizizzi_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    response.cookies.set({
      name: 'mizizzi_refresh_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    response.cookies.set({
      name: 'admin_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Auth API] Error clearing cookies:', error)
    return NextResponse.json({ error: 'Failed to clear cookies' }, { status: 500 })
  }
}
