/**
 * SSR Auth Provider - Passes pre-fetched auth state as props
 * Eliminates useEffect initialization delay for faster perceived performance
 */

import React from 'react'
import { getServerAuthSession } from '@/lib/server/auth-session'
import { AuthContextProvider } from './auth-context-provider'
import type { User } from '@/types/auth'

interface SSRAuthProviderProps {
  children: React.ReactNode
}

export interface InitialAuthState {
  user: Partial<User> | null
  token: string | null
  isAuthenticated: boolean
}

/**
 * Server component that fetches auth state and passes to client provider
 */
export async function SSRAuthProvider({ children }: SSRAuthProviderProps) {
  // Fetch auth state on server (from cookies, no API calls needed)
  const authState = await getServerAuthSession()

  return (
    <AuthContextProvider initialState={authState}>
      {children}
    </AuthContextProvider>
  )
}
