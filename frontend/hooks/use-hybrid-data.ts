"use client"

import { useEffect, useRef } from "react"
import type { SWRConfiguration } from "swr"

/**
 * Hook to manage the transition from SSR data to SWR data
 * Ensures smooth handoff from server-rendered data to client-side revalidation
 */
export function useHybridData<T>(
  swrData: T | undefined,
  isLoading: boolean,
  initialData?: T,
  onTransition?: () => void
) {
  const hasTransitioned = useRef(false)

  // Track when we move from SSR data to SWR data
  useEffect(() => {
    if (swrData && initialData && !hasTransitioned.current && !isLoading) {
      hasTransitioned.current = true
      console.log("[v0] Hybrid data transition complete")
      onTransition?.()
    }
  }, [swrData, initialData, isLoading, onTransition])

  // Return the best available data
  return swrData || initialData
}

/**
 * Creates SWR config for hybrid rendering with SSR fallback data
 */
export function createHybridSWRConfig<T>(
  initialData?: T,
  customConfig?: SWRConfiguration
): SWRConfiguration {
  return {
    fallbackData: initialData,
    revalidateIfStale: true,
    revalidateOnFocus: false,
    ...customConfig,
  }
}
