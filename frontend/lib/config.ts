// Centralized API configuration

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://mizizzi-ecommerce-1.onrender.com"

export const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://mizizzi-ecommerce-1.onrender.com"

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mizizzi-ecommerce-87pr-ffh57x9o6-jons-projects-a41f528c.vercel.app"

// Helper to construct API endpoints
export const getApiEndpoint = (path: string): string => {
  const base = API_BASE_URL.replace(/\/+$/, "") // Remove trailing slashes
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${cleanPath}`
}

export const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/placeholder.svg"
  // Already absolute URL or data URL - return as is
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url
  // Relative URL starting with / - prepend base URL
  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`
  }
  // If it's just a filename, assume it's in the uploads folder
  return `${API_BASE_URL}/api/uploads/product_images/${url}`
}

export const getUploadedImageUrl = (filename: string | undefined | null): string => {
  if (!filename) return "/placeholder.svg"
  if (filename.startsWith("http") || filename.startsWith("data:") || filename.startsWith("blob:")) return filename
  const cleanFilename = filename.split("/").pop() || filename
  return `${API_BASE_URL}/api/uploads/product_images/${cleanFilename}`
}
