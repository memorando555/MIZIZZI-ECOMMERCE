"use client"

import React from "react"
import { CreditCard, Zap } from "lucide-react"
import { SettingCard } from "./setting-card"
import { ToggleField } from "./toggle-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface PaymentSettingsProps {
  payments: {
    enable_credit_card: boolean
    enable_paypal: boolean
    enable_stripe: boolean
    enable_bank_transfer: boolean
    currency_code: string
  }
  onUpdate: (field: string, value: string | boolean) => void
}

export function PaymentSettings({
  payments,
  onUpdate,
}: PaymentSettingsProps) {
  return (
    <SettingCard
      icon={CreditCard}
      title="Payments"
      description="Configure payment methods and processing"
    >
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Payment Methods</h4>
        <ToggleField
          label="Credit Card"
          description="Accept credit and debit card payments"
          value={payments.enable_credit_card}
          onChange={(value) => onUpdate("payments.enable_credit_card", value)}
        />
        <ToggleField
          label="PayPal"
          description="Accept PayPal payments"
          value={payments.enable_paypal}
          onChange={(value) => onUpdate("payments.enable_paypal", value)}
        />
        <ToggleField
          label="Stripe"
          description="Accept payments via Stripe"
          value={payments.enable_stripe}
          onChange={(value) => onUpdate("payments.enable_stripe", value)}
        />
        <ToggleField
          label="Bank Transfer"
          description="Accept bank transfer payments"
          value={payments.enable_bank_transfer}
          onChange={(value) => onUpdate("payments.enable_bank_transfer", value)}
        />
      </div>
    </SettingCard>
  )
}
