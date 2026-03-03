import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthSteps } from "@/components/auth/auth-steps"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - Mizizzi Store",
  description: "Sign in to your Mizizzi Store account",
}

// Server-side auth check - happens at the edge, not in browser
async function checkAuthStatus() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("mizizzi_token")?.value
    
    // If user has valid token, redirect immediately at the server level (edge redirect)
    if (token) {
      redirect("/")
    }
    
    return { isAuthenticated: false }
  } catch (error) {
    return { isAuthenticated: false }
  }
}

export default async function LoginPage() {
  // Server-side check happens here - blocks render until complete
  await checkAuthStatus()
  
  // Component renders only if not authenticated
  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Sign In</h1>
        <AuthSteps initialFlow="login" />
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-cherry-700 hover:text-cherry-800 font-semibold">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-cherry-700 hover:text-cherry-800 font-semibold">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}

