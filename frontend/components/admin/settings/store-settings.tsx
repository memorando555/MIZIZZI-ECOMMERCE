"use client"

import React from "react"
import { DollarSign, Clock, Globe as GlobeIcon } from "lucide-react"
import { SettingCard } from "./setting-card"
import { InputField } from "./input-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface StoreSettingsProps {
  store: {
    currency: string
    currency_symbol: string
    timezone: string
    default_language: string
  }
  onUpdate: (field: string, value: string) => void
}

export function StoreSettings({ store, onUpdate }: StoreSettingsProps) {
  return (
    <SettingCard
      icon={DollarSign}
      title="Store Settings"
      description="Configure currency, timezone and language"
    >
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-foreground">Currency</Label>
          <Select value={store.currency} onValueChange={(value) => onUpdate("store.currency", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="JPY">JPY (¥)</SelectItem>
              <SelectItem value="AUD">AUD (A$)</SelectItem>
              <SelectItem value="CAD">CAD (C$)</SelectItem>
              <SelectItem value="CHF">CHF (CHF)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Timezone</Label>
          <Select value={store.timezone} onValueChange={(value) => onUpdate("store.timezone", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
              <SelectItem value="EST">EST (GMT-5)</SelectItem>
              <SelectItem value="CST">CST (GMT-6)</SelectItem>
              <SelectItem value="MST">MST (GMT-7)</SelectItem>
              <SelectItem value="PST">PST (GMT-8)</SelectItem>
              <SelectItem value="CET">CET (GMT+1)</SelectItem>
              <SelectItem value="IST">IST (GMT+5:30)</SelectItem>
              <SelectItem value="JST">JST (GMT+9)</SelectItem>
              <SelectItem value="AEST">AEST (GMT+10)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Default Language</Label>
          <Select value={store.default_language} onValueChange={(value) => onUpdate("store.default_language", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="it">Italian</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SettingCard>
  )
}
