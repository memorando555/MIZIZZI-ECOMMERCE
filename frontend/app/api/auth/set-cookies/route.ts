import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token, refreshToken, expiresIn } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true })

    // Set secure, httpOnly cookies
    const maxAge = expiresIn ? expiresIn * 1000 : 7 * 24 * 60 * 60 * 1000 // 7 days default

    response.cookies.set({
      name: 'mizizzi_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge / 1000, // Convert to seconds
      path: '/',
    })

    if (refreshToken) {
      response.cookies.set({
        name: 'mizizzi_refresh_token',
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('[Auth API] Error setting cookies:', error)
    return NextResponse.json({ error: 'Failed to set cookies' }, { status: 500 })
  }
}
