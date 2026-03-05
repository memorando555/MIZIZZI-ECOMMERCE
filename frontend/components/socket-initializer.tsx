'use client'

import { useEffect, useRef } from 'react'
import { useSocket } from '@/contexts/socket-context'

/**
 * Component that initializes WebSocket connection on first user interaction
 * Prevents blocking initial page load while ensuring real-time events work
 */
export function SocketInitializer() {
  const { connect, isConnected, isConnecting } = useSocket()
  const initializedRef = useRef(false)

  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initializedRef.current) return
    if (isConnected || isConnecting) {
      initializedRef.current = true
      return
    }

    initializedRef.current = true

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
      console.log('[v0] Timeout reached, initiating WebSocket connection...')
      connect()
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
