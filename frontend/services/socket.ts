import { io } from "socket.io-client"
import { getBackendUrl } from "@/lib/api"

// Build ws/wss base URL and socket.io path from backend base URL
function buildWebSocketOptions() {
  const backend = getBackendUrl() // e.g. https://mizizzi-ecommerce-1.onrender.com

  try {
    const u = new URL(backend)
    const protocol = u.protocol === "https:" ? "wss:" : "ws:"
    // host includes hostname and port if present
    const host = u.host
    // preserve any base pathname on the backend (e.g. /api-prefix), trim trailing slash
    const basePath = (u.pathname && u.pathname !== "/") ? u.pathname.replace(/\/$/, "") : ""
    // socket.io server path (standard is /socket.io). If backend has a basePath, append socket.io to it.
    const socketPath = `${basePath || ""}/socket.io`
    const url = `${protocol}//${host}${basePath}`

    return {
      url,
      path: socketPath || "/socket.io",
    }
  } catch (err) {
    // Fallback: assume Render domain without pathname
    const fallbackHost = getBackendUrl().replace(/^https?:\/\//, "").replace(/\/$/, "")
    return {
      url: `wss://${fallbackHost}`,
      path: "/socket.io",
    }
  }
}

export function createSocket() {
  const { url, path } = buildWebSocketOptions()
  // Use websocket transport explicitly to avoid polling attempts to localhost
  return io(url, {
    path,
    transports: ["websocket"],
    autoConnect: false,
    // ...other options like auth can be added here
  })
}