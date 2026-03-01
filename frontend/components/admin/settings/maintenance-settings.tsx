"use client"

import React from "react"
import { AlertTriangle, Eye, Lock } from "lucide-react"
import { SettingCard } from "./setting-card"
import { InputField } from "./input-field"
import { ToggleField } from "./toggle-field"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface MaintenanceSettingsProps {
  maintenance: {
    maintenance_mode: boolean
    maintenance_message: string
    allowed_ips: string[]
  }
  onUpdate: (field: string, value: string | boolean) => void
}

export function MaintenanceSettings({
  maintenance,
  onUpdate,
}: MaintenanceSettingsProps) {
  return (
    <SettingCard
      icon={AlertTriangle}
      title="Maintenance"
      description="Configure maintenance mode and access"
    >
      <ToggleField
        label="Enable Maintenance Mode"
        description="Put your store in maintenance mode for updates"
        value={maintenance.maintenance_mode}
        onChange={(value) => onUpdate("maintenance.maintenance_mode", value)}
      />

      <div>
        <Label className="text-sm font-medium text-foreground">Maintenance Message</Label>
        <Textarea
          placeholder="We're currently under maintenance. We'll be back soon!"
          value={maintenance.maintenance_message}
          onChange={(e) => onUpdate("maintenance.maintenance_message", e.target.value)}
          className="mt-2 min-h-24 rounded-md border border-input bg-background p-3"
          disabled={!maintenance.maintenance_mode}
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-foreground">Allowed IP Addresses</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Enter IP addresses (comma-separated) that can access the store during maintenance
        </p>
        <Textarea
          placeholder="192.168.1.1, 10.0.0.1"
          value={maintenance.allowed_ips.join(", ")}
          onChange={(e) => onUpdate("maintenance.allowed_ips", e.target.value)}
          className="min-h-20 rounded-md border border-input bg-background p-3"
          disabled={!maintenance.maintenance_mode}
        />
      </div>
    </SettingCard>
  )
}
