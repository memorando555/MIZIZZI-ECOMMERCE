/**
 * Server-side authentication session validation
 * Fast JWT validation without API calls for SSR rendering
 */

import { cookies } from 'next/headers'
import type { User } from '@/types/auth'

interface DecodedToken {
  userId?: string
  id?: string
  email?: string
  role?: string
  username?: string
  exp?: number
}

/**
 * Decode JWT token without verification (for client-side tokens we trust from cookies)
 */
function decodeJWT(token: string): DecodedToken | null {
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
  
  // Consider expired if less than 1 minute remaining
  return expirationTime - currentTime < 60000
}

/**
 * Get user session from cookies without API call (fast path)
 * Returns user data immediately available from JWT
 */
export async function getServerAuthSession(): Promise<{
  user: Partial<User> | null
  token: string | null
  isAuthenticated: boolean
}> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('mizizzi_token')?.value || 
                  cookieStore.get('admin_token')?.value

    if (!token) {
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      }
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      }
    }

    // Decode token to get user info
    const decoded = decodeJWT(token)
    if (!decoded) {
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      }
    }

    // Construct user object from JWT claims
    const user: Partial<User> = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
      username: decoded.username,
    }

    return {
      user,
      token,
      isAuthenticated: true,
    }
  } catch (error) {
    console.error('[Auth Session] Error reading session:', error)
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    }
  }
}

/**
 * Get auth headers for API requests (includes token if available)
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('mizizzi_token')?.value || 
                  cookieStore.get('admin_token')?.value

    if (!token || isTokenExpired(token)) {
      return {}
    }

    return {
      'Authorization': `Bearer ${token}`,
    }
  } catch {
    return {}
  }
}

/**
 * Check if user has admin role from session
 */
export async function isAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token || isTokenExpired(token)) {
      return false
    }

    const decoded = decodeJWT(token)
    return decoded?.role === 'admin'
  } catch {
    return false
  }
}
