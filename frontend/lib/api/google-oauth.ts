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

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (callback?: (notification: any) => void) => void
          renderButton: (element: HTMLElement, config: any) => void
          cancel: () => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

export class GoogleOAuthAPI {
  private async makeRequest<T>(endpoint: string, options: RequestInit & { timeout?: number } = {}): Promise<T> {
    const token = getAuthToken()
    const timeoutMs = options.timeout || 60000
    delete options.timeout

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

        const error = new Error(
          errorData.message || errorData.msg || `HTTP error! status: ${response.status}`,
        ) as NetworkError
        error.statusCode = response.status

        console.error(`[v0] HTTP ${response.status} error at ${endpoint}:`, {
          statusCode: response.status,
          errorData,
          apiUrl: API_BASE_URL,
        })

        if (response.status >= 500) {
          error.code = "SERVER_UNAVAILABLE"
          error.message =
            errorData.message || errorData.msg || `Backend server error (${response.status}). Please try again.`
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
        const networkError = new Error(`Backend server is not responding. Please try again later.`) as NetworkError
        networkError.code = "NETWORK_ERROR"
        networkError.originalError = error
        console.error(`[v0] Network error connecting to ${API_BASE_URL}:`, error.message)
        throw networkError
      }

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
  async getGoogleConfig(options: { timeout?: number; retries?: number } = {}): Promise<GoogleConfigResponse> {
    const timeout = options.timeout || 45000
    const maxRetries = options.retries ?? 2
    let lastError: Error | null = null

    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[v0] Retrying getGoogleConfig (attempt ${attempt + 1}/${maxRetries + 1})...`)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(`${API_BASE_URL}/api/auth/google-config`, {
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const data = await response.json().catch(() => ({}))

        if (!response.ok || data.configured === false) {
          if (envClientId) {
            console.warn("[v0] Google OAuth not configured on server, using NEXT_PUBLIC_GOOGLE_CLIENT_ID")
            return {
              status: "success",
              client_id: envClientId,
              configured: true,
            }
          }

          console.warn("[v0] Google OAuth not configured on server:", data.message)
          return {
            status: "error",
            client_id: "",
            configured: false,
          }
        }

        if (!data.client_id) {
          if (envClientId) {
            console.warn("[v0] Server returned empty client_id, using NEXT_PUBLIC_GOOGLE_CLIENT_ID fallback")
            return {
              status: "success",
              client_id: envClientId,
              configured: true,
            }
          }

          console.warn("[v0] Server returned no client_id for Google OAuth")
          return {
            status: "error",
            client_id: "",
            configured: false,
          }
        }

        return {
          status: "success",
          client_id: data.client_id,
          configured: true,
        }
      } catch (error: any) {
        lastError = error
        console.warn(`[v0] getGoogleConfig attempt ${attempt + 1} failed:`, error.message)

        if (error.name === "AbortError") {
          if (attempt === maxRetries) {
            if (envClientId) {
              console.warn("[v0] Server timeout, falling back to NEXT_PUBLIC_GOOGLE_CLIENT_ID")
              return {
                status: "success",
                client_id: envClientId,
                configured: true,
              }
            }
            throw new Error("Server is taking too long to respond. Please try again in a moment.")
          }
          continue
        }

        if (
          (error as NetworkError).code &&
          (error as NetworkError).code !== "TIMEOUT" &&
          (error as NetworkError).code !== "NETWORK_ERROR"
        ) {
          throw error
        }
      }
    }

    if (lastError) {
      if (envClientId) {
        console.warn("[v0] All retries failed, falling back to NEXT_PUBLIC_GOOGLE_CLIENT_ID")
        return {
          status: "success",
          client_id: envClientId,
          configured: true,
        }
      }

      if ((lastError as NetworkError).code === "TIMEOUT") {
        throw new Error("Could not reach the authentication server. Please try again later.")
      }
      throw lastError
    }

    throw new Error("Failed to get Google config after retries")
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
      console.log("[v0] Token length:", googleToken.length)

      const response = await this.makeRequest<GoogleAuthResponse>("/api/auth/google-login", {
        method: "POST",
        body: JSON.stringify({ token: googleToken }),
      })

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

      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user))
        console.log("[v0] User data stored")
      }

      return response
    } catch (error: any) {
      console.error("[v0] Google login error:", error)
      const networkError = error as NetworkError

      if (networkError.code === "NETWORK_ERROR") {
        throw new Error(`Backend server is not responding. Please try again later.`)
      } else if (networkError.code === "SERVER_UNAVAILABLE") {
        throw new Error(error.message || `Backend server error. Please try again in a few moments.`)
      } else if (networkError.code === "TIMEOUT") {
        throw new Error("Google authentication request timed out. Please try again.")
      } else if (networkError.code === "VALIDATION_ERROR") {
        throw error
      }

      throw error
    }
  }

  /**
   * Link Google account to existing user account
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
   * Get Google Sign-In token using Google's One Tap flow
   */
  async getGoogleToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log("[v0] Getting Google token")

      const initializeAuth = async () => {
        try {
          const config = await this.getGoogleConfig()

          if (!config.configured || !config.client_id) {
            reject(new Error("Google Sign-In is not available. Please contact support."))
            return
          }

          const clientId = config.client_id
          console.log("[v0] Initializing Google Sign-In with clientId:", clientId.substring(0, 20) + "...")

          if (!window.google?.accounts?.id) {
            reject(new Error("Google Sign-In library not loaded correctly"))
            return
          }

          // Initialize with callback
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              console.log("[v0] Google callback received")
              if (response.credential) {
                console.log("[v0] Credential received, token length:", response.credential.length)
                resolve(response.credential)
              } else {
                console.log("[v0] No credential in response")
                reject(new Error("No credential received from Google"))
              }
            },
            auto_select: false,
            cancel_on_tap_outside: false,
            itp_support: true, // Support Intelligent Tracking Prevention
          })

          console.log("[v0] Using Google One Tap prompt")

          // Try One Tap first
          window.google.accounts.id.prompt((notification: any) => {
            console.log("[v0] One Tap notification received")

            if (notification.isNotDisplayed()) {
              const reason = notification.getNotDisplayedReason()
              console.log("[v0] One Tap not displayed, reason:", reason)

              // Fall back to button for these cases
              if (
                reason === "opt_out_or_no_session" ||
                reason === "suppressed_by_user" ||
                reason === "unknown_reason"
              ) {
                this.showGoogleSignInButton(resolve, reject, clientId)
              } else if (reason === "browser_not_supported") {
                reject(new Error("Your browser doesn't support Google Sign-In. Please try a different browser."))
              } else {
                this.showGoogleSignInButton(resolve, reject, clientId)
              }
            } else if (notification.isSkippedMoment()) {
              const reason = notification.getSkippedReason()
              console.log("[v0] One Tap skipped, reason:", reason)
              this.showGoogleSignInButton(resolve, reject, clientId)
            } else if (notification.isDismissedMoment()) {
              const reason = notification.getDismissedReason()
              console.log("[v0] One Tap dismissed, reason:", reason)
              if (reason === "credential_returned") {
                // Success - callback will handle it
                console.log("[v0] Credential returned via One Tap")
              } else {
                this.showGoogleSignInButton(resolve, reject, clientId)
              }
            }
          })
        } catch (error) {
          console.error("[v0] Error initializing Google auth:", error)
          reject(error instanceof Error ? error : new Error("Failed to initialize Google Sign-In"))
        }
      }

      // Load Google Sign-In script if not already loaded
      if (!window.google) {
        console.log("[v0] Loading Google Sign-In script")
        const script = document.createElement("script")
        script.src = "https://accounts.google.com/gsi/client"
        script.async = true
        script.defer = true
        script.onload = () => {
          console.log("[v0] Google Sign-In script loaded")
          initializeAuth()
        }
        script.onerror = () => {
          console.error("[v0] Failed to load Google Sign-In library")
          reject(new Error("Failed to load Google Sign-In library"))
        }
        document.head.appendChild(script)
      } else {
        console.log("[v0] Google Sign-In script already loaded")
        initializeAuth()
      }
    })
  }

  private showGoogleSignInButton(
    resolve: (token: string) => void,
    reject: (error: Error) => void,
    clientId: string,
  ): void {
    console.log("[v0] Showing Google Sign-In button as fallback")

    // Remove any existing overlay
    const existingOverlay = document.getElementById("google-signin-overlay")
    if (existingOverlay) {
      existingOverlay.remove()
    }

    // Create overlay modal
    const overlay = document.createElement("div")
    overlay.id = "google-signin-overlay"
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `

    const modal = document.createElement("div")
    modal.style.cssText = `
      background: white;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      text-align: center;
      max-width: 400px;
      width: 90%;
    `

    const title = document.createElement("h3")
    title.textContent = "Sign in with Google"
    title.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    `

    const subtitle = document.createElement("p")
    subtitle.textContent = "Click the button below to continue"
    subtitle.style.cssText = `
      margin: 0 0 24px 0;
      font-size: 14px;
      color: #6b7280;
    `

    const buttonContainer = document.createElement("div")
    buttonContainer.id = "google-signin-button-fallback"
    buttonContainer.style.cssText = `
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    `

    const cancelBtn = document.createElement("button")
    cancelBtn.textContent = "Cancel"
    cancelBtn.style.cssText = `
      padding: 8px 24px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      color: #374151;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
    `
    cancelBtn.onmouseover = () => {
      cancelBtn.style.background = "#f3f4f6"
    }
    cancelBtn.onmouseout = () => {
      cancelBtn.style.background = "white"
    }
    cancelBtn.onclick = () => {
      overlay.remove()
      reject(new Error("Sign-in cancelled by user"))
    }

    modal.appendChild(title)
    modal.appendChild(subtitle)
    modal.appendChild(buttonContainer)
    modal.appendChild(cancelBtn)
    overlay.appendChild(modal)
    document.body.appendChild(overlay)

    // Re-initialize Google for this button
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          console.log("[v0] Google button callback received")
          overlay.remove()
          if (response.credential) {
            resolve(response.credential)
          } else {
            reject(new Error("No credential received from Google"))
          }
        },
      })

      // Render the button
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "rectangular",
        text: "signin_with",
        width: 280,
      })
    }
  }

  /**
   * Complete Google OAuth flow: get token and login
   */
  async authenticateWithGoogle(): Promise<GoogleAuthResponse> {
    try {
      console.log("[v0] Starting Google OAuth flow")

      const googleToken = await this.getGoogleToken()

      console.log("[v0] Got Google token, authenticating with backend")

      const response = await this.loginWithGoogle(googleToken)

      console.log("[v0] Google authentication successful")

      // Clean up any overlays
      const overlay = document.getElementById("google-signin-overlay")
      if (overlay) {
        overlay.remove()
      }

      return response
    } catch (error) {
      console.error("[v0] Google authentication flow error:", error)

      // Clean up any overlays on error
      const overlay = document.getElementById("google-signin-overlay")
      if (overlay) {
        overlay.remove()
      }

      throw error
    }
  }

  /**
   * Check server health
   */
  async checkServerHealth(): Promise<{ available: boolean; message: string }> {
    try {
      console.log(`[v0] Checking server health at ${API_BASE_URL}`)
      const config = await this.makeRequest<GoogleConfigResponse>("/api/auth/google-config", {
        timeout: 10000,
      })

      return {
        available: true,
        message: config.configured
          ? `Backend server is running. Google OAuth is configured.`
          : `Backend server is running. Google OAuth needs configuration.`,
      }
    } catch (error: any) {
      const networkError = error as NetworkError
      if (networkError.code === "NETWORK_ERROR") {
        return {
          available: false,
          message: `Backend server is not responding.`,
        }
      }
      if (networkError.statusCode === 401 || networkError.statusCode === 403) {
        return {
          available: true,
          message: `Backend server is running.`,
        }
      }
      if (networkError.code === "TIMEOUT") {
        return {
          available: false,
          message: `Backend server is not responding (timeout).`,
        }
      }
      return {
        available: false,
        message: `Backend server error: ${error.message}`,
      }
    }
  }
}

// Export singleton instance
export const googleOAuthAPI = new GoogleOAuthAPI()
