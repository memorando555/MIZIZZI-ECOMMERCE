'use client'

import { serverCheckAvailability, serverLogin, serverRegister, serverSendVerificationCode, serverVerifyCode, serverLogout } from '@/lib/server/auth-actions'
import { useRouter } from 'next/navigation'

/**
 * Client-side wrapper for server actions
 * These functions call the server actions directly without the network hop of API routes
 * Server Actions are the fastest way to call server code from clients
 */

export async function callCheckAvailability(identifier: string) {
  console.log("[v0] Client Action: Checking availability for", identifier)
  try {
    const result = await serverCheckAvailability(identifier)
    console.log("[v0] Client Action: Availability result:", result)
    return result
  } catch (error: any) {
    console.error("[v0] Client Action: Check availability failed:", error.message)
    throw error
  }
}

export async function callLogin(identifier: string, password: string) {
  console.log("[v0] Client Action: Logging in with", identifier)
  try {
    const result = await serverLogin(identifier, password)
    if (result.success) {
      console.log("[v0] Client Action: Login successful")
      // Redirect will happen client-side after token is set in cookie
      return result
    } else {
      console.error("[v0] Client Action: Login failed:", result.error)
      throw new Error(result.error || 'Login failed')
    }
  } catch (error: any) {
    console.error("[v0] Client Action: Login error:", error.message)
    throw error
  }
}

export async function callRegister(name: string, email: string | undefined, phone: string | undefined, password: string) {
  console.log("[v0] Client Action: Registering new account")
  try {
    const result = await serverRegister(name, email, phone, password)
    if (result.success) {
      console.log("[v0] Client Action: Registration successful, userId:", result.userId)
      return result
    } else {
      console.error("[v0] Client Action: Registration failed:", result.error)
      throw new Error(result.error || 'Registration failed')
    }
  } catch (error: any) {
    console.error("[v0] Client Action: Registration error:", error.message)
    throw error
  }
}

export async function callSendVerificationCode(identifier: string, userId: string) {
  console.log("[v0] Client Action: Sending verification code for", identifier)
  try {
    const result = await serverSendVerificationCode(identifier, userId)
    if (result.success) {
      console.log("[v0] Client Action: Verification code sent")
      return result
    } else {
      console.error("[v0] Client Action: Send verification failed:", result.error)
      throw new Error(result.error || 'Failed to send verification code')
    }
  } catch (error: any) {
    console.error("[v0] Client Action: Send verification error:", error.message)
    throw error
  }
}

export async function callVerifyCode(userId: string, code: string, isPhone: boolean) {
  console.log("[v0] Client Action: Verifying code for user", userId)
  try {
    const result = await serverVerifyCode(userId, code, isPhone)
    if (result.success) {
      console.log("[v0] Client Action: Code verified successfully")
      return result
    } else {
      console.error("[v0] Client Action: Verification failed:", result.error)
      throw new Error(result.error || 'Verification failed')
    }
  } catch (error: any) {
    console.error("[v0] Client Action: Verification error:", error.message)
    throw error
  }
}

export async function callLogout() {
  console.log("[v0] Client Action: Logging out")
  try {
    await serverLogout()
    console.log("[v0] Client Action: Logout successful")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Client Action: Logout error:", error.message)
    throw error
  }
}
