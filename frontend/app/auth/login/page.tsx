import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthSteps } from "@/components/auth/auth-steps"
import { serverIsAuthenticated } from "@/lib/server/auth-actions"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - Mizizzi Store",
  description: "Sign in to your Mizizzi Store account",
}

export default async function LoginPage() {
  // Server-side auth check using new server utilities
  // This executes at edge level before any client rendering (~50ms vs 2s client-side)
  const isAuthenticated = await serverIsAuthenticated()

  // If user is already authenticated, redirect immediately at server level
  if (isAuthenticated) {
    console.log("[v0] Server: User already authenticated, redirecting to home")
    redirect("/")
  }

  // Component renders only if not authenticated - no loading states needed
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

