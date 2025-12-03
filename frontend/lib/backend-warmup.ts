// Minimal backend-warmup utilities used by UI components.

export type BackendStatus = {
  hasServerError: boolean
  status?: "available" | "waking-up" | "unavailable" | "server-error"
  message?: string
}

/**
 * Perform a simple health check against the backend.
 * Adjust the endpoint if your project uses a different health endpoint.
 */
export async function ensureBackendReady(timeoutMs = 5000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch("/api/health", { cache: "no-store", signal: controller.signal })
    clearTimeout(id)
    return res.ok
  } catch {
    return false
  }
}

/** Placeholder to reset any warmup state in the client (no-op). */
export function resetWarmupState(): void {
  // Intentionally empty — kept for compatibility with existing callers.
}

/** Return a minimal backend status shape. Components may extend this as needed. */
export function getBackendStatus(): BackendStatus {
  return { hasServerError: false, status: "available", message: "" }
}
