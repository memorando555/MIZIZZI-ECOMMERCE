"use client"

import { Loader2, ArrowDown } from "lucide-react"

interface PullToRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
  isReady: boolean
  threshold?: number
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isReady,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const opacity = Math.min(pullDistance / threshold, 1)
  const scale = Math.min(0.5 + (pullDistance / threshold) * 0.5, 1)
  const rotation = isReady ? 180 : (pullDistance / threshold) * 180

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance, 100)}px)`,
        transition: pullDistance === 0 ? "transform 0.3s ease-out" : "none",
      }}
    >
      <div
        className="flex items-center justify-center bg-white rounded-full shadow-lg w-12 h-12"
        style={{
          opacity,
          transform: `scale(${scale})`,
          transition: pullDistance === 0 ? "all 0.3s ease-out" : "opacity 0.2s, transform 0.2s",
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-6 h-6 text-[#8B1538] animate-spin" />
        ) : (
          <ArrowDown
            className="w-6 h-6 text-[#8B1538]"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: "transform 0.2s ease-out",
            }}
          />
        )}
      </div>
      
      {/* Message text */}
      <div
        className="absolute top-16 text-sm font-medium text-gray-700"
        style={{
          opacity,
          transition: "opacity 0.2s",
        }}
      >
        {isRefreshing ? "Refreshing..." : isReady ? "Release to refresh" : "Pull to refresh"}
      </div>
    </div>
  )
}
