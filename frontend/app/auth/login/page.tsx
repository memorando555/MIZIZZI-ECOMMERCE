import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthSteps } from "@/components/auth/auth-steps"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - Mizizzi Store",
  description: "Sign in to your Mizizzi Store account",
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Sign In</h1>
        {/* @ts-ignore */}
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

