"use server"

import { cookies, headers } from "next/headers"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://mizizzi-ecommerce-1.onrender.com"

export interface OrdersResponse {
  items: Array<{
    id: number | string
    order_number: string
    user_id: string
    customer_name: string
    customer_email: string
    created_at: string
    updated_at: string
    status: string
    payment_status: string
    payment_method: string
    tracking_number?: string | null
    tracking_url?: string | null
    notes?: string | null
    return_reason?: string | null
    total_amount: number
    subtotal_amount?: number
    shipping_amount?: number
    tax_amount?: number
    user?: {
      name: string
      email: string
      phone?: string
    }
    items: Array<{
      id: number | string
      product_name: string
      name: string
      quantity: number
      price: number
      image_url?: string
    }>
  }>
  pagination: {
    total_pages: number
    total_items: number
    current_page: number
  }
}

/**
 * Server action to fetch admin orders with token from cookies
 * This enables true SSR for the orders page
 */
export async function fetchOrdersSSR(params?: {
  page?: number
  per_page?: number
  search?: string
}): Promise<OrdersResponse> {
  try {
    const cookieStore = await cookies()
    const headersList = await headers()
    
    // Try to get token from cookies first
    let token = cookieStore.get("admin_token")?.value
    
    // Fallback to header if cookie not found (middleware passes it)
    if (!token) {
      token = headersList.get("x-admin-token")
    }

    if (!token) {
      console.log("[v0] fetchOrdersSSR: No admin token found in cookies or headers")
      return {
        items: [],
        pagination: {
          total_pages: 1,
          total_items: 0,
          current_page: 1,
        },
      }
    }

    console.log("[v0] fetchOrdersSSR: Using token from", cookieStore.get("admin_token") ? "cookies" : "headers")

    const url = new URL(`${BASE_URL}/api/admin/orders`)
    url.searchParams.append("include_items", "true")
    url.searchParams.append("with_items", "true")

    if (params?.page) url.searchParams.append("page", params.page.toString())
    if (params?.per_page) url.searchParams.append("per_page", params.per_page.toString())
    if (params?.search) url.searchParams.append("search", params.search)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error("[v0] fetchOrdersSSR: API returned status", response.status)
      return {
        items: [],
        pagination: {
          total_pages: 1,
          total_items: 0,
          current_page: 1,
        },
      }
    }

    const data = await response.json()
    console.log("[v0] fetchOrdersSSR: Successfully fetched", data.items?.length || 0, "orders")
    return data || {
      items: [],
      pagination: {
        total_pages: 1,
        total_items: 0,
        current_page: 1,
      },
    }
  } catch (error) {
    console.error("[v0] fetchOrdersSSR: Error:", error)
    return {
      items: [],
      pagination: {
        total_pages: 1,
        total_items: 0,
        current_page: 1,
      },
    }
  }
}
