"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { debounce } from "@/lib/utils"

interface PendingChange {
  field: string
  value: any
  timestamp: number
}

interface AutoSaveConfig {
  debounceMs?: number
  onSave: (changes: Record<string, any>) => Promise<void>
  onError?: (error: Error) => void
  onSavingStart?: () => void
  onSavingEnd?: () => void
  enableOfflineQueue?: boolean
}

/**
 * Hook for managing real-time auto-save with optimistic updates
 * Tracks field changes, debounces saves, and maintains an offline queue
 */
export function useRealtimeAutoSave(config: AutoSaveConfig) {
  const {
    debounceMs = 400,
    onSave,
    onError,
    onSavingStart,
    onSavingEnd,
    enableOfflineQueue = true,
  } = config

  // Track pending changes
  const pendingChangesRef = useRef<Map<string, PendingChange>>(new Map())
  const offlineQueueRef = useRef<Array<Record<string, any>>>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveQueue, setSaveQueue] = useState(0)
  const isOnlineRef = useRef(true)

  // Debounced save function
  const performSave = useCallback(
    debounce(async () => {
      if (pendingChangesRef.current.size === 0) {
        return
      }

      const changesToSave = Object.fromEntries(pendingChangesRef.current)

      if (!isOnlineRef.current) {
        // Queue for later if offline
        if (enableOfflineQueue) {
          offlineQueueRef.current.push(changesToSave)
          setSaveQueue(offlineQueueRef.current.length)
          console.log("[v0] Changes queued for offline sync:", changesToSave)
        }
        return
      }

      try {
        setIsSaving(true)
        onSavingStart?.()

        await onSave(changesToSave)

        // Clear saved changes
        pendingChangesRef.current.clear()
        setSaveQueue(0)
      } catch (error) {
        console.error("[v0] Auto-save failed:", error)
        onError?.(error as Error)
      } finally {
        setIsSaving(false)
        onSavingEnd?.()
      }
    }, debounceMs),
    [debounceMs, onSave, onError, onSavingStart, onSavingEnd, enableOfflineQueue],
  )

  // Handle field change
  const trackFieldChange = useCallback(
    (field: string, value: any) => {
      pendingChangesRef.current.set(field, {
        field,
        value,
        timestamp: Date.now(),
      })
      setSaveQueue(pendingChangesRef.current.size)
      performSave()
    },
    [performSave],
  )

  // Process offline queue when online
  const flushOfflineQueue = useCallback(async () => {
    if (!enableOfflineQueue || offlineQueueRef.current.length === 0) {
      return
    }

    console.log("[v0] Flushing offline queue, items:", offlineQueueRef.current.length)

    const queue = [...offlineQueueRef.current]
    offlineQueueRef.current = []

    for (const changes of queue) {
      try {
        await onSave(changes)
      } catch (error) {
        console.error("[v0] Failed to sync queued changes:", error)
        offlineQueueRef.current.push(changes) // Re-queue if fails
        break
      }
    }

    setSaveQueue(offlineQueueRef.current.length)
  }, [enableOfflineQueue, onSave])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log("[v0] Network reconnected")
      isOnlineRef.current = true
      flushOfflineQueue()
    }

    const handleOffline = () => {
      console.log("[v0] Network disconnected")
      isOnlineRef.current = false
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    isOnlineRef.current = navigator.onLine

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [flushOfflineQueue])

  return {
    trackFieldChange,
    isSaving,
    saveQueue,
    isPending: saveQueue > 0,
    flushOfflineQueue,
    clearPendingChanges: () => {
      pendingChangesRef.current.clear()
      setSaveQueue(0)
    },
  }
}
