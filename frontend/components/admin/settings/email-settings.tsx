"use client"

import React from "react"
import { Mail, Send } from "lucide-react"
import { SettingCard } from "./setting-card"
import { InputField } from "./input-field"
import { ToggleField } from "./toggle-field"

interface EmailSettingsProps {
  email: {
    smtp_host: string
    smtp_port: number
    smtp_username: string
    smtp_password: string
    from_email: string
    from_name: string
    enable_transactional: boolean
    enable_marketing: boolean
  }
  onUpdate: (field: string, value: string | boolean) => void
}

export function EmailSettings({
  email,
  onUpdate,
}: EmailSettingsProps) {
  return (
    <SettingCard
      icon={Mail}
      title="Email"
      description="Configure email delivery and templates"
    >
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">SMTP Configuration</h4>
        <InputField
          label="SMTP Host"
          placeholder="smtp.gmail.com"
          value={email.smtp_host}
          onChange={(value) => onUpdate("email.smtp_host", value)}
        />
        <InputField
          label="SMTP Port"
          placeholder="587"
          value={String(email.smtp_port)}
          onChange={(value) => onUpdate("email.smtp_port", value)}
          type="number"
        />
        <InputField
          label="SMTP Username"
          placeholder="your-email@example.com"
          value={email.smtp_username}
          onChange={(value) => onUpdate("email.smtp_username", value)}
        />
        <InputField
          label="SMTP Password"
          placeholder="••••••••"
          value={email.smtp_password}
          onChange={(value) => onUpdate("email.smtp_password", value)}
          type="password"
        />

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Email Settings</h4>
        </div>
        <InputField
          label="From Email"
          placeholder="noreply@store.com"
          value={email.from_email}
          onChange={(value) => onUpdate("email.from_email", value)}
          type="email"
          required
        />
        <InputField
          label="From Name"
          placeholder="Your Store"
          value={email.from_name}
          onChange={(value) => onUpdate("email.from_name", value)}
        />
        <ToggleField
          label="Transactional Emails"
          description="Send order and account related emails"
          value={email.enable_transactional}
          onChange={(value) => onUpdate("email.enable_transactional", value)}
        />
        <ToggleField
          label="Marketing Emails"
          description="Send promotional and newsletter emails"
          value={email.enable_marketing}
          onChange={(value) => onUpdate("email.enable_marketing", value)}
        />
      </div>
    </SettingCard>
  )
}
