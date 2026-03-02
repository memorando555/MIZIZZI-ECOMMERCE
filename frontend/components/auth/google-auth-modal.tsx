"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, X, Shield, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import { GoogleOAuthAPI } from "@/lib/api/google-oauth"
import { useAuth } from "@/contexts/auth/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface GoogleAuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: "signup" | "signin"
}

export function GoogleAuthModal({ isOpen, onClose, mode = "signup" }: GoogleAuthModalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const { refreshAuthState } = useAuth()
  const router = useRouter()
  const googleOAuth = new GoogleOAuthAPI()

  // Reset status when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus("idle")
      setErrorMessage("")
    }
  }, [isOpen])

  const handleGoogleAuth = async () => {
    setStatus("loading")
    setErrorMessage("")

    try {
      console.log("[v0] Starting Google OAuth flow from modal...")

      const result = await googleOAuth.authenticateWithGoogle()

      console.log("[v0] Google OAuth successful:", result)

      // Refresh auth state
      await refreshAuthState()

      setStatus("success")

      toast({
        title: result.is_new_user ? "Welcome to MIZIZZI!" : "Welcome back!",
        description: result.is_new_user
          ? "Your account has been created successfully."
          : "You've successfully signed in.",
      })

      // Close modal and redirect after brief success animation
      setTimeout(() => {
        onClose()
        router.push("/")
      }, 1500)
    } catch (error) {
      console.error("[v0] Google auth error:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong with Google sign-in")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white via-cherry-50/30 to-white border-2 border-cherry-200/50 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-playfair text-cherry-900">
              {mode === "signup" ? "Create Your Account" : "Welcome Back"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-gray-600">
            {mode === "signup"
              ? "Join MIZIZZI and discover luxury fashion"
              : "Sign in to continue your shopping experience"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Benefits Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-cherry-100 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-cherry-100 rounded-lg">
                      <Shield className="h-4 w-4 text-cherry-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">Secure & Fast</h4>
                      <p className="text-xs text-gray-600">Your data is protected with enterprise-grade security</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-cherry-100 rounded-lg">
                      <Sparkles className="h-4 w-4 text-cherry-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">Instant Access</h4>
                      <p className="text-xs text-gray-600">
                        {mode === "signup" ? "Create your account in seconds" : "Sign in with one click"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Google Sign-In Button */}
                <Button
                  onClick={handleGoogleAuth}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-cherry-400 shadow-md hover:shadow-lg transition-all duration-300 group"
                  variant="outline"
                >
                  <motion.div
                    className="flex items-center justify-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
                    <span className="font-semibold">
                      {mode === "signup" ? "Continue with Google" : "Sign in with Google"}
                    </span>
                  </motion.div>
                </Button>

                <p className="text-xs text-center text-gray-500 px-4">
                  By continuing, you agree to MIZIZZI's Terms of Service and Privacy Policy
                </p>
              </motion.div>
            )}

            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="p-4 bg-cherry-100 rounded-full"
                >
                  <Loader2 className="h-8 w-8 text-cherry-600" />
                </motion.div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg text-gray-900">Connecting to Google</h3>
                  <p className="text-sm text-gray-600">Please complete the sign-in process...</p>
                </div>
                <motion.div
                  className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-cherry-400 via-cherry-600 to-cherry-400"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                </motion.div>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="p-4 bg-green-100 rounded-full"
                >
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </motion.div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-xl text-gray-900">Success!</h3>
                  <p className="text-sm text-gray-600">Redirecting you to MIZIZZI...</p>
                </div>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Authentication Failed</h4>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
                <Button onClick={handleGoogleAuth} className="w-full bg-transparent" variant="outline">
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
