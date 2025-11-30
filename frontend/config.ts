// API URL configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

// Site URL configuration
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mizizzi-ecommerce-87pr-ffh57x9o6-jons-projects-a41f528c.vercel.app"

// WebSocket URL configuration
export const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://mizizzi-ecommerce-1.onrender.com"

// Enable WebSocket
export const ENABLE_WEBSOCKET = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET !== "false"

// Currency configuration
export const DEFAULT_CURRENCY = "KES"
export const CURRENCY_SYMBOL = "KES"

// Pagination configuration
export const DEFAULT_PAGE_SIZE = 12

// Image configuration
export const DEFAULT_IMAGE_PLACEHOLDER = "/placeholder.svg"

// Theme configuration
export const DEFAULT_THEME = "light"

// Feature flags
export const FEATURES = {
  WISHLIST: true,
  REVIEWS: true,
  COMPARE: true,
  RECENTLY_VIEWED: true,
  QUICK_VIEW: true,
  NEWSLETTER: true,
  SOCIAL_SHARING: true,
}

// Payment methods
export const PAYMENT_METHODS = {
  MPESA: true,
  CARD: true,
  CASH_ON_DELIVERY: true,
}

// Shipping methods
export const SHIPPING_METHODS = {
  STANDARD: {
    id: "standard",
    name: "Standard Shipping",
    price: 250,
    estimated_days: "3-5",
  },
  EXPRESS: {
    id: "express",
    name: "Express Shipping",
    price: 500,
    estimated_days: "1-2",
  },
}

// Tax configuration
export const TAX_RATE = 0.16 // 16% VAT in Kenya
