import api from "@/lib/api"
import type { AdminPaginatedResponse, ProductCreatePayload } from "@/types/admin"
import type { Product, Category } from "@/types"

// ============================================================================
// CACHE & SERVICE CONFIGURATION
// ============================================================================

const productCache = new Map()
const dashboardCache = new Map()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

// ============================================================================
// ENHANCED TYPE DEFINITIONS - Complete Dashboard & Analytics
// ============================================================================

interface AdminLoginResponse {
  user: any
  access_token: string
  refresh_token?: string
  csrf_token?: string
}

// Enhanced Dashboard Response with all features
interface AdminDashboardResponse {
  // Core Counts
  counts: {
    users: number
    products: number
    orders: number
    categories: number
    brands: number
    reviews: number
    pending_reviews: number
    newsletter_subscribers: number
    new_signups_today: number
    new_signups_week: number
    orders_in_transit: number
    pending_payments: number
    low_stock_count: number
    total_active_sessions: number
    total_sales_channels: number
    refunds_pending: number
    support_tickets_open: number
    total_wishlist_items: number
    active_coupons: number
    returning_customers: number
  }

  // Sales Metrics with Trends
  sales: {
    today: number
    yesterday: number
    weekly: number
    monthly: number
    yearly: number
    total_revenue: number
    pending_amount: number
    average_order_value: number
    net_profit: number
    gross_profit: number
    refunded_amount: number
    tax_collected: number
    shipping_revenue: number
    // Trends
    today_trend: number
    weekly_trend: number
    monthly_trend: number
  }

  // Order Analytics
  order_status: Record<string, number>
  order_metrics: {
    average_processing_time: number
    average_delivery_time: number
    repeat_order_rate: number
    cart_abandonment_rate: number
    average_items_per_order: number
  }

  // Customer Analytics
  customer_analytics: {
    total_customers: number
    new_customers_today: number
    repeat_customers: number
    customer_retention_rate: number
    average_customer_lifetime_value: number
    customer_satisfaction_score: number
    churn_rate: number
  }

  // Traffic & Conversion
  traffic_analytics: {
    total_visits: number
    unique_visitors: number
    page_views: number
    bounce_rate: number
    conversion_rate: number
    average_session_duration: number
    returning_visitor_rate: number
  }

  // Payment Methods
  payment_methods: Array<{
    method: string
    count: number
    total_amount: number
    percentage: number
  }>

  // Regional & Demographic
  users_by_region: Array<{ region: string; count: number; growth: number }>
  users_by_device: Array<{ device: string; count: number; percentage: number }>
  age_distribution: Array<{ age_group: string; count: number }>

  // Time Series Data
  revenue_vs_refunds: Array<{ date: string; revenue: number; refunds: number }>
  sales_data: Array<{ date: string; sales: number; orders: number }>
  active_users: Array<{ date: string; users: number }>

  // Recent Data (Paginated)
  recent_orders: Array<{
    id: string
    order_number: string
    user_email: string
    user_name: string
    total_amount: number
    status: string
    payment_status: string
    created_at: string
    items_count: number
  }>

  recent_users: Array<{
    id: number | string
    name: string
    username: string
    email: string
    created_at: string
    total_spent: number
    orders_count: number
    is_premium: boolean
  }>

  recent_activities: Array<{
    id: string | number
    message: string
    description: string
    type: string
    timestamp: string
    user_id?: string
    severity: "info" | "success" | "warning" | "error"
  }>

  low_stock_products: Array<{
    id: number | string
    name: string
    sku: string
    stock: number
    min_stock: number
    max_stock: number
    reorder_level: number
  }>

  // Top Products & Categories
  best_selling_products: Array<{
    id: number | string
    name: string
    sku: string
    sales_count: number
    revenue: number
    rating: number
    stock: number
  }>

  sales_by_category: Array<{
    id: string
    category: string
    sales: number
    revenue: number
    items_sold: number
    growth_rate: number
  }>

  top_customers: Array<{
    id: number | string
    name: string
    email: string
    total_spent: number
    orders_count: number
  }>

  // Inventory Alerts
  inventory_alerts: Array<{
    id: string
    product_id: string
    product_name: string
    alert_type: "low_stock" | "out_of_stock" | "overstock" | "expiring"
    current_stock: number
    threshold: number
    created_at: string
    severity: "info" | "warning" | "critical"
  }>

  // Performance Metrics
  performance_metrics: {
    page_load_time: number
    api_response_time: number
    database_query_time: number
    cache_hit_rate: number
    error_rate: number
    uptime_percentage: number
  }

  // System Health
  system_health: {
    status: "healthy" | "warning" | "critical"
    database: "connected" | "disconnected"
    cache: "active" | "inactive"
    api_health: number // 0-100
    memory_usage: number // percentage
    cpu_usage: number // percentage
    disk_usage: number // percentage
  }

  // Notifications & Alerts
  notifications: Array<{
    id: string
    title: string
    message: string
    type: "info" | "success" | "warning" | "error"
    timestamp: string
    read: boolean
    action_url?: string
  }>

  // Summary Dashboard Card
  summary: {
    total_gmv: number
    total_orders_all_time: number
    total_customers_all_time: number
    average_review_rating: number
  }
}

interface AdminImageUpload {
  url: string
  image_url?: string
  size?: number
  is_primary: boolean
  sort_order: number
  alt_text?: string
  uploaded_by?: number | string
  created_at?: string
  updated_at?: string
}

// ============================================================================
// ADMIN SERVICE - Enhanced Complete API Integration
// ============================================================================

export const adminService = {
  // ========================================================================
  // AVAILABILITY CHECK
  // ========================================================================

  isServiceAvailable(): boolean {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL
      if (!apiUrl) {
        console.warn("[v0] Admin service: No API URL configured")
        return false
      }

      if (typeof window === "undefined") {
        return true
      }

      try {
        localStorage.getItem("test")
        return true
      } catch (e) {
        console.warn("[v0] Admin service: localStorage not available")
        return false
      }
    } catch (error) {
      console.error("[v0] Admin service availability check failed:", error)
      return false
    }
  },

  // ========================================================================
  // AUTHENTICATION METHODS
  // ========================================================================

  async login(credentials: { email: string; password: string; remember?: boolean }): Promise<AdminLoginResponse> {
    try {
      console.log("[v0] Admin login attempt for:", credentials.email)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: credentials.email,
          password: credentials.password,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Login failed with status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.user || data.user.role !== "admin") {
        throw new Error("You don't have permission to access the admin area")
      }

      // Store tokens
      if (data.access_token) {
        localStorage.setItem("mizizzi_token", data.access_token)
        localStorage.setItem("admin_token", data.access_token)
      }
      if (data.refresh_token) {
        localStorage.setItem("mizizzi_refresh_token", data.refresh_token)
        localStorage.setItem("admin_refresh_token", data.refresh_token)
      }
      if (data.csrf_token) {
        localStorage.setItem("mizizzi_csrf_token", data.csrf_token)
      }

      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("admin_user", JSON.stringify(data.user))

      console.log("[v0] Admin login successful for:", data.user.email)
      return data
    } catch (error) {
      console.error("[v0] Admin login error:", error)
      throw error
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }).catch((e) => console.warn("[v0] Logout fetch error:", e))
    } finally {
      localStorage.removeItem("mizizzi_token")
      localStorage.removeItem("admin_token")
      localStorage.removeItem("mizizzi_refresh_token")
      localStorage.removeItem("admin_refresh_token")
      localStorage.removeItem("user")
      localStorage.removeItem("admin_user")
      dashboardCache.clear()
    }
  },

  // ========================================================================
  // DASHBOARD & ANALYTICS - PRIMARY FEATURES
  // ========================================================================

  async getDashboardData(): Promise<AdminDashboardResponse> {
    try {
      const cachedData = dashboardCache.get("dashboard")
      const now = Date.now()

      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        console.log("[v0] Using cached dashboard data")
        return cachedData.data
      }

      console.log("[v0] Fetching fresh dashboard data from API")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })

      if (!response.ok) {
        console.warn("[v0] Dashboard API failed, using default data")
        return this.getDefaultDashboardData()
      }

      const data = await response.json()
      dashboardCache.set("dashboard", { data, timestamp: now })
      return data
    } catch (error) {
      console.error("[v0] Failed to fetch dashboard data:", error)
      return this.getDefaultDashboardData()
    }
  },

  async getInventoryAlerts(): Promise<AdminDashboardResponse["inventory_alerts"]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/inventory-alerts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch inventory alerts:", error)
      return []
    }
  },

  async getPaymentMetrics(): Promise<AdminDashboardResponse["payment_methods"]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/payments/metrics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch payment metrics:", error)
      return []
    }
  },

  async getRegionalMetrics(): Promise<AdminDashboardResponse["users_by_region"]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics/regional`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch regional metrics:", error)
      return []
    }
  },

  async getDeviceMetrics(): Promise<AdminDashboardResponse["users_by_device"]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics/devices`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch device metrics:", error)
      return []
    }
  },

  async getPerformanceMetrics(): Promise<AdminDashboardResponse["performance_metrics"]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/performance`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) {
        return this.getDefaultPerformanceMetrics()
      }
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch performance metrics:", error)
      return this.getDefaultPerformanceMetrics()
    }
  },

  async getSystemStatus(): Promise<AdminDashboardResponse["system_health"]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/system-status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) {
        return this.getDefaultSystemStatus()
      }
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch system status:", error)
      return this.getDefaultSystemStatus()
    }
  },

  async getCustomerAnalytics(): Promise<AdminDashboardResponse["customer_analytics"]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics/customers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) return this.getDefaultCustomerAnalytics()
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch customer analytics:", error)
      return this.getDefaultCustomerAnalytics()
    }
  },

  // ========================================================================
  // DEFAULT/MOCK DATA PROVIDERS
  // ========================================================================

  getDefaultPerformanceMetrics(): AdminDashboardResponse["performance_metrics"] {
    return {
      page_load_time: 1.2,
      api_response_time: 0.3,
      database_query_time: 0.15,
      cache_hit_rate: 78,
      error_rate: 0.02,
      uptime_percentage: 99.95,
    }
  },

  getDefaultSystemStatus(): AdminDashboardResponse["system_health"] {
    return {
      status: "healthy",
      database: "connected",
      cache: "active",
      api_health: 98,
      memory_usage: 45,
      cpu_usage: 32,
      disk_usage: 60,
    }
  },

  getDefaultCustomerAnalytics(): AdminDashboardResponse["customer_analytics"] {
    return {
      total_customers: 12500,
      new_customers_today: 42,
      repeat_customers: 3200,
      customer_retention_rate: 72,
      average_customer_lifetime_value: 450.75,
      customer_satisfaction_score: 4.6,
      churn_rate: 2.3,
    }
  },

  getDefaultDashboardData(): AdminDashboardResponse {
    return {
      counts: {
        users: 15234,
        products: 2890,
        orders: 9876,
        categories: 24,
        brands: 156,
        reviews: 5432,
        pending_reviews: 234,
        newsletter_subscribers: 8765,
        new_signups_today: 45,
        new_signups_week: 312,
        orders_in_transit: 234,
        pending_payments: 45,
        low_stock_count: 23,
        total_active_sessions: 1234,
        total_sales_channels: 5,
        refunds_pending: 12,
        support_tickets_open: 18,
        total_wishlist_items: 3456,
        active_coupons: 34,
        returning_customers: 6789,
      },
      sales: {
        today: 45678.9,
        yesterday: 38234.56,
        weekly: 234567.89,
        monthly: 1234567.89,
        yearly: 12345678.9,
        total_revenue: 45678901.23,
        pending_amount: 23456.78,
        average_order_value: 178.45,
        net_profit: 2345678.9,
        gross_profit: 3456789.12,
        refunded_amount: 12345.67,
        tax_collected: 45678.9,
        shipping_revenue: 23456.78,
        today_trend: 19,
        weekly_trend: 12,
        monthly_trend: 8,
      },
      order_status: {
        pending: 45,
        processing: 89,
        shipped: 234,
        delivered: 8456,
        cancelled: 52,
        refunded: 23,
      },
      order_metrics: {
        average_processing_time: 2.5,
        average_delivery_time: 4.8,
        repeat_order_rate: 28,
        cart_abandonment_rate: 65,
        average_items_per_order: 2.3,
      },
      customer_analytics: this.getDefaultCustomerAnalytics(),
      traffic_analytics: {
        total_visits: 234567,
        unique_visitors: 123456,
        page_views: 567890,
        bounce_rate: 32,
        conversion_rate: 3.45,
        average_session_duration: 4.2,
        returning_visitor_rate: 42,
      },
      payment_methods: [
        { method: "Credit Card", count: 4567, total_amount: 234567.89, percentage: 60 },
        { method: "Debit Card", count: 1234, total_amount: 89234.56, percentage: 20 },
        { method: "PayPal", count: 987, total_amount: 45678.9, percentage: 12 },
        { method: "Apple Pay", count: 456, total_amount: 23456.78, percentage: 8 },
      ],
      users_by_region: [
        { region: "North America", count: 5234, growth: 12 },
        { region: "Europe", count: 3456, growth: 8 },
        { region: "Asia Pacific", count: 4123, growth: 15 },
        { region: "Latin America", count: 1234, growth: 5 },
        { region: "Middle East", count: 987, growth: 3 },
      ],
      users_by_device: [
        { device: "Mobile", count: 8765, percentage: 57 },
        { device: "Desktop", count: 5234, percentage: 35 },
        { device: "Tablet", count: 1235, percentage: 8 },
      ],
      age_distribution: [
        { age_group: "18-24", count: 3456 },
        { age_group: "25-34", count: 5234 },
        { age_group: "35-44", count: 3123 },
        { age_group: "45-54", count: 2123 },
        { age_group: "55+", count: 1298 },
      ],
      revenue_vs_refunds: [
        { date: "2024-01-15", revenue: 45678.9, refunds: 2345.67 },
        { date: "2024-01-16", revenue: 52345.67, refunds: 1234.56 },
        { date: "2024-01-17", revenue: 48976.54, refunds: 3456.78 },
      ],
      sales_data: [
        { date: "2024-01-15", sales: 234, orders: 456 },
        { date: "2024-01-16", sales: 267, orders: 523 },
        { date: "2024-01-17", sales: 245, orders: 489 },
      ],
      active_users: [
        { date: "2024-01-15", users: 4567 },
        { date: "2024-01-16", users: 5234 },
        { date: "2024-01-17", users: 4892 },
      ],
      recent_orders: [
        {
          id: "1",
          order_number: "ORD-10001",
          user_email: "john@example.com",
          user_name: "John Doe",
          total_amount: 299.99,
          status: "processing",
          payment_status: "paid",
          created_at: new Date().toISOString(),
          items_count: 3,
        },
        {
          id: "2",
          order_number: "ORD-10002",
          user_email: "jane@example.com",
          user_name: "Jane Smith",
          total_amount: 149.99,
          status: "shipped",
          payment_status: "paid",
          created_at: new Date().toISOString(),
          items_count: 1,
        },
      ],
      recent_users: [
        {
          id: "1",
          name: "Sarah Connor",
          username: "sarah_connor",
          email: "sarah@example.com",
          created_at: new Date().toISOString(),
          total_spent: 1234.56,
          orders_count: 5,
          is_premium: true,
        },
        {
          id: "2",
          name: "Mike Ross",
          username: "mike_ross",
          email: "mike@example.com",
          created_at: new Date().toISOString(),
          total_spent: 456.78,
          orders_count: 2,
          is_premium: false,
        },
      ],
      recent_activities: [
        {
          id: "1",
          message: "New order #ORD-10001 placed",
          description: "John Doe placed a new order",
          type: "order",
          timestamp: new Date().toISOString(),
          severity: "info",
        },
        {
          id: "2",
          message: "New customer registration",
          description: "Sarah Connor registered",
          type: "user",
          timestamp: new Date().toISOString(),
          severity: "success",
        },
      ],
      low_stock_products: [
        {
          id: "1",
          name: "Wireless Bluetooth Headphones",
          sku: "WBH-001",
          stock: 3,
          min_stock: 10,
          max_stock: 100,
          reorder_level: 15,
        },
        {
          id: "2",
          name: "Smart Fitness Watch",
          sku: "SFW-002",
          stock: 1,
          min_stock: 5,
          max_stock: 50,
          reorder_level: 10,
        },
      ],
      best_selling_products: [
        {
          id: "1",
          name: "Wireless Bluetooth Headphones",
          sku: "WBH-001",
          sales_count: 1234,
          revenue: 89234.56,
          rating: 4.7,
          stock: 45,
        },
        {
          id: "2",
          name: "Smart Fitness Watch",
          sku: "SFW-002",
          sales_count: 876,
          revenue: 156234.78,
          rating: 4.5,
          stock: 78,
        },
      ],
      sales_by_category: [
        {
          id: "1",
          category: "Electronics",
          sales: 4567,
          revenue: 234567.89,
          items_sold: 5234,
          growth_rate: 12,
        },
        {
          id: "2",
          category: "Fashion",
          sales: 2345,
          revenue: 123456.78,
          items_sold: 3456,
          growth_rate: 8,
        },
      ],
      top_customers: [
        {
          id: "1",
          name: "Enterprise Corp",
          email: "contact@enterprise.com",
          total_spent: 45678.9,
          orders_count: 123,
        },
        {
          id: "2",
          name: "Tech Solutions",
          email: "info@techsol.com",
          total_spent: 23456.78,
          orders_count: 67,
        },
      ],
      inventory_alerts: [
        {
          id: "1",
          product_id: "1",
          product_name: "Wireless Headphones",
          alert_type: "low_stock",
          current_stock: 3,
          threshold: 10,
          created_at: new Date().toISOString(),
          severity: "warning",
        },
        {
          id: "2",
          product_id: "2",
          product_name: "Smart Watch",
          alert_type: "out_of_stock",
          current_stock: 0,
          threshold: 5,
          created_at: new Date().toISOString(),
          severity: "critical",
        },
      ],
      performance_metrics: this.getDefaultPerformanceMetrics(),
      system_health: this.getDefaultSystemStatus(),
      notifications: [
        {
          id: "1",
          title: "Critical Stock Alert",
          message: "23 products running low on stock",
          type: "warning",
          timestamp: new Date().toISOString(),
          read: false,
        },
        {
          id: "2",
          title: "New Orders",
          message: "You have 5 new orders",
          type: "info",
          timestamp: new Date().toISOString(),
          read: false,
        },
      ],
      summary: {
        total_gmv: 45678901.23,
        total_orders_all_time: 98765,
        total_customers_all_time: 15234,
        average_review_rating: 4.6,
      },
    }
  },

  // ========================================================================
  // ORDERS MANAGEMENT
  // ========================================================================

  async getOrders(page = 1, limit = 20): Promise<AdminPaginatedResponse<any>> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
          },
        }
      )
      if (!response.ok) throw new Error("Failed to fetch orders")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch orders:", error)
      throw error
    }
  },

  async getOrderById(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch order")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch order:", error)
      throw error
    }
  },

  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error("Failed to update order status")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to update order status:", error)
      throw error
    }
  },

  // ========================================================================
  // PRODUCTS MANAGEMENT
  // ========================================================================

  async getProducts(page = 1, limit = 20): Promise<AdminPaginatedResponse<Product>> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
          },
        }
      )
      if (!response.ok) throw new Error("Failed to fetch products")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch products:", error)
      throw error
    }
  },

  async createProduct(payload: ProductCreatePayload): Promise<Product> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Failed to create product")
      invalidateProductCaches()
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to create product:", error)
      throw error
    }
  },

  async updateProduct(productId: number, payload: Partial<Product>): Promise<Product> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Failed to update product")
      invalidateProductCaches(productId)
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to update product:", error)
      throw error
    }
  },

  async deleteProduct(productId: number): Promise<void> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) throw new Error("Failed to delete product")
      invalidateProductCaches(productId)
    } catch (error) {
      console.error("[v0] Failed to delete product:", error)
      throw error
    }
  },

  // ========================================================================
  // CUSTOMERS MANAGEMENT
  // ========================================================================

  async getCustomers(page = 1, limit = 20): Promise<AdminPaginatedResponse<any>> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/customers?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
          },
        }
      )
      if (!response.ok) throw new Error("Failed to fetch customers")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch customers:", error)
      throw error
    }
  },

  async getCustomerById(customerId: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch customer")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch customer:", error)
      throw error
    }
  },

  // ========================================================================
  // CATEGORIES MANAGEMENT
  // ========================================================================

  async getCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch categories")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch categories:", error)
      throw error
    }
  },

  async createCategory(payload: Partial<Category>): Promise<Category> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Failed to create category")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to create category:", error)
      throw error
    }
  },

  // ========================================================================
  // REVIEWS MANAGEMENT
  // ========================================================================

  async getReviews(page = 1, limit = 20): Promise<AdminPaginatedResponse<any>> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
          },
        }
      )
      if (!response.ok) throw new Error("Failed to fetch reviews")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch reviews:", error)
      throw error
    }
  },

  async approveReview(reviewId: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews/${reviewId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) throw new Error("Failed to approve review")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to approve review:", error)
      throw error
    }
  },

  async rejectReview(reviewId: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews/${reviewId}/reject`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
      })
      if (!response.ok) throw new Error("Failed to reject review")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to reject review:", error)
      throw error
    }
  },

  // ========================================================================
  // INVENTORY MANAGEMENT
  // ========================================================================

  async updateInventory(productId: number, stock: number): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/inventory/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
        body: JSON.stringify({ stock }),
      })
      if (!response.ok) throw new Error("Failed to update inventory")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to update inventory:", error)
      throw error
    }
  },

  // ========================================================================
  // PROMOTIONS & COUPONS
  // ========================================================================

  async getCoupons(page = 1, limit = 20): Promise<AdminPaginatedResponse<any>> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/coupons?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
          },
        }
      )
      if (!response.ok) throw new Error("Failed to fetch coupons")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to fetch coupons:", error)
      throw error
    }
  },

  async createCoupon(payload: any): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Failed to create coupon")
      return await response.json()
    } catch (error) {
      console.error("[v0] Failed to create coupon:", error)
      throw error
    }
  },

  // ========================================================================
  // CACHE & UTILITY
  // ========================================================================

  invalidateProductCaches(productId?: number): void {
    if (productId) {
      productCache.delete(`product_${productId}`)
    } else {
      productCache.clear()
    }
    dashboardCache.clear()
  },
}

// Helper function for cache invalidation
function invalidateProductCaches(productId?: number): void {
  if (productId) {
    productCache.delete(`product_${productId}`)
  } else {
    productCache.clear()
  }
  dashboardCache.clear()
}
