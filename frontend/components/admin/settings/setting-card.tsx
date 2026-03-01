"use client"

import React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingCardProps {
  icon?: LucideIcon
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SettingCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: SettingCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        {Icon && <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
