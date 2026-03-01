"use client"

import React from "react"
import { Search, Globe } from "lucide-react"
import { SettingCard } from "./setting-card"
import { InputField } from "./input-field"
import { ToggleField } from "./toggle-field"

interface SeoSettingsProps {
  seo: {
    meta_title: string
    meta_description: string
    meta_keywords: string
    enable_sitemap: boolean
    enable_robots_txt: boolean
    google_analytics_id: string
  }
  onUpdate: (field: string, value: string | boolean) => void
}

export function SeoSettings({
  seo,
  onUpdate,
}: SeoSettingsProps) {
  return (
    <SettingCard
      icon={Search}
      title="SEO"
      description="Search engine optimization settings"
    >
      <InputField
        label="Meta Title"
        placeholder="Your Store - Premium Products"
        value={seo.meta_title}
        onChange={(value) => onUpdate("seo.meta_title", value)}
      />
      <InputField
        label="Meta Description"
        placeholder="Discover amazing products at unbeatable prices"
        value={seo.meta_description}
        onChange={(value) => onUpdate("seo.meta_description", value)}
      />
      <InputField
        label="Meta Keywords"
        placeholder="products, shopping, store"
        value={seo.meta_keywords}
        onChange={(value) => onUpdate("seo.meta_keywords", value)}
      />
      <InputField
        label="Google Analytics ID"
        placeholder="G-XXXXXXXXXX"
        value={seo.google_analytics_id}
        onChange={(value) => onUpdate("seo.google_analytics_id", value)}
      />
      <ToggleField
        label="Enable Sitemap"
        description="Generate and enable XML sitemap"
        value={seo.enable_sitemap}
        onChange={(value) => onUpdate("seo.enable_sitemap", value)}
      />
      <ToggleField
        label="Enable Robots.txt"
        description="Generate robots.txt for search engines"
        value={seo.enable_robots_txt}
        onChange={(value) => onUpdate("seo.enable_robots_txt", value)}
      />
    </SettingCard>
  )
}
