"use client"

import React from "react"
import { Package, AlertCircle } from "lucide-react"
import { SettingCard } from "./setting-card"
import { InputField } from "./input-field"
import { ToggleField } from "./toggle-field"

interface InventorySettingsProps {
  inventory: {
    low_stock_threshold: number
    notify_on_low_stock: boolean
    allow_backorders: boolean
    show_out_of_stock_products: boolean
  }
  onUpdate: (field: string, value: string | boolean) => void
}

export function InventorySettings({
  inventory,
  onUpdate,
}: InventorySettingsProps) {
  return (
    <SettingCard
      icon={Package}
      title="Inventory"
      description="Manage stock and inventory settings"
    >
      <InputField
        label="Low Stock Threshold"
        placeholder="5"
        value={String(inventory.low_stock_threshold)}
        onChange={(value) => onUpdate("inventory.low_stock_threshold", value)}
        type="number"
      />
      <ToggleField
        label="Notify on Low Stock"
        description="Receive alerts when items fall below threshold"
        value={inventory.notify_on_low_stock}
        onChange={(value) => onUpdate("inventory.notify_on_low_stock", value)}
      />
      <ToggleField
        label="Allow Backorders"
        description="Allow customers to order items that are out of stock"
        value={inventory.allow_backorders}
        onChange={(value) => onUpdate("inventory.allow_backorders", value)}
      />
      <ToggleField
        label="Show Out of Stock"
        description="Display products even when they're out of stock"
        value={inventory.show_out_of_stock_products}
        onChange={(value) => onUpdate("inventory.show_out_of_stock_products", value)}
      />
    </SettingCard>
  )
}
