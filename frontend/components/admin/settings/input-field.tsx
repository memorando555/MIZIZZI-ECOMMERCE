"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface InputFieldProps {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  type?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

export function InputField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  required,
  disabled,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          error && "border-red-500 focus:ring-red-500/20"
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
