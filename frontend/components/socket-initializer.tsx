'use client'

import { useEffect } from 'react'
import { useSocket } from '@/contexts/socket-context'

/**
 * Component that initializes WebSocket connection on first user interaction
 * Prevents blocking initial page load while ensuring real-time events work
 */
export function SocketInitializer() {
  const { connect, isConnected, isConnecting } = useSocket()

  useEffect(() => {
    // Only initialize if not already connecting or connected
    if (isConnected || isConnecting) return

    // Set up handlers for user interaction
    const handleUserInteraction = () => {
      console.log('[v0] User interaction detected, connecting WebSocket...')
      connect()
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('scroll', handleUserInteraction)
    }

    // Also try connecting after a short delay (2 seconds)
    const timer = setTimeout(() => {
      if (!isConnected && !isConnecting) {
        console.log('[v0] Timeout reached, initiating WebSocket connection...')
        connect()
      }
    }, 2000)

    // Listen for user interactions
    document.addEventListener('click', handleUserInteraction, { once: true })
    document.addEventListener('scroll', handleUserInteraction, { once: true })

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('scroll', handleUserInteraction)
    }
  }, [connect, isConnected, isConnecting])

  return null
}
