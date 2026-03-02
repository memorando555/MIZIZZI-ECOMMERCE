"use client"

import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, Shield, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import { GoogleOAuthAPI } from "@/lib/api/google-oauth"
import { useAuth } from "@/contexts/auth/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface GoogleAuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "signup" | "signin"
}

export function GoogleAuthModal({ open, onOpenChange, mode = "signup" }: GoogleAuthModalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const { refreshAuthState } = useAuth()
  const router = useRouter()
  const googleOAuth = new GoogleOAuthAPI()
  const { toast } = useToast()

  // Reset status when modal opens
  useEffect(() => {
    if (open) {
      setStatus("idle")
      setErrorMessage("")
    }
  }, [open])

  const handleGoogleAuth = async () => {
    try {
      setStatus("loading")
      setErrorMessage("")

      const authUrl = await googleOAuth.getAuthUrl()
      if (authUrl) {
        window.location.href = authUrl
      } else {
        throw new Error("Failed to get Google auth URL")
      }
    } catch (error) {
      setStatus("error")
      const errorMsg = error instanceof Error ? error.message : "Google authentication failed"
      setErrorMessage(errorMsg)
      console.error("[v0] Google auth error:", error)
      toast({
        title: "Authentication Failed",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const title = mode === "signup" ? "Create Your Account" : "Sign In"
  const subtitle = mode === "signup" ? "Join MIZIZZI and discover luxury fashion" : "Welcome back to MIZIZZI"

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Google Auth Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              onClick={handleGoogleAuth}
              disabled={status === "loading"}
              className="w-full h-12 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-semibold rounded-lg transition-all"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign up with Google
                </>
              )}
            </Button>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {status === "error" && errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <p className="text-sm text-red-700">{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Benefits */}
          <div className="space-y-3 py-4 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Secure & Fast</p>
                <p className="text-xs text-gray-600">Your data is protected with enterprise-grade security</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Instant Access</p>
                <p className="text-xs text-gray-600">Create your account in seconds</p>
              </div>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-center text-gray-600">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-blue-600 hover:text-blue-700 font-semibold">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </Modal>
  )
}
