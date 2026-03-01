"use client"

import { useState, useEffect, useCallback } from "react"
import { adminService } from "@/services/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import {
  Save,
  RefreshCw,
  Search,
  ChevronDown,
  Loader2,
} from "lucide-react"

import { SettingSection } from "@/components/admin/settings/setting-section"
import { SiteSettings } from "@/components/admin/settings/site-settings"
import { StoreSettings } from "@/components/admin/settings/store-settings"
import { InventorySettings } from "@/components/admin/settings/inventory-settings"
import { ReviewsSettings } from "@/components/admin/settings/reviews-settings"
import { SecuritySettings } from "@/components/admin/settings/security-settings"
import { PaymentSettings } from "@/components/admin/settings/payment-settings"
import { SeoSettings } from "@/components/admin/settings/seo-settings"
import { EmailSettings } from "@/components/admin/settings/email-settings"
import { LocalizationSettings } from "@/components/admin/settings/localization-settings"
import { MaintenanceSettings } from "@/components/admin/settings/maintenance-settings"

interface Settings {
  site: {
    name: string
    tagline: string
    description: string
    email: string
    phone: string
    address: string
    currency: string
    currency_symbol: string
    timezone: string
    default_language: string
  }
  store: {
    currency: string
    currency_symbol: string
    timezone: string
    default_language: string
  }
  inventory: {
    low_stock_threshold: number
    notify_on_low_stock: boolean
    allow_backorders: boolean
    show_out_of_stock_products: boolean
  }
  reviews: {
    enabled: boolean
    require_approval: boolean
    allow_guest_reviews: boolean
    notify_on_new_review: boolean
  }
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
  payments: {
    enable_credit_card: boolean
    enable_paypal: boolean
    enable_stripe: boolean
    enable_bank_transfer: boolean
    currency_code: string
  }
  seo: {
    meta_title: string
    meta_description: string
    meta_keywords: string
    enable_sitemap: boolean
    enable_robots_txt: boolean
    google_analytics_id: string
  }
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
  localization: {
    default_language: string
    available_languages: string[]
    date_format: string
    time_format: string
  }
  maintenance: {
    maintenance_mode: boolean
    maintenance_message: string
    allowed_ips: string[]
  }
}

const defaultSettings: Settings = {
  site: {
    name: "Mizizzi",
    tagline: "Premium E-commerce",
    description: "Your shopping destination",
    email: "support@mizizzi.com",
    phone: "+1 (555) 000-0000",
    address: "123 Main St, City, State",
    currency: "USD",
    currency_symbol: "$",
    timezone: "UTC",
    default_language: "en",
  },
  store: {
    currency: "USD",
    currency_symbol: "$",
    timezone: "UTC",
    default_language: "en",
  },
  inventory: {
    low_stock_threshold: 5,
    notify_on_low_stock: true,
    allow_backorders: false,
    show_out_of_stock_products: true,
  },
  reviews: {
    enabled: true,
    require_approval: true,
    allow_guest_reviews: false,
    notify_on_new_review: true,
  },
  security: {
    password_min_length: 8,
    password_requires_special_char: true,
    password_requires_number: true,
    password_requires_uppercase: true,
    max_login_attempts: 5,
    lockout_time: 30,
    session_lifetime: 24,
    enable_two_factor: false,
  },
  payments: {
    enable_credit_card: true,
    enable_paypal: true,
    enable_stripe: false,
    enable_bank_transfer: false,
    currency_code: "USD",
  },
  seo: {
    meta_title: "Mizizzi - Premium Products",
    meta_description: "Discover amazing products at unbeatable prices",
    meta_keywords: "products, shopping, store",
    enable_sitemap: true,
    enable_robots_txt: true,
    google_analytics_id: "",
  },
  email: {
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    from_email: "noreply@mizizzi.com",
    from_name: "Mizizzi",
    enable_transactional: true,
    enable_marketing: false,
  },
  localization: {
    default_language: "en",
    available_languages: ["en", "es", "fr"],
    date_format: "MM/DD/YYYY",
    time_format: "12h",
  },
  maintenance: {
    maintenance_mode: false,
    maintenance_message: "We're currently under maintenance. We'll be back soon!",
    allowed_ips: [],
  },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    site: true,
    store: true,
    inventory: true,
    reviews: true,
    security: true,
    payments: true,
    seo: true,
    email: true,
    localization: true,
    maintenance: true,
  })

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const data = await adminService.getSettings()
        if (data) {
          setSettings((prev) => ({
            ...prev,
            ...data,
          }))
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error)
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Handle setting updates
  const handleUpdate = useCallback(
    (field: string, value: string | boolean) => {
      setSettings((prev) => {
        const keys = field.split(".")
        const updated = { ...prev }
        let current: any = updated

        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]]
        }

        current[keys[keys.length - 1]] = value

        return updated
      })
    },
    []
  )

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true)
      await adminService.updateSettings(settings)
      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Refresh settings
  const handleRefresh = async () => {
    try {
      setLoading(true)
      const data = await adminService.getSettings()
      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
        }))
      }
      toast({
        title: "Success",
        description: "Settings refreshed",
      })
    } catch (error) {
      console.error("Failed to refresh settings:", error)
      toast({
        title: "Error",
        description: "Failed to refresh settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your store's configuration and preferences
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={saving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Site Settings */}
          <SettingSection
            title="Site Information"
            description="Configure your store's basic information and contact details"
          >
            <SiteSettings site={settings.site} onUpdate={handleUpdate} />
          </SettingSection>

          {/* Store Settings */}
          <SettingSection
            title="Store Configuration"
            description="Currency, timezone, and language preferences"
          >
            <StoreSettings store={settings.store} onUpdate={handleUpdate} />
          </SettingSection>

          {/* Inventory Settings */}
          <SettingSection
            title="Inventory Management"
            description="Stock levels and inventory behavior"
          >
            <InventorySettings inventory={settings.inventory} onUpdate={handleUpdate} />
          </SettingSection>

          {/* Reviews Settings */}
          <SettingSection
            title="Customer Reviews"
            description="Review moderation and customer feedback"
          >
            <ReviewsSettings reviews={settings.reviews} onUpdate={handleUpdate} />
          </SettingSection>

          {/* Security Settings */}
          <SettingSection
            title="Security"
            description="Password requirements and account protection"
          >
            <SecuritySettings security={settings.security} onUpdate={handleUpdate} />
          </SettingSection>

          {/* Payment Settings */}
          <SettingSection
            title="Payment Methods"
            description="Configure accepted payment options"
          >
            <PaymentSettings payments={settings.payments} onUpdate={handleUpdate} />
          </SettingSection>

          {/* SEO Settings */}
          <SettingSection
            title="Search Engine Optimization"
            description="Meta tags, analytics, and search engine configuration"
          >
            <SeoSettings seo={settings.seo} onUpdate={handleUpdate} />
          </SettingSection>

          {/* Email Settings */}
          <SettingSection
            title="Email Configuration"
            description="SMTP setup and email delivery"
          >
            <EmailSettings email={settings.email} onUpdate={handleUpdate} />
          </SettingSection>

          {/* Localization Settings */}
          <SettingSection
            title="Localization"
            description="Language, date, and time format settings"
          >
            <LocalizationSettings localization={settings.localization} onUpdate={handleUpdate} />
          </SettingSection>

          {/* Maintenance Settings */}
          <SettingSection
            title="Maintenance"
            description="Maintenance mode and access control"
          >
            <MaintenanceSettings maintenance={settings.maintenance} onUpdate={handleUpdate} />
          </SettingSection>
        </div>

        {/* Footer Save Button */}
        <div className="mt-12 flex justify-end gap-2 border-t border-border pt-6">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  )
}
