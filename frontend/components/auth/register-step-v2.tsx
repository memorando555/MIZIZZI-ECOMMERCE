"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { PasswordStrength } from "./password-strength"
import { checkPasswordStrength } from "@/lib/validations/auth"
import { AuthContainerLoader } from "./auth-container-loader"

interface RegisterStepV2Props {
  identifier: string
  onSubmit: (name: string, password: string) => void
  isLoading: boolean
  onBack: () => void
}

type RegistrationStep = "name" | "password" | "confirm" | "terms"

export function RegisterStepV2({ identifier, onSubmit, isLoading, onBack }: RegisterStepV2Props) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("name")
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    terms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [error, setError] = useState("")
  const [stepTransitionLoading, setStepTransitionLoading] = useState(false)

  // Load saved form data if available
  useEffect(() => {
    const savedData = localStorage.getItem("register_form_data_v2")
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        if (data.identifier === identifier) {
          setFormData((prev) => ({
            ...prev,
            name: data.name || "",
          }))
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, [identifier])

  // Save form data when it changes
  useEffect(() => {
    if (formData.name) {
      localStorage.setItem(
        "register_form_data_v2",
        JSON.stringify({
          identifier,
          name: formData.name,
        }),
      )
    }
  }, [identifier, formData.name])

  const handleNameNext = () => {
    if (!formData.name.trim()) {
      setError("Please enter your name")
      return
    }
    if (formData.name.length < 2) {
      setError("Name must be at least 2 characters")
      return
    }
    setError("")
    setStepTransitionLoading(true)
    setTimeout(() => {
      setCurrentStep("password")
      setStepTransitionLoading(false)
    }, 1500)
  }

  const handlePasswordNext = () => {
    if (!formData.password) {
      setError("Please enter a password")
      return
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setError("")
    setStepTransitionLoading(true)
    setTimeout(() => {
      setCurrentStep("confirm")
      setStepTransitionLoading(false)
    }, 1500)
  }

  const handleConfirmNext = () => {
    if (!formData.confirmPassword) {
      setError("Please confirm your password")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setError("")
    setStepTransitionLoading(true)
    setTimeout(() => {
      setCurrentStep("terms")
      setStepTransitionLoading(false)
    }, 1500)
  }

  const handleTermsSubmit = () => {
    if (!formData.terms) {
      setError("You must agree to the terms and conditions")
      return
    }
    setError("")
    localStorage.removeItem("register_form_data_v2")
    onSubmit(formData.name, formData.password)
  }

  const handleBack = () => {
    if (currentStep === "name") {
      onBack()
    } else if (currentStep === "password") {
      setCurrentStep("name")
    } else if (currentStep === "confirm") {
      setCurrentStep("password")
    } else if (currentStep === "terms") {
      setCurrentStep("confirm")
    }
    setError("")
  }

  const getStepNumber = () => {
    switch (currentStep) {
      case "name":
        return 1
      case "password":
        return 2
      case "confirm":
        return 3
      case "terms":
        return 4
      default:
        return 1
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case "name":
        return "What's your name?"
      case "password":
        return "Create a password"
      case "confirm":
        return "Confirm password"
      case "terms":
        return "Terms & Conditions"
      default:
        return ""
    }
  }

  const getLoadingStages = () => {
    if (isLoading) {
      return "Creating your account..."
    }
    return "Validating information..."
  }

  return (
    <div className="space-y-6">
      {(isLoading || stepTransitionLoading) && (
        <AuthContainerLoader isLoading={isLoading || stepTransitionLoading} message={getLoadingStages()} />
      )}

      {!isLoading && !stepTransitionLoading && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={handleBack} disabled={isLoading}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 4</div>
              <div className="w-9" />
            </div>

            <div className="flex gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                    step <= getStepNumber() ? "bg-foreground" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Name Step */}
            {currentStep === "name" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">{getStepTitle()}</h1>
                  <p className="text-sm text-muted-foreground">Enter your full name</p>
                </div>

                <div className="bg-muted/40 p-3 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">{identifier.trim()}</span>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                      setError("")
                    }}
                    onKeyPress={(e) => e.key === "Enter" && handleNameNext()}
                    autoComplete="name"
                    autoFocus
                    className="h-12 text-base"
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <Button
                  onClick={handleNameNext}
                  disabled={isLoading || !formData.name.trim()}
                  className="w-full h-12 text-base font-medium"
                >
                  Next
                </Button>
              </div>
            )}

            {/* Password Step */}
            {currentStep === "password" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">{getStepTitle()}</h1>
                  <p className="text-sm text-muted-foreground">Use at least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      placeholder="Enter password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        const password = e.target.value
                        setFormData((prev) => ({ ...prev, password }))
                        setPasswordStrength(checkPasswordStrength(password))
                        setError("")
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handlePasswordNext()}
                      autoComplete="new-password"
                      autoFocus
                      className="h-12 text-base pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <PasswordStrength strength={passwordStrength} />

                <Button
                  onClick={handlePasswordNext}
                  disabled={isLoading || !formData.password || formData.password.length < 8}
                  className="w-full h-12 text-base font-medium"
                >
                  Next
                </Button>
              </div>
            )}

            {/* Confirm Password Step */}
            {currentStep === "confirm" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">{getStepTitle()}</h1>
                  <p className="text-sm text-muted-foreground">Re-enter your password to confirm</p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      placeholder="Re-enter password"
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        setError("")
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleConfirmNext()}
                      autoComplete="new-password"
                      autoFocus
                      className="h-12 text-base pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <Button
                  onClick={handleConfirmNext}
                  disabled={isLoading || !formData.confirmPassword}
                  className="w-full h-12 text-base font-medium"
                >
                  Next
                </Button>
              </div>
            )}

            {/* Terms Step */}
            {currentStep === "terms" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">{getStepTitle()}</h1>
                  <p className="text-sm text-muted-foreground">Please review and accept</p>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 max-h-48 overflow-y-auto space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-1">Terms of Service</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      By creating an account, you agree to our Terms of Service. You must be at least 18 years old to
                      use this service.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Privacy Policy</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      We collect and process your personal data in accordance with our Privacy Policy.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-lg border p-4">
                  <Checkbox
                    checked={formData.terms}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({ ...prev, terms: checked as boolean }))
                      setError("")
                    }}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <label className="text-sm font-medium cursor-pointer">
                      I agree to the Terms and Privacy Policy
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Read our{" "}
                      <a href="/terms" className="underline">
                        terms
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" className="underline">
                        privacy policy
                      </a>
                    </p>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  onClick={handleTermsSubmit}
                  disabled={isLoading || !formData.terms}
                  className="w-full h-12 text-base font-medium"
                >
                  Create Account
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
