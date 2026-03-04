/**
 * Optimized Auth Context Provider
 * Accepts initial state from server to eliminate useEffect loading delay
 */

'use client'

import React, { createContext, useState, useEffect, useCallback, useRef, useContext, type ReactNode } from 'react'
import { authService } from '@/services/auth'
import type { User } from '@/types/auth'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { setAuthTokens, clearAuthTokens, getAuthToken, getRefreshToken } from '@/lib/cookie-auth'
import type { InitialAuthState } from './ssr-auth-provider'

interface AuthContextProps {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  tokenExpiry: number | null
  login: (credentials: { identifier: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<string | null>
  checkVerificationState: () => { needsVerification: boolean; identifier?: string; userId?: string }
  emailVerified?: boolean
  refreshAuthState: () => Promise<void>
  showPageTransition?: boolean
  handlePageTransitionComplete?: () => void
  socialLogin: (provider: 'google') => Promise<void>
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  isLoading: false, // Start false since we have initial state from SSR
  token: null,
  tokenExpiry: null,
  login: async () => {},
  logout: async () => {},
  refreshToken: async () => null,
  checkVerificationState: () => ({ needsVerification: false }),
  refreshAuthState: async () => {},
  showPageTransition: false,
  handlePageTransitionComplete: () => {},
  socialLogin: async () => {},
})

interface AuthContextProviderProps {
  children: ReactNode
  initialState?: InitialAuthState
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children, initialState }) => {
  // Initialize with server-provided state for instant hydration
  const [user, setUser] = useState<User | null>(initialState?.user as User | null || null)
  const [isAuthenticated, setIsAuthenticated] = useState(initialState?.isAuthenticated ?? false)
  const [isLoading, setIsLoading] = useState(false) // No loading since we have initial state
  const [token, setToken] = useState<string | null>(initialState?.token || null)
  const [showPageTransition, setShowPageTransition] = useState(false)
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null)
  const [refreshingToken, setRefreshingToken] = useState(false)
  const router = useRouter()
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout>()

  // Update auth state when initial state provided (from server)
  useEffect(() => {
    if (initialState?.user) {
      setUser(initialState.user as User)
      setIsAuthenticated(true)
      setToken(initialState.token)
    }
  }, [initialState])

  const handlePageTransitionComplete = useCallback(() => {
    setShowPageTransition(false)
  }, [])

  const checkVerificationState = useCallback(() => {
    try {
      if (authService.checkVerificationStateExpiry()) {
        return { needsVerification: false }
      }

      const storedState = localStorage.getItem('auth_verification_state')
      if (!storedState) return { needsVerification: false }

      const state = JSON.parse(storedState)
      if (state.identifier && state.step === 'verification') {
        return {
          needsVerification: true,
          identifier: state.identifier,
          userId: state.userId,
        }
      }

      return { needsVerification: false }
    } catch (e) {
      localStorage.removeItem('auth_verification_state')
      return { needsVerification: false }
    }
  }, [])

  const parseJwt = useCallback((token: string): { exp?: number } => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch {
      return {}
    }
  }, [])

  const scheduleTokenRefresh = useCallback(
    (token: string) => {
      const decoded = parseJwt(token)
      if (!decoded.exp) return

      const expirationTime = decoded.exp * 1000
      const currentTime = Date.now()
      const timeUntilExpiry = expirationTime - currentTime

      // Refresh token when 5 minutes remaining
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 1000)

      if (tokenRefreshTimerRef.current) {
        clearTimeout(tokenRefreshTimerRef.current)
      }

      tokenRefreshTimerRef.current = setTimeout(() => {
        void (async () => {
          await refreshToken()
        })()
      }, refreshTime)
    },
    [parseJwt]
  )

  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (refreshingToken) return null

    setRefreshingToken(true)
    try {
      const refreshTokenValue = getRefreshToken()
      if (!refreshTokenValue) {
        setIsAuthenticated(false)
        setUser(null)
        setToken(null)
        return null
      }

      const response = await authService.refreshToken(refreshTokenValue)
      if (response?.token) {
        setToken(response.token)
        await setAuthTokens({ token: response.token })
        scheduleTokenRefresh(response.token)
        return response.token
      }

      return null
    } catch (error) {
      console.error('Token refresh failed:', error)
      await logout()
      return null
    } finally {
      setRefreshingToken(false)
    }
  }, [refreshingToken, scheduleTokenRefresh])

  const login = useCallback(
    async (credentials: { identifier: string; password: string }) => {
      try {
        setShowPageTransition(true)
        const response = await authService.login(credentials)

        if (response.user) {
          const userData = {
            ...response.user,
            id: response.user.id || response.user.userId,
          }
          setUser(userData as User)
          setIsAuthenticated(true)

          if (response.token) {
            setToken(response.token)
            await setAuthTokens({
              token: response.token,
              refreshToken: response.refreshToken,
              expiresIn: response.expiresIn,
            })
            scheduleTokenRefresh(response.token)
          }

          router.push(response.redirectUrl || '/')
        }
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },
    [router, scheduleTokenRefresh]
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
      await clearAuthTokens()
      setUser(null)
      setIsAuthenticated(false)
      setToken(null)

      if (tokenRefreshTimerRef.current) {
        clearTimeout(tokenRefreshTimerRef.current)
      }

      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [router])

  const refreshAuthState = useCallback(async () => {
    try {
      const currentToken = getAuthToken()
      if (!currentToken) {
        setUser(null)
        setIsAuthenticated(false)
        return
      }

      const response = await authService.getCurrentUser()
      if (response) {
        setUser(response as User)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Auth state refresh failed:', error)
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  const socialLogin = useCallback(async (provider: 'google') => {
    try {
      setShowPageTransition(true)
      const response = await authService.socialLogin(provider)

      if (response.user) {
        setUser(response.user as User)
        setIsAuthenticated(true)

        if (response.token) {
          setToken(response.token)
          await setAuthTokens({
            token: response.token,
            refreshToken: response.refreshToken,
            expiresIn: response.expiresIn,
          })
          scheduleTokenRefresh(response.token)
        }

        router.push(response.redirectUrl || '/')
      }
    } catch (error) {
      console.error('Social login failed:', error)
      throw error
    }
  }, [router, scheduleTokenRefresh])

  // Setup token refresh on mount if we have a token
  useEffect(() => {
    if (token) {
      scheduleTokenRefresh(token)
    }

    return () => {
      if (tokenRefreshTimerRef.current) {
        clearTimeout(tokenRefreshTimerRef.current)
      }
    }
  }, [token, scheduleTokenRefresh])

  const value: AuthContextProps = {
    user,
    isAuthenticated,
    isLoading,
    token,
    tokenExpiry,
    login,
    logout,
    refreshToken,
    checkVerificationState,
    emailVerified: !!user,
    refreshAuthState,
    showPageTransition,
    handlePageTransitionComplete,
    socialLogin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthContextProvider')
  }
  return context
}
