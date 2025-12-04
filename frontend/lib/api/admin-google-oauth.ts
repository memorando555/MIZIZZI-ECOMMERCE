import { getAuthToken } from "../auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

const ALLOWED_ADMIN_EMAILS = [
  "info.contactgilbertdev@gmail.com",
  // Add more admin emails here as needed
]

export interface AdminGoogleAuthResponse {
  status: "success" | "error"
  message: string
  user?: {
    id: string
    email: string
    name: string
    google_id?: string
    profile_picture?: string
    role: string
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

class AdminGoogleOAuthAPI {
  private isAllowedAdminEmail(email: string): boolean {
    return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase())
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit & { timeout?: number } = {}): Promise<T> {
    const token = getAuthToken()
    const timeoutMs = options.timeout || 30000
    delete options.timeout

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out. Please check your connection and try again.")
      }
      throw error
    }
  }

  async getGoogleConfig(options: { timeout?: number } = {}): Promise<GoogleConfigResponse> {
    const timeout = options.timeout || 10000
    return await this.makeRequest<GoogleConfigResponse>("/api/auth/google-config", { timeout })
  }

  async loginWithGoogle(googleToken: string): Promise<AdminGoogleAuthResponse> {
    try {
      if (!googleToken || !googleToken.trim()) {
        throw new Error("Google token is required")
      }

      console.log("[v0] Admin: Sending Google token to backend for authentication")

      const response = await this.makeRequest<AdminGoogleAuthResponse>("/api/admin/auth/google-login", {
        method: "POST",
        body: JSON.stringify({ token: googleToken }),
      })

      if (response.user && response.user.role !== "admin") {
        throw new Error("You don't have admin privileges to access this area")
      }

      if (response.user && !this.isAllowedAdminEmail(response.user.email)) {
        throw new Error("This email is not authorized for admin access")
      }

      // Store admin tokens
      if (response.access_token) {
        localStorage.setItem("admin_token", response.access_token)
        localStorage.setItem("mizizzi_token", response.access_token)
        console.log("[v0] Admin access token stored")
      }

      if (response.refresh_token) {
        localStorage.setItem("admin_refresh_token", response.refresh_token)
        localStorage.setItem("mizizzi_refresh_token", response.refresh_token)
        console.log("[v0] Admin refresh token stored")
      }

      if (response.csrf_token) {
        localStorage.setItem("mizizzi_csrf_token", response.csrf_token)
        console.log("[v0] CSRF token stored")
      }

      // Store admin user data
      if (response.user) {
        localStorage.setItem("admin_user", JSON.stringify(response.user))
        console.log("[v0] Admin user data stored")
      }

      return response
    } catch (error: any) {
      console.error("[v0] Admin Google login error:", error)
      throw error
    }
  }

  async getGoogleToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log("[v0] Getting Google token for admin login")

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
      const config = await this.getGoogleConfig()

      if (!config.configured || !config.client_id) {
        console.error("[v0] Google OAuth not configured on server")
        reject(new Error("Google OAuth is not configured. Please contact support."))
        return
      }

      const clientId = config.client_id

      console.log("[v0] Initializing Google Sign-In for admin with clientId:", clientId.substring(0, 20) + "...")

      if (!window.google?.accounts?.id) {
        reject(new Error("Google Sign-In library not loaded correctly"))
        return
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          console.log("[v0] Google callback received for admin")
          if (response.credential) {
            console.log("[v0] Credential received, resolving with token")
            resolve(response.credential)
          } else {
            console.log("[v0] No credential in response")
            reject(new Error("No credential received from Google"))
          }
        },
      })

      console.log("[v0] Creating button container for admin")

      const container = document.createElement("div")
      container.id = "google-signin-button-container-admin"
      container.style.display = "none"
      document.body.appendChild(container)

      console.log("[v0] Rendering Google Sign-In button for admin")

      if (!window.google?.accounts?.id) {
        reject(new Error("Lost connection to Google Sign-In library"))
        return
      }

      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        type: "standard",
      })

      console.log("[v0] Looking for button to click")

      setTimeout(() => {
        const button = container.querySelector("div[role='button']") as HTMLElement | null
        if (button) {
          console.log("[v0] Triggering Google Sign-In button click for admin")
          button.click()
        } else {
          const fallbackButton = container.querySelector("button") as HTMLButtonElement | null
          if (fallbackButton) {
            console.log("[v0] Triggering Google Sign-In button click (fallback) for admin")
            fallbackButton.click()
          } else {
            console.error("[v0] Failed to find Google Sign-In button")
            console.log("[v0] Container contents:", container.innerHTML)
            reject(new Error("Failed to render Google Sign-In button"))
          }
        }
      }, 500)
    } catch (error) {
      console.error("[v0] Error in initializeGoogleSignIn:", error)
      reject(error instanceof Error ? error : new Error("Failed to initialize Google Sign-In"))
    }
  }

  async authenticateWithGoogle(): Promise<AdminGoogleAuthResponse> {
    try {
      console.log("[v0] Starting Admin Google OAuth flow")

      const googleToken = await this.getGoogleToken()

      console.log("[v0] Got Google token, authenticating admin with backend")

      const response = await this.loginWithGoogle(googleToken)

      console.log("[v0] Admin Google authentication successful")

      return response
    } catch (error) {
      console.error("[v0] Admin Google authentication flow error:", error)
      throw error
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

export { AdminGoogleOAuthAPI }
export const adminGoogleOAuthAPI = new AdminGoogleOAuthAPI()
