"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface PullToRefreshOptions {
  threshold?: number
  resistance?: number
  onRefresh?: () => void
}

export function usePullToRefresh({
  threshold = 70,
  resistance = 2.5,
  onRefresh,
}: PullToRefreshOptions = {}) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)
  const isPulling = useRef(false)
  const canPull = useRef(false)

  const triggerRefresh = useCallback(() => {
    console.log("[v0] Pull-to-refresh: Triggering browser refresh")
    setIsRefreshing(true)
    setPullDistance(0)
    
    // Trigger browser's native refresh after brief visual feedback
    setTimeout(() => {
      window.location.reload()
    }, 150)
  }, [])

  useEffect(() => {
    // Only enable on touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    console.log("[v0] Pull-to-refresh: Touch device detected:", isTouchDevice)
    
    if (!isTouchDevice) return

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return
      
      console.log("[v0] Pull-to-refresh: Touch start")
      
      // Check if we're at the top
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      console.log("[v0] Pull-to-refresh: Current scroll position:", scrollTop)
      
      // Only allow pull at the very top
      if (scrollTop <= 0) {
        canPull.current = true
        startY.current = e.touches[0].clientY
        console.log("[v0] Pull-to-refresh: Can pull, startY:", startY.current)
      } else {
        canPull.current = false
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull.current || isRefreshing) return

      currentY.current = e.touches[0].clientY
      const diff = currentY.current - startY.current

      // Only track if pulling down
      if (diff > 0) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        
        // Ensure we're still at the top
        if (scrollTop <= 0) {
          isPulling.current = true
          
          // Prevent bounce effect on iOS and default pull behavior
          e.preventDefault()
          
          // Apply resistance (mimics Jumia's feel)
          const distance = Math.pow(diff, 0.85) / resistance
          const maxDistance = threshold * 1.2
          const newDistance = Math.min(distance, maxDistance)
          
          console.log("[v0] Pull-to-refresh: Pulling, distance:", newDistance)
          setPullDistance(newDistance)
        }
      } else {
        if (isPulling.current) {
          console.log("[v0] Pull-to-refresh: Pull cancelled (scrolling up)")
        }
        isPulling.current = false
        setPullDistance(0)
      }
    }

    const handleTouchEnd = () => {
      if (!isPulling.current || isRefreshing) {
        isPulling.current = false
        canPull.current = false
        setPullDistance(0)
        return
      }

      console.log("[v0] Pull-to-refresh: Touch end, pullDistance:", pullDistance, "threshold:", threshold)

      isPulling.current = false
      canPull.current = false

      // Trigger refresh if pulled past threshold
      if (pullDistance >= threshold) {
        console.log("[v0] Pull-to-refresh: Threshold reached, triggering refresh")
        triggerRefresh()
      } else {
        console.log("[v0] Pull-to-refresh: Snapping back (distance too small)")
        // Snap back smoothly
        setPullDistance(0)
      }
    }

    // Add listeners - touchmove needs passive: false to call preventDefault
    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })
    document.addEventListener("touchcancel", handleTouchEnd, { passive: true })

    console.log("[v0] Pull-to-refresh: Event listeners attached")

    return () => {
      console.log("[v0] Pull-to-refresh: Cleaning up event listeners")
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
      document.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [pullDistance, threshold, resistance, isRefreshing, triggerRefresh])

  return { pullDistance, isRefreshing }
}
