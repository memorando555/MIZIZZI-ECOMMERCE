import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthSteps } from "@/components/auth/auth-steps"
import { getServerAuthStatus } from "@/lib/server/auth-actions"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - Mizizzi Store",
  description: "Sign in to your Mizizzi Store account",
}

export default async function LoginPage() {
  // Server-side auth check using new utility
  // This executes at edge level before any client rendering
  const authStatus = await getServerAuthStatus()

  // If user is already authenticated, redirect immediately (edge redirect - 300ms)
  if (authStatus.isAuthenticated) {
    console.log("[v0] Server: User already authenticated, redirecting to home")
    redirect("/")
  }

  // Component renders only if not authenticated
  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Sign In</h1>
        {/* Pass auth status as prop to avoid context re-initialization on client */}
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

