/**
 * Cookie-based token management for secure, server-side accessible auth
 * Replaces localStorage for better SSR compatibility and security
 */

'use client'

import type { User } from '@/types/auth'

interface TokenPayload {
  token: string
  refreshToken?: string
  expiresIn?: number
  user?: Partial<User>
}

/**
 * Set auth tokens in httpOnly cookies (secure by default)
 * Falls back to localStorage if cookies unavailable
 */
export async function setAuthTokens(payload: TokenPayload): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    // Use API route to set httpOnly cookies securely
    const response = await fetch('/api/auth/set-cookies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    })

    if (!response.ok) {
      console.warn('[Auth] Failed to set secure cookies, falling back to localStorage')
      // Fallback to localStorage
      localStorage.setItem('mizizzi_token', payload.token)
      if (payload.refreshToken) {
        localStorage.setItem('mizizzi_refresh_token', payload.refreshToken)
      }
    }
  } catch (error) {
    console.warn('[Auth] Cookie setting failed, using localStorage:', error)
    // Fallback to localStorage
    localStorage.setItem('mizizzi_token', payload.token)
    if (payload.refreshToken) {
      localStorage.setItem('mizizzi_refresh_token', payload.refreshToken)
    }
  }
}

/**
 * Get auth token from cookies or localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null

  // Try cookies first (via document.cookie)
  const cookies = document.cookie
    .split('; ')
    .find(row => row.startsWith('mizizzi_token='))
  
  if (cookies) {
    return cookies.split('=')[1]
  }

  // Fallback to localStorage
  return (
    localStorage.getItem('admin_token') ||
    localStorage.getItem('mizizzi_token') ||
    null
  )
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null

  return localStorage.getItem('mizizzi_refresh_token') || null
}

/**
 * Set auth token in localStorage (for immediate client-side access)
 * Tokens are also in httpOnly cookies for server-side access
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return

  localStorage.setItem('mizizzi_token', token)
}

/**
 * Clear all auth tokens
 */
export async function clearAuthTokens(): Promise<void> {
  if (typeof window === 'undefined') return

  // Clear server-side cookies via API
  try {
    await fetch('/api/auth/clear-cookies', {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // Silently fail, will clear localStorage below
  }

  // Clear localStorage
  localStorage.removeItem('mizizzi_token')
  localStorage.removeItem('admin_token')
  localStorage.removeItem('mizizzi_refresh_token')
  localStorage.removeItem('admin_refresh_token')
  localStorage.removeItem('mizizzi_csrf_token')
}

/**
 * Check if authenticated (client-side check)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return getAuthToken() !== null
}

/**
 * Check if admin (client-side check)
 */
export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('admin_token') !== null
}
