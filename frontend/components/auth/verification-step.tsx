"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { VerificationInputOtp } from "./verification-input-otp"

interface VerificationStepProps {
  identifier: string
  onSubmit: (code: string) => Promise<void>
  onResend: () => Promise<void>
  onBack: () => void
  isLoading: boolean
  resendCountdown: number
}

export function VerificationStep({
  identifier,
  onSubmit,
  onResend,
  onBack,
  isLoading,
  resendCountdown,
}: VerificationStepProps) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const isEmail = identifier.includes("@")
  const displayIdentifier = isEmail ? identifier : `+${identifier.replace(/\D/g, "").slice(-10)}`

  const handleCodeComplete = async (completedCode: string) => {
    if (completedCode.length === 6) {
      await handleSubmit(new Event("auto-submit") as any, completedCode)
    }
  }

  const handleSubmit = async (e: React.FormEvent, codeOverride?: string) => {
    e.preventDefault()

    const codeToSubmit = codeOverride || code

    if (!codeToSubmit || codeToSubmit.length < 6) {
      setError("Please enter a 6-digit code")
      return
    }

    setError("")
    setSuccess(false)

    try {
      await onSubmit(codeToSubmit)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Verification failed")
      setSuccess(false)
    }
  }

  const handleResend = async () => {
    try {
      await onResend()
      setCode("")
      setError("")
    } catch (err: any) {
      setError(err.message || "Failed to resend code")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="space-y-1 text-center">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-semibold text-gray-900"
        >
          Verify your {isEmail ? "email" : "phone"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-600"
        >
          We sent a code to {displayIdentifier}
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <VerificationInputOtp
            value={code}
            onChange={setCode}
            disabled={isLoading || success}
            length={6}
            onComplete={handleCodeComplete}
          />

          <p className="text-xs text-center text-gray-500">
            Enter the 6-digit code from your {isEmail ? "email (check spam folder)" : "text message"}
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700">Verification successful! Redirecting...</p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Button
            type="submit"
            disabled={isLoading || success || code.length < 6}
            className="w-full h-11 text-sm font-medium rounded-lg transition-all duration-200"
          >
            {isLoading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="inline-block mr-2"
              >
                ⟳
              </motion.span>
            ) : success ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Verified
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </motion.div>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-2 pt-1"
      >
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1.5">Didn't receive the code?</p>
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            disabled={isLoading || resendCountdown > 0 || success}
            className="text-cherry-600 hover:text-cherry-700 hover:bg-cherry-50 text-xs font-medium h-auto py-1.5"
          >
            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isLoading || success}
          className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs h-auto py-2"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back
        </Button>
      </motion.div>
    </motion.div>
  )
}
