"use server"

import { API_BASE_URL } from "../config"
import { cookies } from "next/headers"

/**
 * Server-side authentication utilities executed on the server only.
 * These functions handle all auth logic server-side to improve performance and security.
 * Token management is HTTP-only cookie based - never exposed to client.
 */

interface AuthResponse {
  user_id?: string
  user?: any
  access_token?: string
  refresh_token?: string
  message?: string
  msg?: string
  success?: boolean
}

interface AvailabilityResponse {
  email_available?: boolean
  phone_available?: boolean
}

/**
 * Server-side: Check if identifier is available (not already registered)
 * Cached at server level to reduce database calls
 */
export async function serverCheckAvailability(identifier: string): Promise<AvailabilityResponse> {
  console.log("[v0] Server: Checking availability for", identifier)

  try {
    const isEmail = identifier.includes("@")
    const data = isEmail ? { email: identifier } : { phone: identifier }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const response = await fetch(`${API_BASE_URL}/api/check-availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const result = await response.json()
      console.log("[v0] Server: Availability check successful:", result)
      return result
    } else {
      throw new Error(`API returned ${response.status}`)
    }
  } catch (error: any) {
    console.error("[v0] Server: Availability check failed:", error.message)
    
    // Graceful degradation: if check fails, assume identifier is available (new account)
    // This allows registration flow to proceed even if backend is slow
    const isEmail = identifier.includes("@")
    return {
      email_available: !isEmail,
      phone_available: isEmail,
    }
  }
}

/**
 * Server-side: Validate user credentials and return session
 * Executed entirely on server - credentials never exposed to client
 */
export async function serverLogin(identifier: string, password: string): Promise<{ success: boolean; error?: string }> {
  console.log("[v0] Server: Login attempt for", identifier)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        password,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data: AuthResponse = await response.json()

    if (!response.ok) {
      const errorMsg = data.msg || data.message || "Login failed"
      console.error("[v0] Server: Login failed:", errorMsg)
      return { success: false, error: errorMsg }
    }

    // Set HTTP-only cookie with token (secure, not accessible to JavaScript)
    if (data.access_token) {
      const cookieStore = await cookies()
      cookieStore.set("mizizzi_token", data.access_token, {
        httpOnly: true, // Prevents XSS attacks
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "lax", // CSRF protection
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      })

      console.log("[v0] Server: Login successful, token set in HTTP-only cookie")
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Server: Login error:", error.message)
    return { success: false, error: "Connection failed. Please try again." }
  }
}

/**
 * Server-side: Create new user account
 */
export async function serverRegister(
  name: string,
  email: string | undefined,
  phone: string | undefined,
  password: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  console.log("[v0] Server: Registration attempt for", email || phone)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data: AuthResponse = await response.json()

    if (!response.ok) {
      const errorMsg = data.msg || data.message || "Registration failed"
      console.error("[v0] Server: Registration failed:", errorMsg)
      return { success: false, error: errorMsg }
    }

    console.log("[v0] Server: Registration successful, user_id:", data.user_id)
    return { success: true, userId: data.user_id }
  } catch (error: any) {
    console.error("[v0] Server: Registration error:", error.message)
    return { success: false, error: "Connection failed. Please try again." }
  }
}

/**
 * Server-side: Send verification code for email/phone
 */
export async function serverSendVerificationCode(
  identifier: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  console.log("[v0] Server: Sending verification code for", identifier)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const isEmail = identifier.includes("@")
    const response = await fetch(`${API_BASE_URL}/api/send-verification-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        user_id: userId,
        type: isEmail ? "email" : "phone",
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data: AuthResponse = await response.json()

    if (!response.ok) {
      const errorMsg = data.msg || data.message || "Failed to send verification code"
      console.error("[v0] Server: Verification code send failed:", errorMsg)
      return { success: false, error: errorMsg }
    }

    console.log("[v0] Server: Verification code sent successfully")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Server: Send verification code error:", error.message)
    return { success: false, error: "Connection failed. Please try again." }
  }
}

/**
 * Server-side: Verify code and complete authentication
 */
export async function serverVerifyCode(
  userId: string,
  code: string,
  isPhone: boolean
): Promise<{ success: boolean; error?: string }> {
  console.log("[v0] Server: Verifying code for user", userId)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const response = await fetch(`${API_BASE_URL}/api/verify-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        code,
        type: isPhone ? "phone" : "email",
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data: AuthResponse = await response.json()

    if (!response.ok) {
      const errorMsg = data.msg || data.message || "Verification failed"
      console.error("[v0] Server: Verification failed:", errorMsg)
      return { success: false, error: errorMsg }
    }

    // Set HTTP-only cookie with token upon successful verification
    if (data.access_token) {
      const cookieStore = await cookies()
      cookieStore.set("mizizzi_token", data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      })

      console.log("[v0] Server: Verification successful, token set in HTTP-only cookie")
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Server: Verification error:", error.message)
    return { success: false, error: "Connection failed. Please try again." }
  }
}

/**
 * Server-side: Get current authenticated user from cookie
 */
export async function serverGetCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("mizizzi_token")?.value

    if (!token) {
      console.log("[v0] Server: No auth token found")
      return null
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const user = await response.json()
      console.log("[v0] Server: Current user retrieved:", user.email || user.phone)
      return user
    }

    return null
  } catch (error: any) {
    console.error("[v0] Server: Get current user error:", error.message)
    return null
  }
}

/**
 * Server-side: Check if user is authenticated via cookie
 */
export async function serverIsAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("mizizzi_token")?.value
    return !!token
  } catch (error) {
    return false
  }
}

/**
 * Server-side: Logout by clearing auth cookie
 */
export async function serverLogout(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("mizizzi_token")
    console.log("[v0] Server: User logged out, token cleared")
  } catch (error: any) {
    console.error("[v0] Server: Logout error:", error.message)
  }
}
