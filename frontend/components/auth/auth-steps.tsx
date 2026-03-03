"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { IdentifierStep } from "./identifier-step"
import { PasswordStep } from "./password-step"
import { RegisterStepV2 } from "./register-step-v2"
import { WelcomeScreen } from "./welcome-screen"
import { SuccessScreen } from "./success-screen"
import { VerificationStep } from "./verification-step"
import {
  checkAvailabilityAction,
  loginAction,
  registerAction,
  verifyAction,
  resendVerificationAction,
} from "@/app/auth/actions"

export type AuthFlow = "login" | "register"

interface AuthStepsProps {
  initialFlow?: AuthFlow
}

export function AuthSteps({ initialFlow = "login" }: AuthStepsProps) {
  const [step, setStep] = useState<
    "identifier" | "password" | "register" | "verification" | "welcome" | "success"
  >("identifier")
  const [flow, setFlow] = useState<AuthFlow>(initialFlow)
  const [identifier, setIdentifier] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  
  const router = useRouter()
  const { toast } = useToast()
  const pendingRef = useRef(false)

  // Restore verification state from localStorage if it exists
  useEffect(() => {
    const storedState = localStorage.getItem("auth_verification_state")
    if (storedState) {
      try {
        const state = JSON.parse(storedState)
        if (state.identifier && state.step === "verification" && state.userId) {
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

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return
    
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCountdown])

  /**
   * Step 1: Check if identifier (email/phone) is available
   * Calls server action which executes on server
   */
  const handleIdentifierSubmit = async (value: string, isEmail: boolean) => {
    if (pendingRef.current) return
    pendingRef.current = true
    setIsLoading(true)

    const trimmedIdentifier = value.trim()
    setIdentifier(trimmedIdentifier)

    try {
      console.log("[v0] Client: Checking identifier availability via server action")
      const result = await checkAvailabilityAction(trimmedIdentifier)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to check availability",
          variant: "destructive",
        })
        return
      }

      const { email_available, phone_available } = result.data
      const accountExists = isEmail ? !email_available : !phone_available

      console.log("[v0] Client: Account exists?", accountExists)

      if (accountExists) {
        // Account exists, proceed to login
        setFlow("login")
        setStep("password")
        toast({
          title: "Account found",
          description: "Please enter your password to continue",
        })
      } else {
        // Account doesn't exist, proceed to registration
        setFlow("register")
        setStep("register")
        toast({
          title: "Create an account",
          description: "Please complete your registration to continue",
        })
      }
    } catch (error: any) {
      console.error("[v0] Client: Identifier check error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process your request",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      pendingRef.current = false
    }
  }

  /**
   * Step 2a: Login with password
   * Calls server action which handles token storage in HTTP-only cookie
   */
  const handlePasswordSubmit = async (password: string) => {
    if (pendingRef.current) return
    pendingRef.current = true
    setIsLoading(true)

    try {
      console.log("[v0] Client: Logging in via server action")
      const result = await loginAction(identifier, password)

      if (!result.success) {
        if (result.requiresVerification) {
          console.log("[v0] Client: Verification required after login")
          setUserId(result.error?.includes("user_id") ? result.error : null)
          setStep("verification")
          
          // Attempt to resend verification code
          await resendVerificationAction(identifier)
          toast({
            title: "Verification required",
            description: `Please verify your ${identifier.includes("@") ? "email" : "phone"}`,
          })
          return
        }

        toast({
          title: "Login failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        })
        return
      }

      // Login successful - server action calls redirect()
      // This line won't be reached, but kept for clarity
      console.log("[v0] Client: Login successful, redirecting from server")
    } catch (error: any) {
      console.error("[v0] Client: Login error:", error)
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      pendingRef.current = false
    }
  }

  /**
   * Step 2b: Register new account
   * Calls server action to create account, returns user ID for verification
   */
  const handleRegisterSubmit = async (name: string, password: string) => {
    if (pendingRef.current) return
    pendingRef.current = true
    setIsLoading(true)

    try {
      console.log("[v0] Client: Registering via server action")
      const result = await registerAction(name, identifier, password)

      if (!result.success) {
        toast({
          title: "Registration failed",
          description: result.error || "Could not create account",
          variant: "destructive",
        })
        return
      }

      if (result.userId) {
        console.log("[v0] Client: Registration successful, moving to verification")
        setUserId(result.userId)

        // Store verification state for recovery if page reloads
        localStorage.setItem(
          "auth_verification_state",
          JSON.stringify({
            identifier,
            step: "verification",
            userId: result.userId,
            timestamp: new Date().toISOString(),
          }),
        )

        setStep("verification")
        
        toast({
          title: "Account created",
          description: `Verification code sent to ${identifier}`,
          duration: 5000,
        })
      }
    } catch (error: any) {
      console.error("[v0] Client: Register error:", error)
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      pendingRef.current = false
    }
  }

  /**
   * Step 3: Verify email/phone code
   * Calls server action which stores token in HTTP-only cookie and redirects
   */
  const handleVerificationSubmit = async (code: string) => {
    if (pendingRef.current) return
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found",
        variant: "destructive",
      })
      return
    }

    pendingRef.current = true
    setIsLoading(true)

    try {
      const isPhone = !identifier.includes("@")
      console.log("[v0] Client: Verifying code via server action")
      const result = await verifyAction(userId, code.trim(), isPhone)

      if (!result.success) {
        toast({
          title: "Verification failed",
          description: result.error || "Invalid verification code",
          variant: "destructive",
        })
        return
      }

      // Verification successful - server action calls redirect()
      console.log("[v0] Client: Verification successful, redirecting from server")
    } catch (error: any) {
      console.error("[v0] Client: Verify error:", error)
      toast({
        title: "Verification failed",
        description: error.message || "Could not verify code",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      pendingRef.current = false
    }
  }

  /**
   * Resend verification code
   * Calls server action
   */
  const handleResendVerification = async () => {
    if (resendCountdown > 0 || pendingRef.current) return
    
    pendingRef.current = true
    setIsLoading(true)

    try {
      console.log("[v0] Client: Resending verification code via server action")
      const result = await resendVerificationAction(identifier)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to resend code",
          variant: "destructive",
        })
        return
      }

      setResendCountdown(60)
      toast({
        title: "Code sent",
        description: `Verification code resent to ${identifier}`,
        duration: 3000,
      })
    } catch (error: any) {
      console.error("[v0] Client: Resend error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      pendingRef.current = false
    }
  }

  /**
   * Go back to identifier step
   */
  const handleBack = () => {
    setStep("identifier")
  }

  // Render current step
  if (step === "identifier") {
    return <IdentifierStep onSubmit={handleIdentifierSubmit} isLoading={isLoading} />
  }

  if (step === "password") {
    return (
      <PasswordStep identifier={identifier} onSubmit={handlePasswordSubmit} isLoading={isLoading} onBack={handleBack} />
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

  if (step === "success") {
    return <SuccessScreen />
  }

  return null
}
