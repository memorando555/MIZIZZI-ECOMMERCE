"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, X, Shield, Sparkles, AlertCircle, RefreshCw } from "lucide-react"
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
  const [errorDetails, setErrorDetails] = useState("")
  const { refreshAuthState } = useAuth()
  const router = useRouter()
  const googleOAuth = new GoogleOAuthAPI()

  useEffect(() => {
    if (isOpen) {
      setStatus("idle")
      setErrorMessage("")
      setErrorDetails("")
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      const overlay = document.getElementById("google-signin-overlay")
      if (overlay) {
        overlay.remove()
      }
    }
  }, [])

  const handleGoogleAuth = async () => {
    setStatus("loading")
    setErrorMessage("")
    setErrorDetails("")

    try {
      console.log("[v0] Starting Google OAuth flow from modal...")

      const result = await googleOAuth.authenticateWithGoogle()

      console.log("[v0] Google OAuth successful:", result)

      await refreshAuthState()

      setStatus("success")

      toast({
        title: result.is_new_user ? "Welcome to MIZIZZI!" : "Welcome back!",
        description: result.is_new_user
          ? "Your account has been created successfully."
          : "You've successfully signed in.",
      })

      setTimeout(() => {
        onClose()
        router.push("/")
      }, 1500)
    } catch (error) {
      console.error("[v0] Google auth error:", error)
      setStatus("error")

      let message = "Something went wrong with Google sign-in"
      let details = ""

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()

        if (errorMsg.includes("backend server") || errorMsg.includes("500")) {
          message = "Unable to connect to the authentication server"
          details = "The server may be starting up. Please wait a moment and try again."
        } else if (errorMsg.includes("failed to connect") || errorMsg.includes("network")) {
          message = "Connection failed"
          details = "Please check your internet connection and try again."
        } else if (errorMsg.includes("cancelled") || errorMsg.includes("cancel")) {
          message = "Sign-in was cancelled"
          details = "You can try again when you're ready."
        } else if (errorMsg.includes("popup") || errorMsg.includes("blocked")) {
          message = "Popup was blocked"
          details = "Please allow popups for this site and try again."
        } else if (errorMsg.includes("not configured") || errorMsg.includes("configuration")) {
          message = "Google Sign-In is not available"
          details = "Please try another sign-in method or contact support."
        } else if (errorMsg.includes("timeout")) {
          message = "Request timed out"
          details = "The server is taking too long to respond. Please try again."
        } else if (errorMsg.includes("verify") || errorMsg.includes("token")) {
          message = "Verification failed"
          details = "Could not verify your Google account. Please try again."
        } else {
          message = error.message
        }
      }

      setErrorMessage(message)
      setErrorDetails(details)
    }
  }

  const handleClose = () => {
    const overlay = document.getElementById("google-signin-overlay")
    if (overlay) {
      overlay.remove()
    }
    setStatus("idle")
    setErrorMessage("")
    setErrorDetails("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white via-cherry-50/30 to-white border-2 border-cherry-200/50 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-playfair text-cherry-900">
              {mode === "signup" ? "Create Your Account" : "Welcome Back"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 rounded-full">
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
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-1">{errorMessage}</h4>
                      {errorDetails && <p className="text-sm text-red-700">{errorDetails}</p>}
                    </div>
                  </div>
                </div>

                <Button onClick={handleGoogleAuth} className="w-full bg-cherry-600 hover:bg-cherry-700 text-white">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={handleClose} variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
