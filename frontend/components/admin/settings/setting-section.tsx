"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface SettingSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SettingSection({
  title,
  description,
  children,
  className,
}: SettingSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  )
}
