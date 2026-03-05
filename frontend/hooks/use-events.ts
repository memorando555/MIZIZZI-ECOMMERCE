'use client'

import { useEffect, useCallback, useRef } from 'react'

interface EventListener {
  event: string
  callback: (data: any) => void
}

/**
 * Hook for managing WebSocket and real-time events
 * Provides a simple interface for subscribing to server events
 */
export function useEvents() {
  const listenersRef = useRef<EventListener[]>([])
  const socketRef = useRef<any>(null)

  // Initialize WebSocket connection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET !== 'false'
    if (!isEnabled) {
      console.log('[v0] WebSocket events disabled')
      return
    }

    let socket: any = null
    let isMounted = true

    try {
      // Attempt to connect to WebSocket
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://mizizzi-ecommerce-1.onrender.com'
      
      // Try socket.io client if available
      try {
        const socketIO = require('socket.io-client')
        const { io } = socketIO
        
        if (io && isMounted) {
          socket = io(wsUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
          })

          socket.on('connect', () => {
            console.log('[v0] WebSocket connected for events')
            if (isMounted) {
              socketRef.current = socket
              
              // Re-register all listeners
              listenersRef.current.forEach(({ event, callback }) => {
                socket.on(event, callback)
              })
            }
          })

          socket.on('disconnect', () => {
            console.log('[v0] WebSocket disconnected')
            if (isMounted) {
              socketRef.current = null
            }
          })

          socket.on('error', (error: any) => {
            console.warn('[v0] WebSocket error:', error)
          })
        }
      } catch (ioError) {
        console.warn('[v0] Socket.io not available, attempting raw WebSocket connection', ioError)
        // Fallback to raw WebSocket
        socket = new WebSocket(wsUrl)
        socket.onopen = () => {
          console.log('[v0] Raw WebSocket connected')
          if (isMounted) {
            socketRef.current = socket
          }
        }
        socket.onerror = (error: any) => {
          console.warn('[v0] Raw WebSocket error:', error)
        }
        socket.onclose = () => {
          console.log('[v0] Raw WebSocket disconnected')
          if (isMounted) {
            socketRef.current = null
          }
        }
      }
    } catch (error) {
      console.warn('[v0] WebSocket initialization error:', error)
    }

    return () => {
      isMounted = false
      if (socket) {
        try {
          if (socket.disconnect) {
            socket.disconnect()
          } else if (socket.close) {
            socket.close()
          }
        } catch (e) {
          console.warn('[v0] Error closing socket:', e)
        }
        socketRef.current = null
      }
    }
  }, [])

  // Subscribe to an event
  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    // Add to listeners list
    listenersRef.current.push({ event, callback })

    // If socket is connected, register immediately
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }

    // Return unsubscribe function
    return () => {
      listenersRef.current = listenersRef.current.filter(
        (listener) => !(listener.event === event && listener.callback === callback)
      )
      if (socketRef.current) {
        socketRef.current.off(event, callback)
      }
    }
  }, [])

  // Emit an event
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn(`[v0] Cannot emit event "${event}": WebSocket not connected`)
    }
  }, [])

  // Check if connected
  const isConnected = useCallback(() => {
    return socketRef.current?.connected ?? false
  }, [])

  return {
    subscribe,
    emit,
    isConnected,
  }
}
