"use client"

import { useEffect, useState, useRef } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Server, Loader2, ServerCrash } from "lucide-react"

interface NetworkStatusProps {
  className?: string
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const [isOffline, setIsOffline] = useState(false)
  const [backendDown, setBackendDown] = useState(false)
  const [isBackendWakingUp, setIsBackendWakingUp] = useState(false)
  const [hasServerError, setHasServerError] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [lastErrorTime, setLastErrorTime] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [warmupMessage, setWarmupMessage] = useState("")

  const onlineDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const offlineDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const errorDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const ERROR_COOLDOWN = 10000 // 10 seconds between error alerts
  const MAX_RETRIES = 3 // Maximum retry attempts before giving up
  const OFFLINE_DEBOUNCE = 3000 // 3 seconds before showing offline alert
  const ONLINE_DEBOUNCE = 1000 // 1 second before clearing offline alert
  const ERROR_DEBOUNCE = 2000 // 2 seconds before showing error alert

  useEffect(() => {
    console.log("[v0] NetworkStatus: Component mounted")

    const handleOnline = () => {
      console.log("[v0] NetworkStatus: Network online event detected")

      // Clear any pending offline debounce
      if (offlineDebounceRef.current) {
        clearTimeout(offlineDebounceRef.current)
        offlineDebounceRef.current = null
      }

      // Debounce the online state change
      if (onlineDebounceRef.current) {
        clearTimeout(onlineDebounceRef.current)
      }

      onlineDebounceRef.current = setTimeout(() => {
        console.log("[v0] NetworkStatus: Network came online (debounced)")
        setIsOffline(false)
        setShowAlert(false)
        setRetryCount(0)
      }, ONLINE_DEBOUNCE)
    }

    const handleOffline = () => {
      console.log("[v0] NetworkStatus: Network offline event detected")

      // Clear any pending online debounce
      if (onlineDebounceRef.current) {
        clearTimeout(onlineDebounceRef.current)
        onlineDebounceRef.current = null
      }

      // Debounce the offline state change
      if (offlineDebounceRef.current) {
        clearTimeout(offlineDebounceRef.current)
      }

      offlineDebounceRef.current = setTimeout(() => {
        console.log("[v0] NetworkStatus: Network went offline (debounced)")
        setIsOffline(true)
        setShowAlert(true)
      }, OFFLINE_DEBOUNCE)
    }

    const handleNetworkError = (event: CustomEvent) => {
      const now = Date.now()
      console.log("[v0] NetworkStatus: Network error detected:", event.detail)

      // Check cooldown period
      if (now - lastErrorTime < ERROR_COOLDOWN) {
        console.log("[v0] NetworkStatus: Error ignored due to cooldown")
        return
      }

      // Check max retries
      if (retryCount >= MAX_RETRIES) {
        console.log("[v0] NetworkStatus: Max retries exceeded, not showing alert")
        return
      }

      // Debounce error alerts
      if (errorDebounceRef.current) {
        clearTimeout(errorDebounceRef.current)
      }

      errorDebounceRef.current = setTimeout(() => {
        if (event.detail.isNetworkError) {
          setBackendDown(true)
          setShowAlert(true)
          setLastErrorTime(now)
          console.log("[v0] NetworkStatus: Showing backend down alert (debounced)")
        }
      }, ERROR_DEBOUNCE)
    }

    const handleApiSuccess = () => {
      console.log("[v0] NetworkStatus: API success detected")

      // Clear any pending error debounce
      if (errorDebounceRef.current) {
        clearTimeout(errorDebounceRef.current)
        errorDebounceRef.current = null
      }

      setBackendDown(false)
      setIsBackendWakingUp(false)
      setHasServerError(false)
      setShowAlert(false)
      setRetryCount(0)
      setWarmupMessage("")
    }

    const handleBackendStatusChange = (event: CustomEvent) => {
      const { status, message } = event.detail
      console.log("[v0] NetworkStatus: Backend status change:", status, message)

      if (status === "waking-up") {
        setIsBackendWakingUp(true)
        setBackendDown(false)
        setHasServerError(false)
        setShowAlert(true)
        setWarmupMessage(message || "Backend server is waking up...")
      } else if (status === "available") {
        setIsBackendWakingUp(false)
        setBackendDown(false)
        setHasServerError(false)
        setShowAlert(false)
        setWarmupMessage("")
      } else if (status === "unavailable") {
        setIsBackendWakingUp(false)
        setBackendDown(true)
        setHasServerError(false)
        setShowAlert(true)
        setWarmupMessage("")
      } else if (status === "server-error") {
        setIsBackendWakingUp(false)
        setBackendDown(false)
        setHasServerError(true)
        setShowAlert(true)
        setWarmupMessage(message || "The server is experiencing internal errors.")
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    document.addEventListener("network-error", handleNetworkError as EventListener)
    document.addEventListener("api-success", handleApiSuccess)
    document.addEventListener("backend-status-change", handleBackendStatusChange as EventListener)

    // Check initial network status
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      document.removeEventListener("network-error", handleNetworkError as EventListener)
      document.removeEventListener("api-success", handleApiSuccess)
      document.removeEventListener("backend-status-change", handleBackendStatusChange as EventListener)

      if (onlineDebounceRef.current) clearTimeout(onlineDebounceRef.current)
      if (offlineDebounceRef.current) clearTimeout(offlineDebounceRef.current)
      if (errorDebounceRef.current) clearTimeout(errorDebounceRef.current)
    }
  }, [lastErrorTime, retryCount])

  const handleRetry = async () => {
    if (isRetrying) return

    console.log("[v0] NetworkStatus: Retry button clicked")
    setIsRetrying(true)
    setRetryCount((prev) => prev + 1)

    try {
      // Simple health check to determine backend availability.
      // Adjust endpoint as needed (e.g. /api/health or another lightweight endpoint).
      const res = await fetch("/api/health", { cache: "no-store" })

      if (res.ok) {
        // Backend reachable — clear error state and reload to refresh data
        setBackendDown(false)
        setIsBackendWakingUp(false)
        setHasServerError(false)
        setShowAlert(false)
        setRetryCount(0)
        setWarmupMessage("")

        document.dispatchEvent(new CustomEvent("api-success"))
        window.location.reload()
      } else {
        throw new Error("Backend still unavailable")
      }
    } catch (error) {
      console.log("[v0] NetworkStatus: Retry failed:", error)

      if (retryCount >= MAX_RETRIES) {
        setShowAlert(false)
      }
    } finally {
      setIsRetrying(false)
    }
  }

  if (!showAlert) return null

  return (
    <div className={className}>
      {isOffline && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You are currently offline. Please check your internet connection.</span>
            <Button variant="outline" size="sm" onClick={handleRetry} disabled={isRetrying}>
              <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Checking..." : "Check Connection"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isBackendWakingUp && !isOffline && (
        <Alert className="mb-4 border-amber-500 bg-amber-50 text-amber-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">Backend server is starting up</p>
              <p className="text-sm text-amber-600 mt-1">
                {warmupMessage || "Free tier servers may take 30-60 seconds to wake up. Please wait..."}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {hasServerError && !isOffline && !isBackendWakingUp && (
        <Alert className="mb-4 border-orange-500 bg-orange-50 text-orange-800">
          <ServerCrash className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">Server experiencing issues</p>
              <p className="text-sm text-orange-600 mt-1">
                {warmupMessage ||
                  "The backend is having internal errors (possibly database connection issues). This is usually temporary."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="border-orange-500 text-orange-700 hover:bg-orange-100 bg-transparent"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Checking..." : `Retry (${retryCount}/${MAX_RETRIES})`}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {backendDown && !isOffline && !isBackendWakingUp && !hasServerError && (
        <Alert variant="destructive" className="mb-4">
          <Server className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">Backend server is not available</p>
              <p className="text-sm text-muted-foreground mt-1">
                {retryCount >= MAX_RETRIES
                  ? "Multiple retry attempts failed. Please refresh the page manually or contact support."
                  : "The server is not responding. Please try again."}
              </p>
            </div>
            {retryCount < MAX_RETRIES && (
              <Button variant="outline" size="sm" onClick={handleRetry} disabled={isRetrying}>
                <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? "animate-spin" : ""}`} />
                {isRetrying ? "Checking..." : `Retry (${retryCount}/${MAX_RETRIES})`}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
