"use client"

import React from "react"
import { Globe } from "lucide-react"
import { SettingCard } from "./setting-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface LocalizationSettingsProps {
  localization: {
    default_language: string
    available_languages: string[]
    date_format: string
    time_format: string
  }
  onUpdate: (field: string, value: string) => void
}

export function LocalizationSettings({
  localization,
  onUpdate,
}: LocalizationSettingsProps) {
  return (
    <SettingCard
      icon={Globe}
      title="Localization"
      description="Language, date and time format settings"
    >
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-foreground">Default Language</Label>
          <Select
            value={localization.default_language}
            onValueChange={(value) => onUpdate("localization.default_language", value)}
          >
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
              <SelectItem value="ar">Arabic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Date Format</Label>
          <Select
            value={localization.date_format}
            onValueChange={(value) => onUpdate("localization.date_format", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Time Format</Label>
          <Select
            value={localization.time_format}
            onValueChange={(value) => onUpdate("localization.time_format", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
              <SelectItem value="24h">24 Hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SettingCard>
  )
}
