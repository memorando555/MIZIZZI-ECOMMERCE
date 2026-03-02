"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { IdentifierStep } from "./identifier-step"
import { PasswordStep } from "./password-step"
import { RegisterStepV2 } from "./register-step-v2"
import { WelcomeScreen } from "./welcome-screen"
import { SuccessScreen } from "./success-screen"
import { authService } from "@/services/auth"
import { useAuth } from "@/contexts/auth/auth-context"
import { VerificationStep } from "./verification-step"
import { AppleSpinner } from "./apple-spinner"
import { motion } from "framer-motion"

export type AuthFlow = "login" | "register"

export function AuthSteps() {
  const [step, setStep] = useState<
    "identifier" | "password" | "register" | "verification" | "welcome" | "success" | "loading"
  >("identifier")
  const [flow, setFlow] = useState<AuthFlow>("login")
  const [identifier, setIdentifier] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { refreshAuthState, isAuthenticated, isLoading: authLoading } = useAuth()

  const [resendCountdown, setResendCountdown] = useState(0)

  const refreshAuthStateInProgressRef = useRef(false)

  useEffect(() => {
    if (authLoading) {
      setStep("loading")
    } else if (isAuthenticated) {
      console.log("[v0] User is already authenticated, redirecting to home")
      router.push("/")
    } else {
      // Only show the identifier step once we confirm user is not authenticated
      if (step === "loading") {
        setStep("identifier")
      }
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const storedState = localStorage.getItem("auth_verification_state")
    if (storedState) {
      try {
        const state = JSON.parse(storedState)
        if (state.identifier && state.step === "verification") {
          setIdentifier(state.identifier)
          setUserId(state.userId)
          setFlow("register")
          setStep("verification")
        }
      } catch (e) {
        localStorage.removeItem("auth_verification_state")
      }
    }
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1)
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [resendCountdown])

  const safeRefreshAuthState = async () => {
    if (refreshAuthStateInProgressRef.current) {
      console.log("[v0] refreshAuthState already in progress, skipping duplicate call")
      return
    }

    refreshAuthStateInProgressRef.current = true
    try {
      await refreshAuthState()
    } catch (error) {
      console.error("[v0] Error refreshing auth state:", error)
    } finally {
      refreshAuthStateInProgressRef.current = false
    }
  }

  const handleIdentifierSubmit = async (value: string, isEmail: boolean) => {
    setIsLoading(true)
    const trimmedIdentifier = value.trim()
    setIdentifier(trimmedIdentifier)

    try {
      const [response] = await Promise.all([
        authService.checkAvailability(trimmedIdentifier),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ])

      const emailExists = isEmail && response.email_available === false
      const phoneExists = !isEmail && response.phone_available === false

      if (emailExists || phoneExists) {
        setFlow("login")
        setStep("password")
        toast({
          title: "Account found",
          description: "Please enter your password to continue",
        })
      } else {
        setFlow("register")
        setStep("register")
        toast({
          title: "Create an account",
          description: "Please complete your registration to continue",
        })
      }
    } catch (error: any) {
      console.error("[v0] Identifier check error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process your request",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSuccess = async (userId: string, userData?: any) => {
    setUserId(userId)
    setIsVerified(true)

    localStorage.removeItem("auth_verification_state")

    if (userData) {
      setStep("success")

      if (userData.user) {
        localStorage.setItem("user", JSON.stringify(userData.user))
      }

      await safeRefreshAuthState()

      setTimeout(() => {
        router.push("/")
      }, 2000)
    } else {
      setStep("register")
      toast({
        title: "Verification successful",
        description: "Please complete your registration",
      })
    }
  }

  const handlePasswordSubmit = async (password: string) => {
    setIsLoading(true)
    const trimmedIdentifier = identifier.trim()
    try {
      const [response] = await Promise.all([
        authService.login(trimmedIdentifier, password),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ])

      await safeRefreshAuthState()

      setStep("success")

      toast({
        title: "Login successful",
        description: "Welcome back! You are now logged in.",
      })

      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error: any) {
      if (error.response?.data?.verification_required) {
        setUserId(error.response.data.user_id || null)

        localStorage.setItem(
          "auth_verification_state",
          JSON.stringify({
            identifier: identifier,
            step: "verification",
            userId: error.response.data.user_id,
            timestamp: new Date().toISOString(),
          }),
        )

        localStorage.removeItem("user")
        localStorage.removeItem("mizizzi_token")

        setStep("verification")

        try {
          await authService.sendVerificationCode(trimmedIdentifier)
          toast({
            title: "Verification required",
            description: `Please verify your ${identifier.includes("@") ? "email" : "phone"} to continue.`,
          })
        } catch (verificationError: any) {
          toast({
            title: "Verification error",
            description: verificationError.message || "Failed to send verification code",
            variant: "destructive",
          })
        }
        return
      }

      let errorMessage = "Invalid credentials"

      if (error.message?.includes("not found")) {
        errorMessage = "Account not found. Please check your email or phone number."
      } else if (error.message?.includes("password")) {
        errorMessage = "Incorrect password. Please try again."
      } else if (error.message?.includes("locked")) {
        errorMessage = "Your account has been locked. Please contact support."
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (name: string, password: string) => {
    setIsLoading(true)
    try {
      const trimmedIdentifier = identifier.trim()

      const [response] = await Promise.all([
        authService.register({
          name,
          email: trimmedIdentifier.includes("@") ? trimmedIdentifier : undefined,
          phone: !trimmedIdentifier.includes("@") ? trimmedIdentifier : undefined,
          password,
        }),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ])

      const userId = response.user_id

      if (userId) {
        setUserId(userId)

        localStorage.setItem(
          "auth_verification_state",
          JSON.stringify({
            identifier: trimmedIdentifier,
            step: "verification",
            userId: userId,
            timestamp: new Date().toISOString(),
          }),
        )

        localStorage.removeItem("user")
        localStorage.removeItem("mizizzi_token")

        setStep("verification")

        try {
          await authService.sendVerificationCode(trimmedIdentifier)

          toast({
            title: "Verification code sent",
            description: `Please check your ${trimmedIdentifier.includes("@") ? "email" : "phone"} for the verification code.`,
            duration: 5000,
          })
        } catch (verificationError: any) {
          console.error("[v0] Verification code sending failed:", verificationError)
          toast({
            title: "Account created",
            description:
              "Your account was created successfully. Please use the 'Resend Code' button to receive your verification code.",
            duration: 8000,
          })
          setStep("verification")
        }
      } else {
        setStep("welcome")

        toast({
          title: "Account created",
          description: "Your account has been created successfully!",
        })
      }
    } catch (error: any) {
      console.error("[v0] Registration error:", error)
      let errorMessage = "Failed to create account"
      let toastDuration = 5000

      if (error.message?.includes("account was created")) {
        errorMessage = error.message
        toastDuration = 10000

        toast({
          title: "Account created with issues",
          description: errorMessage,
          variant: "default",
          duration: toastDuration,
        })

        setTimeout(() => {
          setStep("identifier")
        }, 3000)
        return
      } else if (error.message?.includes("email") && error.message?.includes("exists")) {
        errorMessage = "This email is already registered. Please use a different email."
      } else if (error.message?.includes("phone") && error.message?.includes("exists")) {
        errorMessage = "This phone number is already registered. Please use a different number."
      } else if (error.message?.includes("password")) {
        errorMessage = "Password does not meet requirements. Please choose a stronger password."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
        duration: toastDuration,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (resendCountdown > 0) return

    setIsLoading(true)
    try {
      await authService.resendVerificationCode(identifier)

      setResendCountdown(60)

      toast({
        title: "Verification code sent",
        description: `A new verification code has been sent to ${identifier}. Please check your ${
          identifier.includes("@") ? "inbox and spam folder" : "messages"
        }`,
        duration: 5000,
      })
    } catch (error: any) {
      let errorMessage = "Failed to resend verification code"
      let toastDuration = 5000

      if (error.message?.includes("Server error") || error.message?.includes("email service")) {
        errorMessage = error.message
        toastDuration = 8000
      } else if (error.message?.includes("too many")) {
        errorMessage = "Too many attempts. Please try again in a few minutes."
      } else if (error.message?.includes("not found")) {
        errorMessage = "Account not found. Please check your information."
      } else if (error.message?.includes("already verified")) {
        errorMessage = "This account is already verified. Please login."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: toastDuration,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setStep("identifier")
  }

  const handleVerificationSubmit = async (code: string) => {
    if (!code) {
      toast({
        title: "Verification code required",
        description: "Please enter the verification code",
        variant: "destructive",
      })
      return
    }

    if (code.length < 4) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid verification code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const trimmedCode = code.trim()

      const [response] = await Promise.all([
        authService.verifyCode(userId || "", trimmedCode, !identifier.includes("@")),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ])

      if (response.verified && response.access_token) {
        toast({
          title: "Verification successful",
          description: "Your account has been verified",
        })

        await safeRefreshAuthState()
        await handleVerificationSuccess(userId || "", response)
      } else {
        throw new Error("Invalid verification code. Please check and try again.")
      }
    } catch (error: any) {
      console.error("Verification error:", error)
      let errorMessage = "Failed to verify code"

      if (error.message?.includes("expired")) {
        errorMessage = "Verification code has expired. Please request a new one."
      } else if (error.message?.includes("invalid")) {
        errorMessage = "Invalid verification code. Please check and try again."
      } else if (error.message?.includes("Invalid verification code")) {
        errorMessage = "Invalid verification code. Please check and try again."
      } else if (error.message?.includes("attempts")) {
        errorMessage = "Too many failed attempts. Please request a new code."
      } else if (error.message) {
        errorMessage = error.message
      }

      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <AppleSpinner size="lg" />
          <motion.p
            className="text-sm text-muted-foreground"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            Initializing...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  if (step === "identifier") {
    return <IdentifierStep onSubmit={handleIdentifierSubmit} isLoading={isLoading} />
  }

  if (step === "verification") {
    return (
      <VerificationStep
        identifier={identifier}
        onSubmit={handleVerificationSubmit}
        onResend={handleResendVerification}
        onBack={handleBack}
        isLoading={isLoading}
        resendCountdown={resendCountdown}
      />
    )
  }

  if (step === "register") {
    return (
      <RegisterStepV2
        identifier={identifier}
        onSubmit={handleRegisterSubmit}
        isLoading={isLoading}
        onBack={handleBack}
      />
    )
  }

  if (step === "password") {
    return (
      <PasswordStep identifier={identifier} onSubmit={handlePasswordSubmit} isLoading={isLoading} onBack={handleBack} />
    )
  }

  if (step === "welcome") {
    return (
      <WelcomeScreen
        username={identifier.split("@")[0]}
        onComplete={() => {
          router.push("/")
        }}
      />
    )
  }

  if (step === "success") {
    return <SuccessScreen />
  }

  return null
}
