// Environment configuration
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com",
    timeout: 30000, // 30 seconds
  },

  // Site Configuration
  site: {
    name: "Mizizzi",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://mizizzi-ecommerce-87pr-ffh57x9o6-jons-projects-a41f528c.vercel.app",
    description: "Premium E-commerce Platform",
  },

  // WebSocket Configuration
  websocket: {
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://mizizzi-ecommerce-1.onrender.com",
    enabled: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === "true",
  },

  // Feature Flags
  features: {
    enableWebSocket: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === "true",
    enablePWA: true,
    enableOfflineMode: true,
    enableNotifications: true,
  },

  // Cache Configuration
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100, // Maximum number of cached items
  },

  // Pagination Defaults
  pagination: {
    defaultPageSize: 12,
    maxPageSize: 100,
  },

  // Image Configuration
  images: {
    placeholder: "/placeholder.svg",
    quality: 80,
    formats: ["webp", "jpg"],
  },

  // Payment Configuration
  payments: {
    mpesa: {
      enabled: true,
    },
    pesapal: {
      enabled: true,
    },
    cashOnDelivery: {
      enabled: true,
    },
  },

  // Development Configuration
  development: {
    enableDebugLogs: process.env.NODE_ENV === "development",
    enableMockData: process.env.NODE_ENV === "development",
  },
}

export default config
