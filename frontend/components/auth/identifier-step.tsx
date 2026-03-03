"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { identifierSchema } from "@/lib/validations/auth"
import { Loader2 } from "lucide-react"
import { GoogleAuthButton } from "./google-auth-button"

interface IdentifierStepProps {
  onSubmit: (identifier: string, isEmail: boolean) => void
  isLoading: boolean
}

export function IdentifierStep({ onSubmit, isLoading }: IdentifierStepProps) {
  const emailForm = useForm<z.infer<typeof identifierSchema>>({
    resolver: zodResolver(identifierSchema),
    defaultValues: {
      email: "",
    },
  })

  const handleEmailSubmit = (data: z.infer<typeof identifierSchema>) => {
    onSubmit(data.email, true)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Welcome</h1>
        <p className="text-xs text-muted-foreground">Enter your email to continue</p>
      </div>

      <GoogleAuthButton mode="signup" fullWidth />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-xs text-muted-foreground font-medium">Or continue with email</span>
        </div>
      </div>

      <div className="mt-3 animate-fade-in">
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-2">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-cherry-700 font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      autoComplete="email"
                      {...field}
                      className="h-10 text-sm transition-all duration-200 focus:ring-2 focus:ring-cherry-600"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full h-10 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <a href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
      </div>
    </div>
  )
}
