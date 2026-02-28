"use client"

import { useRef, useCallback, useState } from "react"

interface OptimisticUpdate<T> {
  id: string | number
  timestamp: number
  previousValue: T
  optimisticValue: T
}

/**
 * Hook for managing optimistic UI updates with automatic rollback on error
 * Updates UI immediately while saving in background, rolling back if save fails
 */
export function useOptimisticUpdates<T extends Record<string, any>>() {
  const optimisticUpdatesRef = useRef<Map<string, OptimisticUpdate<any>>>(new Map())
  const [optimisticState, setOptimisticState] = useState<T | null>(null)

  // Apply optimistic update
  const applyOptimisticUpdate = useCallback(
    (currentState: T, fieldName: string, newValue: any): T => {
      const updated = { ...currentState, [fieldName]: newValue }

      // Track for potential rollback
      optimisticUpdatesRef.current.set(fieldName, {
        id: fieldName,
        timestamp: Date.now(),
        previousValue: currentState[fieldName],
        optimisticValue: newValue,
      })

      setOptimisticState(updated)
      return updated
    },
    [],
  )

  // Confirm optimistic update (no rollback needed)
  const confirmUpdate = useCallback((fieldName: string) => {
    optimisticUpdatesRef.current.delete(fieldName)
  }, [])

  // Rollback optimistic update on error
  const rollbackUpdate = useCallback(
    (currentState: T, fieldName: string): T => {
      const update = optimisticUpdatesRef.current.get(fieldName)

      if (!update) {
        console.warn(`[v0] No optimistic update found for field: ${fieldName}`)
        return currentState
      }

      const rolled = { ...currentState, [fieldName]: update.previousValue }
      optimisticUpdatesRef.current.delete(fieldName)
      setOptimisticState(rolled)

      return rolled
    },
    [],
  )

  // Rollback all pending optimistic updates
  const rollbackAllUpdates = useCallback(
    (currentState: T): T => {
      let rolled = { ...currentState }

      optimisticUpdatesRef.current.forEach((update) => {
        rolled[update.id as string] = update.previousValue
      })

      optimisticUpdatesRef.current.clear()
      setOptimisticState(rolled)

      return rolled
    },
    [],
  )

  // Check if there are pending optimistic updates
  const hasPendingUpdates = useCallback(() => {
    return optimisticUpdatesRef.current.size > 0
  }, [])

  return {
    applyOptimisticUpdate,
    confirmUpdate,
    rollbackUpdate,
    rollbackAllUpdates,
    hasPendingUpdates,
    optimisticState,
  }
}
