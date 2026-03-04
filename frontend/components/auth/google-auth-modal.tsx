"use client"

import { Modal } from "@/components/ui/modal"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
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

function AppleSpinner({ className = "" }: { className?: string }) {
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
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.18"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
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

  // avoid re-creating class instance every render
  const googleOAuth = useMemo(() => new GoogleOAuthAPI(), [])

  useEffect(() => {
    if (isOpen) {
      setStatus("idle")
      setErrorMessage("")
    }
  }, [isOpen])

  const title = mode === "signup" ? "Continue with Google" : "Sign in with Google"
  const subtitle =
    mode === "signup"
      ? "Create your account in one step."
      : "Welcome back — you’re one tap away."

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
      }, 900) // snappier, more “Apple”
    } catch (error) {
      setStatus("error")
      const msg = error instanceof Error ? error.message : "Authentication failed"
      setErrorMessage(msg)

      toast({
        title: "Couldn’t sign in",
        description: msg,
        variant: "destructive",
      })
    }
  }

  const isBusy = status === "loading"
  const isSuccess = status === "success"

  return (
    <Modal open={isOpen} onOpenChange={onClose} size="sm" closeOnEscape closeOnClickOutside>
      <div className="w-full">
        {/* Apple-like card */}
        <div className="rounded-2xl bg-white text-neutral-900 shadow-[0_24px_80px_rgba(0,0,0,0.18)] ring-1 ring-black/5 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="space-y-1">
              <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>
              <p className="text-[13px] text-neutral-500">{subtitle}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-neutral-100" />

          {/* Body */}
          <div className="px-6 py-6">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.98, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 6 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                  className="py-6 flex flex-col items-center justify-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center"
                  >
                    <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </motion.div>
                  <div className="mt-4 space-y-1">
                    <p className="text-[15px] font-semibold">
                      {mode === "signup" ? "You’re all set." : "Signed in."}
                    </p>
                    <p className="text-[13px] text-neutral-500">Taking you back…</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                  className="space-y-4"
                >
                  {/* Button */}
                  <button
                    onClick={handleGoogleAuth}
                    disabled={isBusy}
                    className={[
                      "w-full rounded-xl px-4 py-3",
                      "flex items-center justify-center gap-3",
                      "text-[14px] font-medium",
                      "transition-all",
                      "ring-1 ring-black/10",
                      "bg-white hover:bg-neutral-50 active:bg-neutral-100",
                      "shadow-[0_1px_0_rgba(0,0,0,0.03)]",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                    ].join(" ")}
                  >
                    {isBusy ? (
                      <>
                        <AppleSpinner className="w-5 h-5 text-neutral-900" />
                        <span>Signing in…</span>
                      </>
                    ) : (
                      <>
                        <GoogleIcon className="w-5 h-5" />
                        <span>{mode === "signup" ? "Continue with Google" : "Continue with Google"}</span>
                      </>
                    )}
                  </button>

                  {/* Error (minimal, Apple-ish) */}
                  <AnimatePresence>
                    {status === "error" && errorMessage ? (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-xl bg-red-50 ring-1 ring-red-500/15 px-4 py-3"
                      >
                        <p className="text-[13px] text-red-700 font-medium">Couldn’t sign in</p>
                        <p className="text-[12px] text-red-700/80 mt-1">{errorMessage}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {/* Fine print */}
                  <p className="text-[12px] text-neutral-500 leading-relaxed">
                    By continuing, you agree to MIZIZZI’s{" "}
                    <a className="text-neutral-900 underline underline-offset-4" href="/terms">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a className="text-neutral-900 underline underline-offset-4" href="/privacy">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Optional: subtle backdrop vibe if your Modal doesn’t already add one */}
        <div className="pointer-events-none" aria-hidden="true" />
      </div>
    </Modal>
  )
}