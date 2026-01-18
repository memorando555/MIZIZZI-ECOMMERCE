"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface UsePullToRefreshOptions {
  threshold?: number
  resistance?: number
  onRefresh?: () => void | Promise<void>
  disabled?: boolean
}

export function usePullToRefresh({
  threshold = 80,
  resistance = 2.5,
  onRefresh,
  disabled = false,
}: UsePullToRefreshOptions = {}) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)
  const isPulling = useRef(false)
  const router = useRouter()

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true)
    
    try {
      if (onRefresh) {
        await onRefresh()
      } else {
        // Default behavior: refresh the page
        router.refresh()
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error("[v0] Pull to refresh error:", error)
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
      setIsReady(false)
    }
  }, [onRefresh, router])

  useEffect(() => {
    if (disabled) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only start if we're at the top of the page
      if (window.scrollY === 0 && !isRefreshing) {
        startY.current = e.touches[0].pageY
        isPulling.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return

      currentY.current = e.touches[0].pageY
      const distance = currentY.current - startY.current

      if (distance > 0 && window.scrollY === 0) {
        // Prevent default scroll behavior when pulling down
        e.preventDefault()
        
        // Apply resistance to make it feel natural
        const adjustedDistance = distance / resistance
        setPullDistance(adjustedDistance)
        
        // Set ready state when threshold is reached
        setIsReady(adjustedDistance >= threshold)
      }
    }

    const handleTouchEnd = () => {
      if (!isPulling.current) return

      isPulling.current = false

      if (pullDistance >= threshold && !isRefreshing) {
        triggerRefresh()
      } else {
        // Animate back to original position
        setPullDistance(0)
        setIsReady(false)
      }
    }

    // Mouse events for desktop testing
    const handleMouseDown = (e: MouseEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        startY.current = e.pageY
        isPulling.current = true
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPulling.current || isRefreshing) return

      currentY.current = e.pageY
      const distance = currentY.current - startY.current

      if (distance > 0 && window.scrollY === 0) {
        const adjustedDistance = distance / resistance
        setPullDistance(adjustedDistance)
        setIsReady(adjustedDistance >= threshold)
      }
    }

    const handleMouseUp = () => {
      if (!isPulling.current) return

      isPulling.current = false

      if (pullDistance >= threshold && !isRefreshing) {
        triggerRefresh()
      } else {
        setPullDistance(0)
        setIsReady(false)
      }
    }

    // Add touch event listeners
    document.addEventListener("touchstart", handleTouchStart, { passive: false })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)

    // Add mouse event listeners for desktop
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [disabled, isRefreshing, pullDistance, threshold, resistance, triggerRefresh])

  return {
    pullDistance,
    isRefreshing,
    isReady,
  }
}
