// Backend warmup service for Render free tier
// Render free tier services spin down after inactivity and need ~30-60s to wake up

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

interface WarmupState {
  isWakingUp: boolean
  isAvailable: boolean
  hasServerError: boolean
  lastCheckTime: number
  retryCount: number
  warmupPromise: Promise<boolean> | null
}

const state: WarmupState = {
  isWakingUp: false,
  isAvailable: false,
  hasServerError: false,
  lastCheckTime: 0,
  retryCount: 0,
  warmupPromise: null,
}

const MAX_RETRIES = 5
const RETRY_DELAY = 5000 // 5 seconds between retries
const WARMUP_TIMEOUT = 60000 // 60 seconds max warmup time
const CACHE_DURATION = 30000 // Cache availability status for 30 seconds
const SERVER_ERROR_CACHE_DURATION = 60000 // 60 seconds

// Health check endpoints to try (in order of preference)
const HEALTH_ENDPOINTS = [
  "/api/health",
  "/api/health-check",
  "/health",
  "/api/categories", // Fallback - categories endpoint usually responds
]

/**
 * Dispatch a custom event to notify the UI about backend status changes
 */
function dispatchBackendStatusEvent(
  status: "waking-up" | "available" | "unavailable" | "server-error",
  message?: string,
) {
  if (typeof document !== "undefined") {
    document.dispatchEvent(
      new CustomEvent("backend-status-change", {
        detail: { status, message, timestamp: Date.now() },
      }),
    )
  }
}

/**
 * Check if the backend is available by hitting a health endpoint
 * Returns: { isAwake: boolean, hasServerError: boolean }
 */
async function checkBackendHealth(timeout = 10000): Promise<{ isAwake: boolean; hasServerError: boolean }> {
  for (const endpoint of HEALTH_ENDPOINTS) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 500 || response.status === 502 || response.status === 503) {
        console.log(`[v0] Backend returned ${response.status} - server is awake but has internal errors`)
        return { isAwake: true, hasServerError: true }
      }

      if (response.ok || response.status === 401 || response.status === 403 || response.status === 404) {
        // Server is responding (even 401/403/404 means it's awake and healthy)
        console.log(`[v0] Backend health check passed via ${endpoint}`)
        return { isAwake: true, hasServerError: false }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log(`[v0] Backend health check timed out for ${endpoint}`)
      } else {
        console.log(`[v0] Backend health check failed for ${endpoint}:`, error.message)
      }
      // Try next endpoint
      continue
    }
  }
  return { isAwake: false, hasServerError: false }
}

/**
 * Wait for a specified duration
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Attempt to wake up the backend with retries
 */
async function performWarmup(): Promise<boolean> {
  console.log("[v0] Starting backend warmup process...")
  dispatchBackendStatusEvent("waking-up", "Backend server is waking up. This may take up to 60 seconds...")

  const startTime = Date.now()

  while (state.retryCount < MAX_RETRIES && Date.now() - startTime < WARMUP_TIMEOUT) {
    console.log(`[v0] Warmup attempt ${state.retryCount + 1}/${MAX_RETRIES}`)

    const { isAwake, hasServerError } = await checkBackendHealth()

    if (isAwake && hasServerError) {
      console.log("[v0] Backend is awake but has server errors (likely database issues)")
      state.isAvailable = true // Backend is technically available
      state.hasServerError = true
      state.isWakingUp = false
      state.lastCheckTime = Date.now()
      state.retryCount = 0
      dispatchBackendStatusEvent(
        "server-error",
        "Backend server is experiencing issues. Some features may be unavailable.",
      )
      return true // Return true because backend IS awake, just has errors
    }

    if (isAwake && !hasServerError) {
      console.log("[v0] Backend is now available!")
      state.isAvailable = true
      state.hasServerError = false
      state.isWakingUp = false
      state.lastCheckTime = Date.now()
      state.retryCount = 0
      dispatchBackendStatusEvent("available", "Backend server is ready!")

      // Dispatch success event
      if (typeof document !== "undefined") {
        document.dispatchEvent(new CustomEvent("api-success"))
      }

      return true
    }

    state.retryCount++

    if (state.retryCount < MAX_RETRIES) {
      console.log(`[v0] Backend not ready, retrying in ${RETRY_DELAY / 1000}s...`)
      await delay(RETRY_DELAY)
    }
  }

  console.log("[v0] Backend warmup failed after max retries")
  state.isAvailable = false
  state.hasServerError = false
  state.isWakingUp = false
  dispatchBackendStatusEvent("unavailable", "Backend server is not responding. Please try again later.")

  return false
}

/**
 * Check if the backend is available, initiating warmup if needed
 * Returns a promise that resolves when the backend is ready (or fails)
 */
export async function ensureBackendReady(): Promise<boolean> {
  const now = Date.now()

  // If we recently checked and backend is available, return cached result
  if (state.isAvailable && now - state.lastCheckTime < CACHE_DURATION) {
    return true
  }

  if (state.hasServerError && now - state.lastCheckTime < SERVER_ERROR_CACHE_DURATION) {
    console.log("[v0] Using cached server error state")
    return true
  }

  // If warmup is already in progress, wait for it
  if (state.isWakingUp && state.warmupPromise) {
    console.log("[v0] Waiting for existing warmup process...")
    return state.warmupPromise
  }

  // Quick check if backend is available
  const { isAwake, hasServerError } = await checkBackendHealth(5000) // Quick 5s timeout

  if (isAwake) {
    state.isAvailable = true
    state.hasServerError = hasServerError
    state.lastCheckTime = now

    if (hasServerError) {
      dispatchBackendStatusEvent("server-error", "Backend server is experiencing issues.")
    }

    return true
  }

  // Backend not available, start warmup process
  state.isWakingUp = true
  state.retryCount = 0
  state.warmupPromise = performWarmup()

  const result = await state.warmupPromise
  state.warmupPromise = null

  return result
}

/**
 * Get current backend status
 */
export function getBackendStatus(): { isWakingUp: boolean; isAvailable: boolean; hasServerError: boolean } {
  return {
    isWakingUp: state.isWakingUp,
    isAvailable: state.isAvailable,
    hasServerError: state.hasServerError,
  }
}

/**
 * Reset the warmup state (useful for manual retry)
 */
export function resetWarmupState(): void {
  state.isWakingUp = false
  state.isAvailable = false
  state.hasServerError = false
  state.lastCheckTime = 0
  state.retryCount = 0
  state.warmupPromise = null
}

/**
 * Perform a request with automatic backend warmup
 * Now catches 500 errors and returns undefined instead of throwing
 */
export async function fetchWithWarmup<T>(
  requestFn: () => Promise<T>,
  options: { maxRetries?: number; retryDelay?: number; fallbackValue?: T } = {},
): Promise<T | undefined> {
  const { maxRetries = 3, retryDelay = 2000, fallbackValue } = options

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Ensure backend is ready before making request
      await ensureBackendReady()

      // Make the actual request
      return await requestFn()
    } catch (error: any) {
      const isNetworkError =
        error.message === "Network Error" ||
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNREFUSED" ||
        error.name === "NetworkError"

      const isServerError =
        error.response?.status === 500 || error.response?.status === 502 || error.response?.status === 503

      if (isServerError) {
        console.log(`[v0] Server returned ${error.response?.status}, returning fallback value`)
        state.hasServerError = true
        state.lastCheckTime = Date.now()
        dispatchBackendStatusEvent("server-error", "Backend server is experiencing issues.")
        return fallbackValue
      }

      if (isNetworkError && attempt < maxRetries - 1) {
        console.log(
          `[v0] Request failed due to network error, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`,
        )

        // Reset state to trigger warmup on next attempt
        state.isAvailable = false
        state.lastCheckTime = 0

        await delay(retryDelay)
        continue
      }

      console.log(`[v0] Request failed after ${attempt + 1} attempts, returning fallback`)
      return fallbackValue
    }
  }

  console.log("[v0] Max retries exceeded, returning fallback")
  return fallbackValue
}

export default {
  ensureBackendReady,
  getBackendStatus,
  resetWarmupState,
  fetchWithWarmup,
}
