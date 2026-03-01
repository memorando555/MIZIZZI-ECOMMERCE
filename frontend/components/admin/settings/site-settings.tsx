"use client"

import React from "react"
import { Globe, Mail, Phone, MapPin } from "lucide-react"
import { SettingCard } from "./setting-card"
import { InputField } from "./input-field"

interface SiteSettingsProps {
  site: {
    name: string
    tagline: string
    description: string
    email: string
    phone: string
    address: string
  }
  onUpdate: (field: string, value: string) => void
}

export function SiteSettings({ site, onUpdate }: SiteSettingsProps) {
  return (
    <SettingCard
      icon={Globe}
      title="Site Information"
      description="Manage your store's basic information"
    >
      <InputField
        label="Site Name"
        placeholder="Your Store Name"
        value={site.name}
        onChange={(value) => onUpdate("site.name", value)}
        required
      />
      <InputField
        label="Tagline"
        placeholder="A short tagline for your store"
        value={site.tagline}
        onChange={(value) => onUpdate("site.tagline", value)}
      />
      <InputField
        label="Description"
        placeholder="Describe your store"
        value={site.description}
        onChange={(value) => onUpdate("site.description", value)}
      />
      <div className="space-y-4">
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Contact Information</h4>
        </div>
        <div className="flex gap-2">
          <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
          <InputField
            label="Email"
            placeholder="contact@store.com"
            value={site.email}
            onChange={(value) => onUpdate("site.email", value)}
            type="email"
            required
          />
        </div>
        <div className="flex gap-2">
          <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
          <InputField
            label="Phone"
            placeholder="+1 (555) 000-0000"
            value={site.phone}
            onChange={(value) => onUpdate("site.phone", value)}
          />
        </div>
        <div className="flex gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
          <InputField
            label="Address"
            placeholder="123 Main St, City, State"
            value={site.address}
            onChange={(value) => onUpdate("site.address", value)}
          />
        </div>
      </div>
    </SettingCard>
  )
}
