import { cookies } from "next/headers"
import { API_BASE_URL } from "../config"

export interface AuthCheckResult {
  email_available: boolean
  phone_available: boolean
}

export interface LoginResult {
  success: boolean
  user?: {
    id: string
    email?: string
    phone?: string
    name?: string
  }
  error?: string
  requiresVerification?: boolean
}

export interface RegisterResult {
  success: boolean
  userId?: string
  requiresVerification?: boolean
  error?: string
}

export interface VerifyResult {
  success: boolean
  user?: {
    id: string
    email?: string
    phone?: string
    name?: string
  }
  error?: string
}

/**
 * Server-side function to check email/phone availability
 * Executes at edge level before returning to client
 * Timeout: 5 seconds per request
 */
export async function checkIdentifierAvailability(identifier: string): Promise<AuthCheckResult> {
  console.log("[v0] Server: Checking availability for:", identifier)

  try {
    const isEmail = identifier.includes("@")
    const data = isEmail ? { email: identifier } : { phone: identifier }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${API_BASE_URL}/api/check-availability`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error("[v0] Server: Availability check failed:", response.status)
      throw new Error(`Backend returned ${response.status}`)
    }

    const result = await response.json()
    console.log("[v0] Server: Availability check result:", result)
    return result
  } catch (error: any) {
    console.error("[v0] Server: Availability check error:", error.message)

    // Graceful degradation: if check fails, assume identifier is available
    // This allows users to proceed and get more specific errors during registration
    if (error.message.includes("abort")) {
      console.warn("[v0] Server: Availability check timed out, assuming available for UX")
      return {
        email_available: identifier.includes("@"),
        phone_available: !identifier.includes("@"),
      }
    }

    throw error
  }
}

/**
 * Server-side function to perform login
 * Stores auth token in HTTP-only cookie
 * Token never exposed to JavaScript
 */
export async function performLogin(
  identifier: string,
  password: string,
): Promise<LoginResult> {
  console.log("[v0] Server: Login attempt for:", identifier)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: identifier.includes("@") ? identifier : undefined,
        phone: !identifier.includes("@") ? identifier : undefined,
        password,
      }),
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok) {
      if (data.verification_required) {
        console.log("[v0] Server: Login requires verification")
        return {
          success: false,
          requiresVerification: true,
          error: "Verification required",
        }
      }

      console.error("[v0] Server: Login failed:", data.msg)
      return {
        success: false,
        error: data.msg || "Login failed",
      }
    }

    // Store token in HTTP-only cookie (secure)
    if (data.access_token) {
      const cookieStore = await cookies()
      cookieStore.set("mizizzi_token", data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
      console.log("[v0] Server: Token stored in HTTP-only cookie")
    }

    console.log("[v0] Server: Login successful")
    return {
      success: true,
      user: {
        id: data.user?.id || data.user_id,
        email: data.user?.email,
        phone: data.user?.phone,
        name: data.user?.name,
      },
    }
  } catch (error: any) {
    console.error("[v0] Server: Login error:", error.message)
    return {
      success: false,
      error: error.message.includes("abort") ? "Request timeout" : error.message,
    }
  }
}

/**
 * Server-side function to register a new user
 * Returns user ID for subsequent verification
 */
export async function performRegister(
  name: string,
  identifier: string,
  password: string,
): Promise<RegisterResult> {
  console.log("[v0] Server: Register attempt for:", identifier)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email: identifier.includes("@") ? identifier : undefined,
        phone: !identifier.includes("@") ? identifier : undefined,
        password,
      }),
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Server: Registration failed:", data.msg)
      return {
        success: false,
        error: data.msg || "Registration failed",
      }
    }

    console.log("[v0] Server: Registration successful, requires verification")
    return {
      success: true,
      userId: data.user_id,
      requiresVerification: true,
    }
  } catch (error: any) {
    console.error("[v0] Server: Registration error:", error.message)
    return {
      success: false,
      error: error.message.includes("abort") ? "Request timeout" : error.message,
    }
  }
}

/**
 * Server-side function to verify email/phone code
 * Stores token in HTTP-only cookie after successful verification
 */
export async function performVerification(
  userId: string,
  code: string,
  isPhone: boolean = false,
): Promise<VerifyResult> {
  console.log("[v0] Server: Verify code for user:", userId)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${API_BASE_URL}/api/verify-code`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        code: code.trim(),
        is_phone: isPhone,
      }),
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Server: Verification failed:", data.msg)
      return {
        success: false,
        error: data.msg || "Verification failed",
      }
    }

    // Store token in HTTP-only cookie (secure)
    if (data.access_token) {
      const cookieStore = await cookies()
      cookieStore.set("mizizzi_token", data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
      console.log("[v0] Server: Token stored in HTTP-only cookie after verification")
    }

    console.log("[v0] Server: Verification successful")
    return {
      success: true,
      user: {
        id: data.user?.id || userId,
        email: data.user?.email,
        phone: data.user?.phone,
        name: data.user?.name,
      },
    }
  } catch (error: any) {
    console.error("[v0] Server: Verification error:", error.message)
    return {
      success: false,
      error: error.message.includes("abort") ? "Request timeout" : error.message,
    }
  }
}

/**
 * Server-side function to resend verification code
 */
export async function resendVerificationCode(identifier: string): Promise<{ success: boolean; error?: string }> {
  console.log("[v0] Server: Resend verification code for:", identifier)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${API_BASE_URL}/api/resend-verification`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier }),
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Server: Resend failed:", data.msg)
      return {
        success: false,
        error: data.msg || "Failed to resend verification code",
      }
    }

    console.log("[v0] Server: Verification code resent successfully")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Server: Resend error:", error.message)
    return {
      success: false,
      error: error.message.includes("abort") ? "Request timeout" : error.message,
    }
  }
}

/**
 * Server-side function to check if user is authenticated
 * Reads from HTTP-only cookie (token not exposed to JavaScript)
 */
export async function getServerAuthStatus() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("mizizzi_token")?.value

    console.log("[v0] Server: Auth check -", token ? "authenticated" : "not authenticated")
    return {
      isAuthenticated: !!token,
      token: token || null,
    }
  } catch (error) {
    console.error("[v0] Server: Auth check error:", error)
    return {
      isAuthenticated: false,
      token: null,
    }
  }
}

/**
 * Server-side function to clear authentication
 * Removes HTTP-only cookie
 */
export async function clearServerAuth() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("mizizzi_token")
    console.log("[v0] Server: Auth cleared")
    return { success: true }
  } catch (error) {
    console.error("[v0] Server: Clear auth error:", error)
    return { success: false }
  }
}
