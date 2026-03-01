"use client"

import React from "react"
import { Shield, Lock, Smartphone, Clock } from "lucide-react"
import { SettingCard } from "./setting-card"
import { InputField } from "./input-field"
import { ToggleField } from "./toggle-field"

interface SecuritySettingsProps {
  security: {
    password_min_length: number
    password_requires_special_char: boolean
    password_requires_number: boolean
    password_requires_uppercase: boolean
    max_login_attempts: number
    lockout_time: number
    session_lifetime: number
    enable_two_factor: boolean
  }
  onUpdate: (field: string, value: string | boolean) => void
}

export function SecuritySettings({
  security,
  onUpdate,
}: SecuritySettingsProps) {
  return (
    <SettingCard
      icon={Shield}
      title="Security"
      description="Password and account security settings"
    >
      <div className="space-y-4">
        <div className="border-b border-border pb-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Password Requirements</h4>
          <div className="space-y-3">
            <InputField
              label="Minimum Password Length"
              placeholder="8"
              value={String(security.password_min_length)}
              onChange={(value) => onUpdate("security.password_min_length", value)}
              type="number"
            />
            <ToggleField
              label="Require Uppercase"
              description="Passwords must contain at least one uppercase letter"
              value={security.password_requires_uppercase}
              onChange={(value) => onUpdate("security.password_requires_uppercase", value)}
            />
            <ToggleField
              label="Require Numbers"
              description="Passwords must contain at least one number"
              value={security.password_requires_number}
              onChange={(value) => onUpdate("security.password_requires_number", value)}
            />
            <ToggleField
              label="Require Special Character"
              description="Passwords must contain special characters (!@#$%^&*)"
              value={security.password_requires_special_char}
              onChange={(value) => onUpdate("security.password_requires_special_char", value)}
            />
          </div>
        </div>

        <div className="border-b border-border pb-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Login Security</h4>
          <div className="space-y-3">
            <InputField
              label="Max Login Attempts"
              placeholder="5"
              value={String(security.max_login_attempts)}
              onChange={(value) => onUpdate("security.max_login_attempts", value)}
              type="number"
            />
            <InputField
              label="Lockout Time (minutes)"
              placeholder="30"
              value={String(security.lockout_time)}
              onChange={(value) => onUpdate("security.lockout_time", value)}
              type="number"
            />
          </div>
        </div>

        <div className="space-y-3">
          <InputField
            label="Session Lifetime (hours)"
            placeholder="24"
            value={String(security.session_lifetime)}
            onChange={(value) => onUpdate("security.session_lifetime", value)}
            type="number"
          />
          <ToggleField
            label="Enable Two-Factor Authentication"
            description="Require 2FA for all admin accounts"
            value={security.enable_two_factor}
            onChange={(value) => onUpdate("security.enable_two_factor", value)}
          />
        </div>
      </div>
    </SettingCard>
  )
}
