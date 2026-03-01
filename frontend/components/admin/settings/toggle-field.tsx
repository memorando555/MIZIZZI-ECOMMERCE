"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface ToggleFieldProps {
  label: string
  description?: string
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

export function ToggleField({
  label,
  description,
  value,
  onChange,
  disabled,
}: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  )
}
