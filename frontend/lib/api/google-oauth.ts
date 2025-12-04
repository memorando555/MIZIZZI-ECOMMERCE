import { getAuthToken } from "../auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

export interface GoogleAuthResponse {
  status: "success" | "error"
  message: string
  user?: {
    id: string
    email: string
    name: string
    google_id?: string
    profile_picture?: string
  }
  access_token?: string
  refresh_token?: string
  csrf_token?: string
  is_new_user?: boolean
}

export interface GoogleConfigResponse {
  status: "success" | "error"
  client_id: string
  configured: boolean
}

export interface GoogleLinkResponse {
  status: "success" | "error"
  message: string
  linked: boolean
}

export interface GoogleStatusResponse {
  status: "success" | "error"
  google_linked: boolean
  google_email?: string
  linked_at?: string
}

interface NetworkError extends Error {
  code: "NETWORK_ERROR" | "SERVER_UNAVAILABLE" | "TIMEOUT" | "API_ERROR" | "VALIDATION_ERROR" | "AUTH_ERROR"
  originalError?: Error
  statusCode?: number
}

class GoogleOAuthAPI {
  private async makeRequest<T>(endpoint: string, options: RequestInit & { timeout?: number } = {}): Promise<T> {
    const token = getAuthToken()
    const timeoutMs = options.timeout || 30000 // Default 30 second timeout
    delete options.timeout // Remove timeout from options to avoid fetch error

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.warn(`[v0] Request to ${endpoint} timed out after ${timeoutMs}ms`)
      }, timeoutMs)

      console.log(`[v0] Making request to ${API_BASE_URL}${endpoint}`)
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`) as NetworkError
        error.statusCode = response.status

        console.error(`[v0] HTTP ${response.status} error at ${endpoint}:`, {
          statusCode: response.status,
          errorData,
          apiUrl: API_BASE_URL,
        })

        if (response.status >= 500) {
          error.code = "SERVER_UNAVAILABLE"
          error.message = `Backend server error (${response.status}). Please ensure the backend is running at ${API_BASE_URL}`
        } else if (response.status === 400) {
          error.code = "VALIDATION_ERROR"
        } else if (response.status === 401 || response.status === 403) {
          error.code = "AUTH_ERROR"
        } else {
          error.code = "API_ERROR"
        }
        throw error
      }

      const data = await response.json()
      console.log(`[v0] Request successful to ${endpoint}`)
      return data
    } catch (error: any) {
      if (error.name === "AbortError") {
        const timeoutError = new Error("Request timed out. Please check your connection and try again.") as NetworkError
        timeoutError.code = "TIMEOUT"
        console.error(`[v0] Request timeout to ${endpoint}`)
        throw timeoutError
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkError = new Error(
          `Backend server is not responding at ${API_BASE_URL}. Make sure your backend server is running.\n\nIf you haven't started the backend yet, please run: npm run dev:backend`,
        ) as NetworkError
        networkError.code = "NETWORK_ERROR"
        networkError.originalError = error
        console.error(`[v0] Network error connecting to ${API_BASE_URL}:`, error.message)
        throw networkError
      }

      // Re-throw NetworkError instances
      if ((error as NetworkError).code) {
        throw error
      }

      const genericError = new Error(`Unexpected error: ${error.message}`) as NetworkError
      genericError.code = "API_ERROR"
      genericError.originalError = error
      console.error(`[v0] Unexpected error in makeRequest:`, error)
      throw genericError
    }
  }

  /**
   * Get Google OAuth configuration from backend
   */
  async getGoogleConfig(options: { timeout?: number } = {}): Promise<GoogleConfigResponse> {
    try {
      const timeout = options.timeout || 10000 // 10 seconds default for config
      return await this.makeRequest<GoogleConfigResponse>("/api/auth/google-config", { timeout })
    } catch (error) {
      console.error("[v0] Error getting Google config:", error)
      // Add more context to timeout errors
      if ((error as NetworkError).code === "TIMEOUT") {
        throw new Error(
          "Could not reach the authentication server. Please ensure the backend server is running and try again.",
        )
      }
      throw error
    }
  }

  /**
   * Login or register with Google OAuth token
   * @param googleToken - The Google ID token from Google Sign-In
   */
  async loginWithGoogle(googleToken: string): Promise<GoogleAuthResponse> {
    try {
      if (!googleToken || !googleToken.trim()) {
        const error = new Error("Google token is required") as NetworkError
        error.code = "VALIDATION_ERROR"
        throw error
      }

      console.log("[v0] Sending Google token to backend for authentication")

      const response = await this.makeRequest<GoogleAuthResponse>("/api/auth/google-login", {
        method: "POST",
        body: JSON.stringify({ token: googleToken }),
      })

      // Store tokens in localStorage if provided
      if (response.access_token) {
        localStorage.setItem("mizizzi_token", response.access_token)
        console.log("[v0] Access token stored")
      }

      if (response.refresh_token) {
        localStorage.setItem("mizizzi_refresh_token", response.refresh_token)
        console.log("[v0] Refresh token stored")
      }

      if (response.csrf_token) {
        localStorage.setItem("mizizzi_csrf_token", response.csrf_token)
        console.log("[v0] CSRF token stored")
      }

      // Store user data
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user))
        console.log("[v0] User data stored")
      }

      return response
    } catch (error: any) {
      console.error("[v0] Google login error:", error)
      const networkError = error as NetworkError

      if (networkError.code === "NETWORK_ERROR") {
        throw new Error(
          `Backend server is not responding at ${API_BASE_URL}.\n\nPlease ensure:\n1. Backend server is running\n2. NEXT_PUBLIC_API_URL environment variable is set correctly\n3. Network connectivity is available`,
        )
      } else if (networkError.code === "SERVER_UNAVAILABLE") {
        throw new Error(
          `Backend server returned error (${networkError.statusCode}). Please try again in a few moments.`,
        )
      } else if (networkError.code === "TIMEOUT") {
        throw new Error("Google authentication request timed out. Please check your connection and try again.")
      } else if (networkError.code === "VALIDATION_ERROR") {
        throw error
      }

      throw error
    }
  }

  /**
   * Link Google account to existing user account
   * Requires authentication
   */
  async linkGoogleAccount(googleToken: string): Promise<GoogleLinkResponse> {
    try {
      if (!googleToken || !googleToken.trim()) {
        const error = new Error("Google token is required") as NetworkError
        error.code = "VALIDATION_ERROR"
        throw error
      }

      const token = getAuthToken()
      if (!token) {
        const error = new Error("You must be logged in to link a Google account") as NetworkError
        error.code = "AUTH_ERROR"
        throw error
      }

      return await this.makeRequest<GoogleLinkResponse>("/api/auth/link-google", {
        method: "POST",
        body: JSON.stringify({ token: googleToken }),
      })
    } catch (error) {
      console.error("[v0] Error linking Google account:", error)
      throw error
    }
  }

  /**
   * Unlink Google account from user account
   * Requires authentication
   */
  async unlinkGoogleAccount(): Promise<GoogleLinkResponse> {
    try {
      const token = getAuthToken()
      if (!token) {
        const error = new Error("You must be logged in to unlink a Google account") as NetworkError
        error.code = "AUTH_ERROR"
        throw error
      }

      return await this.makeRequest<GoogleLinkResponse>("/api/auth/unlink-google", {
        method: "POST",
      })
    } catch (error) {
      console.error("[v0] Error unlinking Google account:", error)
      throw error
    }
  }

  /**
   * Get Google account linking status
   * Requires authentication
   */
  async getGoogleStatus(): Promise<GoogleStatusResponse> {
    try {
      const token = getAuthToken()
      if (!token) {
        const error = new Error("You must be logged in to check Google status") as NetworkError
        error.code = "AUTH_ERROR"
        throw error
      }

      return await this.makeRequest<GoogleStatusResponse>("/api/auth/google-status")
    } catch (error) {
      console.error("[v0] Error getting Google status:", error)
      throw error
    }
  }

  /**
   * Logout from Google OAuth session
   * Requires authentication
   */
  async logoutGoogle(): Promise<{ status: string; message: string }> {
    try {
      const token = getAuthToken()
      if (!token) {
        const error = new Error("You must be logged in to logout") as NetworkError
        error.code = "AUTH_ERROR"
        throw error
      }

      const response = await this.makeRequest<{ status: string; message: string }>("/api/auth/google-logout", {
        method: "POST",
      })

      // Clear tokens from localStorage
      localStorage.removeItem("mizizzi_token")
      localStorage.removeItem("mizizzi_refresh_token")
      localStorage.removeItem("mizizzi_csrf_token")
      localStorage.removeItem("user")

      return response
    } catch (error) {
      console.error("[v0] Error logging out from Google:", error)
      throw error
    }
  }

  /**
   * Get Google Sign-In token using Google's library
   */
  async getGoogleToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log("[v0] Getting Google token")

      // Load Google Sign-In script if not already loaded
      if (!window.google) {
        console.log("[v0] Loading Google Sign-In script")
        const script = document.createElement("script")
        script.src = "https://accounts.google.com/gsi/client"
        script.async = true
        script.defer = true
        script.onload = () => {
          console.log("[v0] Google Sign-In script loaded")
          this.initializeGoogleSignIn(resolve, reject)
        }
        script.onerror = () => {
          console.error("[v0] Failed to load Google Sign-In library")
          reject(new Error("Failed to load Google Sign-In library"))
        }
        document.head.appendChild(script)
      } else {
        console.log("[v0] Google Sign-In script already loaded")
        this.initializeGoogleSignIn(resolve, reject)
      }
    })
  }

  private async initializeGoogleSignIn(
    resolve: (token: string) => void,
    reject: (error: Error) => void,
  ): Promise<void> {
    try {
      // Get client ID from backend config with shorter timeout
      const config = await this.getGoogleConfig()

      if (!config.configured || !config.client_id) {
        console.error("[v0] Google OAuth not configured on server")
        reject(new Error("Google OAuth is not configured. Please contact support."))
        return
      }

      const clientId = config.client_id

      console.log("[v0] Initializing Google Sign-In with clientId:", clientId.substring(0, 20) + "...")

      // Ensure google object exists
      if (!window.google?.accounts?.id) {
        reject(new Error("Google Sign-In library not loaded correctly"))
        return
      }

      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          console.log("[v0] Google callback received")
          if (response.credential) {
            console.log("[v0] Credential received, resolving with token")
            resolve(response.credential)
          } else {
            console.log("[v0] No credential in response")
            reject(new Error("No credential received from Google"))
          }
        },
      })

      console.log("[v0] Creating button container")

      // Create a container for the button
      const container = document.createElement("div")
      container.id = "google-signin-button-container"
      container.style.display = "none"
      document.body.appendChild(container)

      console.log("[v0] Rendering Google Sign-In button")

      // Double-check google object still exists
      if (!window.google?.accounts?.id) {
        reject(new Error("Lost connection to Google Sign-In library"))
        return
      }

      // Render the Google Sign-In button
      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        type: "standard",
      })

      console.log("[v0] Looking for button to click")

      // Wait a short moment for the button to be rendered
      setTimeout(() => {
        const button = container.querySelector("div[role='button']") as HTMLElement | null
        if (button) {
          console.log("[v0] Triggering Google Sign-In button click")
          button.click()
        } else {
          // Try one more time with a different selector
          const fallbackButton = container.querySelector("button") as HTMLButtonElement | null
          if (fallbackButton) {
            console.log("[v0] Triggering Google Sign-In button click (fallback)")
            fallbackButton.click()
          } else {
            console.error("[v0] Failed to find Google Sign-In button")
            console.log("[v0] Container contents:", container.innerHTML)
            reject(new Error("Failed to render Google Sign-In button"))
          }
        }
      }, 500) // Wait 500ms for the button to be rendered
    } catch (error) {
      console.error("[v0] Error in initializeGoogleSignIn:", error)
      reject(error instanceof Error ? error : new Error("Failed to initialize Google Sign-In"))
    }
  }

  /**
   * Complete Google OAuth flow: get token and login
   */
  async authenticateWithGoogle(): Promise<GoogleAuthResponse> {
    try {
      console.log("[v0] Starting Google OAuth flow")

      // Get Google token
      const googleToken = await this.getGoogleToken()

      console.log("[v0] Got Google token, authenticating with backend")

      // Login with the token
      const response = await this.loginWithGoogle(googleToken)

      console.log("[v0] Google authentication successful")

      return response
    } catch (error) {
      console.error("[v0] Google authentication flow error:", error)
      throw error
    }
  }

  /**
   * Check server health using the Google OAuth config endpoint
   * This endpoint is public and doesn't require authentication
   */
  async checkServerHealth(): Promise<{ available: boolean; message: string }> {
    try {
      console.log(`[v0] Checking server health at ${API_BASE_URL}`)
      // Use the Google OAuth config endpoint since it's public
      const config = await this.makeRequest<GoogleConfigResponse>("/api/auth/google-config", {
        timeout: 5000, // Use a short timeout for health check
      })

      return {
        available: true,
        message: config.configured
          ? `Backend server is running and ready at ${API_BASE_URL}\nGoogle OAuth is configured`
          : `Backend server is running at ${API_BASE_URL}\nWarning: Google OAuth is not configured on the server`,
      }
    } catch (error: any) {
      const networkError = error as NetworkError
      if (networkError.code === "NETWORK_ERROR") {
        return {
          available: false,
          message: `❌ Backend server is NOT responding at ${API_BASE_URL}\n\nTo fix this:\n1. Make sure your backend server is running\n2. Check that NEXT_PUBLIC_API_URL=${API_BASE_URL} is correct\n3. Verify network connectivity\n\nError: ${error.message}`,
        }
      }
      if (networkError.statusCode === 401 || networkError.statusCode === 403) {
        return {
          available: true,
          message: `Backend server is running at ${API_BASE_URL}\nNote: Authentication endpoints are protected`,
        }
      }
      if (networkError.code === "TIMEOUT") {
        return {
          available: false,
          message: `Backend server at ${API_BASE_URL} is not responding (timeout)\n\nPossible causes:\n1. Server is overloaded\n2. Network latency is too high\n3. Server is not running`,
        }
      }
      return {
        available: false,
        message: `Backend server check failed at ${API_BASE_URL}\nError: ${error.message}`,
      }
    }
  }
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (callback?: (notification: any) => void) => void
          renderButton: (element: HTMLElement, config: any) => void
        }
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void
          }
        }
      }
    }
  }
}

export { GoogleOAuthAPI }
export const googleOAuthAPI = new GoogleOAuthAPI()
