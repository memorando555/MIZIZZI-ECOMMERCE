"use client"

import { Modal } from "@/components/ui/modal"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { GoogleOAuthAPI } from "@/lib/api/google-oauth"
import { useAuth } from "@/contexts/auth/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

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
  const { toast } = useToast()

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
      const result = await googleOAuth.authenticateWithGoogle()
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
      setStatus("error")
      const errorMsg = error instanceof Error ? error.message : "Authentication failed"
      setErrorMessage(errorMsg)

      toast({
        title: "Authentication Failed",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const title = mode === "signup" ? "Create your MIZIZZI account" : "Sign in to MIZIZZI"
  const subtitle = mode === "signup" 
    ? "Join millions who discover premium fashion" 
    : "Access your account and continue shopping"

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      size="sm"
      closeOnEscape={true}
      closeOnClickOutside={true}
    >
      <div className="w-full space-y-0">
        {/* Header - Material Design 3 Style */}
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6 border-b border-[#e0e0e0]">
          <div className="space-y-1">
            <h2 id="modal-title" className="text-2xl font-normal tracking-tight text-[#1f2937]">
              {title}
            </h2>
            <p id="modal-description" className="text-sm font-normal text-[#5f6368] mt-1">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="px-6 py-6 sm:px-8 space-y-6">
          {/* Success State */}
          <AnimatePresence>
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-8 space-y-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-[#1e8e3e]" strokeWidth={1.5} />
                </motion.div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-[#1f2937]">
                    {mode === "signup" ? "Account created" : "Signed in"}
                  </p>
                  <p className="text-sm text-[#5f6368]">
                    {mode === "signup" ? "Redirecting to your account..." : "Welcome back!"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          {status !== "success" && (
            <div className="space-y-6">
              {/* Google Sign-In Button - Material Design 3 */}
              <motion.button
                onClick={handleGoogleAuth}
                disabled={status === "loading"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`w-full px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-3 border border-[#dadce0] ${
                  status === "loading"
                    ? "bg-[#f8f9fa] text-[#9aa0a6] cursor-not-allowed"
                    : "bg-white text-[#3c4043] hover:bg-[#f8f9fa] hover:shadow-[0_1px_1px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.08)] active:bg-[#f1f3f4]"
                }`}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>{mode === "signup" ? "Sign up with Google" : "Sign in with Google"}</span>
                  </>
                )}
              </motion.button>

              {/* Error Message - Material Design Alert */}
              <AnimatePresence>
                {status === "error" && errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-3 p-4 rounded-lg bg-[#fce8e6] border border-[#f1b4ac]"
                  >
                    <AlertCircle className="w-5 h-5 text-[#d33b27] flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#d33b27]">Sign in failed</p>
                      <p className="text-xs text-[#b71c1c] mt-1">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info Text */}
              <div className="p-4 rounded-lg bg-[#f8f9fa] border border-[#dadce0]">
                <p className="text-xs font-medium text-[#3c4043] mb-2">Safe and secure</p>
                <p className="text-xs text-[#5f6368] leading-relaxed">
                  MIZIZZI uses industry-leading security measures to protect your personal information and keep your account safe.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Terms & Privacy */}
        <div className="px-6 py-4 sm:px-8 sm:py-5 border-t border-[#e0e0e0] bg-[#fafbfc]">
          <p className="text-xs text-center text-[#5f6368] leading-relaxed">
            By continuing, you agree to MIZIZZI's{" "}
            <a href="/terms" className="text-[#1a73e8] hover:text-[#1a73e8] underline font-medium">
              Terms of Service
            </a>
            {" "}and{" "}
            <a href="/privacy" className="text-[#1a73e8] hover:text-[#1a73e8] underline font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </Modal>
  )
}
