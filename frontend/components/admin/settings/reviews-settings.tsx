"use client"

import React from "react"
import { Star, ThumbsUp } from "lucide-react"
import { SettingCard } from "./setting-card"
import { ToggleField } from "./toggle-field"

interface ReviewsSettingsProps {
  reviews: {
    enabled: boolean
    require_approval: boolean
    allow_guest_reviews: boolean
    notify_on_new_review: boolean
  }
  onUpdate: (field: string, value: boolean) => void
}

export function ReviewsSettings({
  reviews,
  onUpdate,
}: ReviewsSettingsProps) {
  return (
    <SettingCard
      icon={Star}
      title="Reviews"
      description="Control review settings and moderation"
    >
      <ToggleField
        label="Enable Reviews"
        description="Allow customers to leave product reviews"
        value={reviews.enabled}
        onChange={(value) => onUpdate("reviews.enabled", value)}
      />
      <ToggleField
        label="Require Approval"
        description="Reviews must be approved before displaying"
        value={reviews.require_approval}
        onChange={(value) => onUpdate("reviews.require_approval", value)}
        disabled={!reviews.enabled}
      />
      <ToggleField
        label="Allow Guest Reviews"
        description="Allow reviews from non-registered users"
        value={reviews.allow_guest_reviews}
        onChange={(value) => onUpdate("reviews.allow_guest_reviews", value)}
        disabled={!reviews.enabled}
      />
      <ToggleField
        label="Notify on New Review"
        description="Receive notifications when new reviews are submitted"
        value={reviews.notify_on_new_review}
        onChange={(value) => onUpdate("reviews.notify_on_new_review", value)}
        disabled={!reviews.enabled}
      />
    </SettingCard>
  )
}
