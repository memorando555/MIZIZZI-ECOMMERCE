"use server"

import { redirect } from "next/navigation"
import {
  checkIdentifierAvailability,
  performLogin,
  performRegister,
  performVerification,
  resendVerificationCode,
} from "@/lib/server/auth-actions"

/**
 * Server Action: Check if email/phone is available
 * Called from client form submission
 * Executes securely on server, no API exposure
 */
export async function checkAvailabilityAction(identifier: string) {
  console.log("[v0] Server Action: Checking availability")

  try {
    const result = await checkIdentifierAvailability(identifier)
    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error("[v0] Server Action: Availability check failed:", error.message)
    return {
      success: false,
      error: error.message || "Failed to check availability",
    }
  }
}

/**
 * Server Action: Login user
 * Stores token in HTTP-only cookie automatically
 * Redirects on success
 */
export async function loginAction(identifier: string, password: string) {
  console.log("[v0] Server Action: Login")

  try {
    const result = await performLogin(identifier, password)

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Login failed",
        requiresVerification: result.requiresVerification,
      }
    }

    // Redirect on successful login
    console.log("[v0] Server Action: Login successful, redirecting to home")
    redirect("/")
  } catch (error: any) {
    console.error("[v0] Server Action: Login error:", error.message)
    return {
      success: false,
      error: error.message || "Login failed",
    }
  }
}

/**
 * Server Action: Register new user
 * Returns user ID for verification step
 */
export async function registerAction(name: string, identifier: string, password: string) {
  console.log("[v0] Server Action: Register")

  try {
    const result = await performRegister(name, identifier, password)

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Registration failed",
      }
    }

    return {
      success: true,
      userId: result.userId,
      requiresVerification: result.requiresVerification,
    }
  } catch (error: any) {
    console.error("[v0] Server Action: Register error:", error.message)
    return {
      success: false,
      error: error.message || "Registration failed",
    }
  }
}

/**
 * Server Action: Verify email/phone code
 * Stores token in HTTP-only cookie on success
 * Redirects to home after verification
 */
export async function verifyAction(userId: string, code: string, isPhone: boolean = false) {
  console.log("[v0] Server Action: Verify code")

  try {
    const result = await performVerification(userId, code, isPhone)

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Verification failed",
      }
    }

    // Redirect on successful verification
    console.log("[v0] Server Action: Verification successful, redirecting to home")
    redirect("/")
  } catch (error: any) {
    console.error("[v0] Server Action: Verify error:", error.message)
    return {
      success: false,
      error: error.message || "Verification failed",
    }
  }
}

/**
 * Server Action: Resend verification code
 */
export async function resendVerificationAction(identifier: string) {
  console.log("[v0] Server Action: Resend verification")

  try {
    const result = await resendVerificationCode(identifier)

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to resend verification code",
      }
    }

    return {
      success: true,
    }
  } catch (error: any) {
    console.error("[v0] Server Action: Resend error:", error.message)
    return {
      success: false,
      error: error.message || "Failed to resend verification code",
    }
  }
}
