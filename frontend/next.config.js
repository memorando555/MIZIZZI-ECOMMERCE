/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Image Optimization
  images: {
    // Allow external image domains for optimization
    domains: [
      "images.unsplash.com",
      "images.pexels.com",
      "ke.jumia.is",
      "onrender.com",
      "cdn.svgator.com",
      "hebbkx1anhila5yf.public.blob.vercel-storage.com",
    ],
    // Use modern formats with fallbacks
    formats: ["image/avif", "image/webp"],
    // Optimize responsive images
    deviceSizes: [320, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimized images for 60 days in production
    minimumCacheTTL: 31536000,
  },

  // Performance optimizations
  poweredByHeader: false,

  // Enable React strict mode for development
  reactStrictMode: true,

  // Code splitting and lazy loading
  experimental: {
    // Enable new compiler features
    optimizeCss: true,
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.optimization.splitChunks.cacheGroups = {
      ...config.optimization.splitChunks.cacheGroups,
      // Separate vendor chunks for better caching
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: "vendors",
        priority: 10,
        reuseExistingChunk: true,
      },
      // Separate common chunks
      common: {
        minChunks: 2,
        priority: 5,
        reuseExistingChunk: true,
      },
    }

    return config
  },

  // Headers for caching and performance
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ]
  },

  // Redirects (optional)
  async redirects() {
    return []
  },

  // Rewrites for API routes
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    }
  },
}

module.exports = nextConfig
