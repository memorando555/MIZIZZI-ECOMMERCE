"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth/auth-context"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { GoogleOAuthAPI } from "@/lib/api/google-oauth"
import { GoogleAuthModal } from "./google-auth-modal"

interface GoogleAuthButtonProps {
  mode?: "signup" | "signin"
  fullWidth?: boolean
  showAnimation?: boolean
}

export function GoogleAuthButton({ mode = "signup", fullWidth = false, showAnimation = true }: GoogleAuthButtonProps) {
  const { refreshAuthState } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const router = useRouter()
  const googleOAuth = new GoogleOAuthAPI()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    setStatus("loading")
    try {
      console.log("[v0] Starting Google OAuth flow...")

      const result = await googleOAuth.authenticateWithGoogle()

      console.log("[v0] Google OAuth successful:", result)

      // Refresh auth state to pick up the new tokens and user data
      await refreshAuthState()

      setStatus("success")

      toast({
        title: "Welcome!",
        description: `You've successfully signed in with Google.`,
      })

      // Brief success animation before redirect
      setTimeout(() => {
        router.push("/")
      }, 800)
    } catch (error) {
      console.error("[v0] Google auth error:", error)
      setStatus("error")
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Something went wrong with Google sign-in",
        variant: "destructive",
      })
      // Reset status after 2 seconds
      setTimeout(() => setStatus("idle"), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants for smooth transitions
  const containerVariants = {
    idle: { opacity: 1, scale: 1 },
    loading: { opacity: 1, scale: 0.98 },
    success: { opacity: 1, scale: 1.02 },
    error: { opacity: 1, x: [0, -8, 8, -8, 0] },
  }

  const contentVariants = {
    idle: { opacity: 1, y: 0 },
    loading: { opacity: 0.7, y: 2 },
    success: { opacity: 1, y: 0 },
    error: { opacity: 1, y: 0 },
  }

  const iconVariants = {
    idle: { rotate: 0, scale: 1 },
    loading: { rotate: 360, scale: 1 },
    success: { rotate: 0, scale: 1, y: -2 },
    error: { rotate: 0, scale: 1 },
  }

  return (
    <>
      <motion.div
        whileHover={status === "idle" ? { y: -2 } : {}}
        whileTap={status === "idle" ? { scale: 0.98 } : {}}
        className={fullWidth ? "w-full" : ""}
        animate={status}
        variants={containerVariants}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="outline"
          type="button"
          disabled={isLoading || status === "success"}
          onClick={() => setIsModalOpen(true)}
          className={`${
            fullWidth ? "w-full" : "w-full"
          } h-11 bg-white border-2 border-gray-200 hover:border-cherry-400 hover:bg-gray-50 hover:shadow-md font-medium text-sm transition-all duration-300 relative overflow-hidden group`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cherry-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <motion.div
            className="flex items-center justify-center gap-2 relative z-10"
            animate={status}
            variants={contentVariants}
            transition={{ duration: 0.2 }}
          >
            {status === "loading" ? (
              <>
                <motion.div
                  animate={status}
                  variants={iconVariants}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="h-4 w-4 text-cherry-600" />
                </motion.div>
                <span className="text-gray-700">{mode === "signup" ? "Creating account..." : "Signing in..."}</span>
              </>
            ) : status === "success" ? (
              <>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </motion.div>
                <span className="text-green-600 font-semibold">Success!</span>
              </>
            ) : status === "error" ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-600">Try again</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-gray-700 group-hover:text-cherry-900 transition-colors">
                  {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
                </span>
              </>
            )}
          </motion.div>
        </Button>

        {status === "loading" && (
          <motion.div
            className="mt-2 h-0.5 w-full bg-gradient-to-r from-transparent via-cherry-400 to-transparent rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          />
        )}
      </motion.div>

      <GoogleAuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} mode={mode} />
    </>
  )
}
