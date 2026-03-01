import { useCallback, useRef, useEffect, useState } from "react"
import { useSWRConfig } from "swr"
import { useAdminAuth } from "@/contexts/admin/auth-context"
import { productService } from "@/services/product"
import { websocketService } from "@/services/websocket"
import { toast } from "@/components/ui/use-toast"

interface UseOptimisticUpdateOptions {
  productId: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Custom hook for optimistic product updates
 * Updates UI immediately while syncing to server
 * Uses debouncing to batch updates and reduce API calls
 */
export function useOptimisticProductUpdate({
  productId,
  onSuccess,
  onError,
}: UseOptimisticUpdateOptions) {
  const { mutate } = useSWRConfig()
  const { getToken } = useAdminAuth()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingChangesRef = useRef<Record<string, any>>({})
  const [isSyncing, setIsSyncing] = useState(false)

  /**
   * Optimistically update local data immediately,
   * then sync to server in background
   */
  const updateProductOptimistic = useCallback(
    async (changes: Record<string, any>, section: string = "product") => {
      try {
        // 1. OPTIMISTIC UPDATE: Update UI immediately
        const cacheKey = `/api/admin/products/${productId}`
        await mutate(
          cacheKey,
          async (currentData) => {
            return { ...currentData, ...changes }
          },
          false, // Don't revalidate immediately
        )

        // 2. DEBOUNCED SYNC: Queue changes for server sync
        pendingChangesRef.current = {
          ...pendingChangesRef.current,
          ...changes,
        }

        // Clear existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        // Set new debounce timer (500ms - batch rapid changes)
        debounceTimerRef.current = setTimeout(async () => {
          await syncToServer(section)
        }, 500)
      } catch (error) {
        console.error("[v0] Optimistic update failed:", error)
        if (onError) onError(error as Error)
      }
    },
    [productId, mutate, onSuccess, onError],
  )

  /**
   * Sync pending changes to server
   */
  const syncToServer = useCallback(
    async (section: string) => {
      if (Object.keys(pendingChangesRef.current).length === 0) return

      try {
        setIsSyncing(true)
        const token = getToken()

        if (!token) {
          throw new Error("Authentication token not found")
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        const response = await fetch(`${baseUrl}/api/admin/products/${productId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(pendingChangesRef.current),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Failed to sync product: ${response.status}`)
        }

        const updatedProduct = await response.json()

        // 3. SERVER CONFIRMATION: Revalidate with server data
        const cacheKey = `/api/admin/products/${productId}`
        await mutate(cacheKey, updatedProduct, false)

        // 4. NOTIFY USERS: Broadcast update via WebSocket
        try {
          await websocketService.emit("product_updated", {
            id: productId,
            section,
            timestamp: Date.now(),
            changes: pendingChangesRef.current,
          })
        } catch (wsError) {
          console.warn("[v0] WebSocket notification failed:", wsError)
        }

        // Clear pending changes
        pendingChangesRef.current = {}

        // Call success callback
        if (onSuccess) onSuccess()

        toast({
          title: "Success",
          description: `${section} updated and synced to users`,
        })
      } catch (error) {
        console.error("[v0] Server sync failed:", error)

        // Rollback UI on server error
        const cacheKey = `/api/admin/products/${productId}`
        await mutate(cacheKey)

        if (onError) onError(error as Error)

        toast({
          title: "Sync Error",
          description: error instanceof Error ? error.message : "Failed to sync changes",
          variant: "destructive",
        })
      } finally {
        setIsSyncing(false)
      }
    },
    [productId, getToken, mutate, onSuccess, onError],
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      // Force sync any pending changes on unmount
      if (Object.keys(pendingChangesRef.current).length > 0) {
        syncToServer("product")
      }
    }
  }, [syncToServer])

  return {
    updateProductOptimistic,
    isSyncing,
    hasPendingChanges: Object.keys(pendingChangesRef.current).length > 0,
  }
}
