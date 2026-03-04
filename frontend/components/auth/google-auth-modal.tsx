"use client"

import { Modal } from "@/components/ui/modal"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { GoogleOAuthAPI } from "@/lib/api/google-oauth"
import { useAuth } from "@/contexts/auth/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface GoogleAuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: "signup" | "signin"
}

type Status = "idle" | "loading" | "success" | "error"

function GoogleSpinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.1"
      />
      <path
        d="M22 12c0-5.523-4.477-10-10-10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  )
}

export function GoogleAuthModal({ isOpen, onClose, mode = "signup" }: GoogleAuthModalProps) {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const { refreshAuthState } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const googleOAuth = useMemo(() => new GoogleOAuthAPI(), [])

  useEffect(() => {
    if (isOpen) {
      setStatus("idle")
      setErrorMessage("")
    }
  }, [isOpen])

  const title = mode === "signup" ? "Create your account" : "Sign in"
  const subtitle =
    mode === "signup"
      ? "Continue with Google"
      : "Welcome back"

  const handleGoogleAuth = async () => {
    setStatus("loading")
    setErrorMessage("")

    try {
      const result = await googleOAuth.authenticateWithGoogle()
      await refreshAuthState()
      setStatus("success")

      toast({
        title: result.is_new_user ? "Welcome to MIZIZZI" : "Welcome back",
        description: result.is_new_user ? "Account created successfully." : "Signed in successfully.",
      })

      setTimeout(() => {
        onClose()
        router.push("/")
      }, 1200)
    } catch (error) {
      setStatus("error")
      const msg = error instanceof Error ? error.message : "Authentication failed"
      setErrorMessage(msg)

      toast({
        title: "Couldn't sign in",
        description: msg,
        variant: "destructive",
      })
    }
  }

  const isBusy = status === "loading"
  const isSuccess = status === "success"

  return (
    <Modal open={isOpen} onOpenChange={onClose} size="sm" closeOnEscape closeOnClickOutside>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Clean Google-style card with cherry accents */}
        <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden ring-1 ring-gray-200/50">
          {/* Header with close button */}
          <div className="relative px-6 pt-6 pb-2">
            <div className="space-y-1 pr-8">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-600 hover:text-gray-900"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="py-8 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C41E3A] to-[#A01630] flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </motion.div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-gray-900">
                      {mode === "signup" ? "All set!" : "Welcome back!"}
                    </p>
                    <p className="text-sm text-gray-600">Redirecting you now...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  {/* Google Button - Google-style design */}
                  <button
                    onClick={handleGoogleAuth}
                    disabled={isBusy}
                    className={[
                      "w-full px-4 py-3 rounded-lg",
                      "flex items-center justify-center gap-3",
                      "text-sm font-medium transition-all duration-200",
                      "border border-gray-300",
                      "bg-white hover:bg-gray-50 hover:border-gray-400",
                      "shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                    ].join(" ")}
                  >
                    {isBusy ? (
                      <>
                        <GoogleSpinner className="w-5 h-5 text-gray-700" />
                        <span className="text-gray-700">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <GoogleIcon className="w-5 h-5" />
                        <span className="text-gray-700">Continue with Google</span>
                      </>
                    )}
                  </button>

                  {/* Error message - cherry colored */}
                  <AnimatePresence>
                    {status === "error" && errorMessage ? (
                      <motion.div
                        initial={{ opacity: 0, y: 4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: 4, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg bg-red-50 border border-red-200 px-4 py-3"
                      >
                        <p className="text-xs font-medium text-red-800">Error</p>
                        <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {/* Terms & Privacy */}
                  <p className="text-xs text-gray-600 text-center leading-relaxed">
                    By continuing, you agree to MIZIZZI's{" "}
                    <a
                      href="/terms"
                      className="text-[#C41E3A] hover:text-[#A01630] font-medium transition-colors"
                    >
                      Terms
                    </a>
                    {" "}and{" "}
                    <a
                      href="/privacy"
                      className="text-[#C41E3A] hover:text-[#A01630] font-medium transition-colors"
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </Modal>
  )
}
