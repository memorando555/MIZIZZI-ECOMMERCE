// Server-side data fetching for product edit page
import type { Product } from "@/types"
import { cookies } from "next/headers"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get("admin_token")?.value
    const mizizziToken = cookieStore.get("mizizzi_token")?.value
    return adminToken || mizizziToken || null
  } catch (error) {
    console.error("[v0] Error getting auth token from cookies:", error)
    return null
  }
}

async function fetchFromAPI<T>(endpoint: string, token: string | null): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers,
    credentials: "include", // Send cookies
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getProductData(productId: string) {
  try {
    const token = await getAuthToken()

    // Fetch all data in parallel
    const [product, categories, brands, images] = await Promise.all([
      fetchFromAPI<Product>(`/api/admin/products/${productId}`, token),
      fetchFromAPI<any[]>(`/api/admin/categories`, token),
      fetchFromAPI<any[]>(`/api/admin/brands`, token),
      fetchFromAPI<any[]>(`/api/admin/products/${productId}/images`, token).catch(() => []),
    ])

    return {
      product,
      categories,
      brands,
      images: images || [],
      error: null,
    }
  } catch (error: any) {
    console.error("[v0] Error fetching product data:", error)
    return {
      product: null,
      categories: [],
      brands: [],
      images: [],
      error: error?.message || "Failed to load product",
    }
  }
}
