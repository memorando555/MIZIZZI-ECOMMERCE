/**
 * Token Validator Utility
 * Efficiently validates token existence and provides clear feedback
 */

export interface TokenValidationResult {
  isValid: boolean
  tokenType: "access" | "refresh" | "none"
  message: string
  shouldRetry: boolean
}

/**
 * Check if a token exists and is valid
 */
export function validateTokenExists(token: string | null | undefined): boolean {
  return !!(token && token !== "null" && token !== "undefined" && token.length > 0)
}

/**
 * Decode JWT token safely without verification
 */
export function decodeToken(token: string): Record<string, any> | null {
  try {
    if (!validateTokenExists(token)) {
      return null
    }

    const parts = token!.split(".")
    if (parts.length !== 3) {
      console.warn("[v0] Invalid token format - expected 3 parts")
      return null
    }

    const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString())
    return decoded
  } catch (error) {
    console.warn("[v0] Failed to decode token:", error)
    return null
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded?.exp) return true

  const expirationTime = decoded.exp * 1000
  const currentTime = Date.now()
  return expirationTime < currentTime
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpirationSeconds(token: string): number | null {
  const decoded = decodeToken(token)
  if (!decoded?.exp) return null

  const expirationTime = decoded.exp * 1000
  const currentTime = Date.now()
  return Math.floor((expirationTime - currentTime) / 1000)
}

/**
 * Validate login response and check for required tokens
 */
export function validateLoginResponse(response: any): TokenValidationResult {
  // Check if we got an access token
  if (!response?.access_token) {
    return {
      isValid: false,
      tokenType: "none",
      message: "Server did not return an authentication token. This might mean your account hasn't been fully verified yet, or there was an issue with the server.",
      shouldRetry: false,
    }
  }

  // Check if token is valid
  if (!validateTokenExists(response.access_token)) {
    return {
      isValid: false,
      tokenType: "none",
      message: "Received an invalid authentication token from the server. Please try logging in again.",
      shouldRetry: true,
    }
  }

  // Check if token is already expired
  if (isTokenExpired(response.access_token)) {
    return {
      isValid: false,
      tokenType: "access",
      message: "The authentication token has already expired. Please log in again.",
      shouldRetry: true,
    }
  }

  return {
    isValid: true,
    tokenType: "access",
    message: "Login successful",
    shouldRetry: false,
  }
}

/**
 * Check authentication status and provide feedback
 */
export function checkAuthStatus(): {
  isAuthenticated: boolean
  hasValidToken: boolean
  tokenExpiration: number | null
  feedback: string
} {
  const token = typeof window !== "undefined" ? localStorage.getItem("mizizzi_token") : null

  if (!validateTokenExists(token)) {
    return {
      isAuthenticated: false,
      hasValidToken: false,
      tokenExpiration: null,
      feedback: "No authentication token found. Please log in.",
    }
  }

  if (isTokenExpired(token!)) {
    return {
      isAuthenticated: false,
      hasValidToken: false,
      tokenExpiration: null,
      feedback: "Your login session has expired. Please log in again.",
    }
  }

  const expirationSeconds = getTokenExpirationSeconds(token!)

  return {
    isAuthenticated: true,
    hasValidToken: true,
    tokenExpiration: expirationSeconds,
    feedback: `Authenticated. Session expires in ${expirationSeconds ? Math.floor(expirationSeconds / 60) : "unknown"} minutes.`,
  }
}

/**
 * Clear all authentication tokens
 */
export function clearAuthTokens(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("mizizzi_token")
    localStorage.removeItem("mizizzi_refresh_token")
    localStorage.removeItem("mizizzi_csrf_token")
    localStorage.removeItem("user")
    localStorage.removeItem("auth_verification_state")
  }
}
