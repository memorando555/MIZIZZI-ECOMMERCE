'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Save, Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  SiteSettings,
  InventorySettings,
  ReviewsSettings,
  SecuritySettings,
  PaymentSettings,
  SeoSettings,
  EmailSettings,
  MaintenanceSettings,
  SettingSection,
} from '@/components/admin/settings'
import { adminService } from '@/services/admin'

interface Settings {
  site?: {
    name: string
    tagline: string
    description: string
    email: string
    phone: string
    address: string
  }
  seo?: {
    meta_title: string
    meta_description: string
    meta_keywords: string
    enable_sitemap: boolean
    enable_robots_txt: boolean
    google_analytics_id: string
  }
  email?: {
    smtp_host: string
    smtp_port: number
    smtp_username: string
    smtp_password: string
    from_email: string
    from_name: string
    enable_transactional: boolean
    enable_marketing: boolean
  }
  payment?: {
    enable_credit_card: boolean
    enable_paypal: boolean
    enable_stripe: boolean
    enable_bank_transfer: boolean
    currency_code: string
  }
  inventory?: {
    low_stock_threshold: number
    notify_on_low_stock: boolean
    allow_backorders: boolean
    show_out_of_stock_products: boolean
  }
  reviews?: {
    enabled: boolean
    require_approval: boolean
    allow_guest_reviews: boolean
    notify_on_new_review: boolean
  }
  security?: {
    password_min_length: number
    password_requires_special_char: boolean
    password_requires_number: boolean
    password_requires_uppercase: boolean
    max_login_attempts: number
    lockout_time: number
    session_lifetime: number
    enable_two_factor: boolean
  }
  maintenance?: {
    maintenance_mode: boolean
    maintenance_message: string
    allowed_ips: string[]
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges) saveSettings()
      }
      // Cmd/Ctrl + R to refresh
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault()
        fetchSettings()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasChanges])

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await adminService.getSettings()
      console.log('[v0] Settings response:', response)
      if (response.success) {
        // Backend returns { success, settings, last_updated }
        setSettings(response.settings || {})
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch settings',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('[v0] Error fetching settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch settings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const saveSettings = useCallback(async () => {
    try {
      setIsSaving(true)
      const response = await adminService.updateSettings(settings)
      if (response.success) {
        setHasChanges(false)
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to save settings',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('[v0] Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }, [settings, toast])

  const handleSettingUpdate = (path: string, value: any) => {
    const keys = path.split('.')
    setSettings((prev) => {
      const updated = { ...prev }
      let current: any = updated
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = current[keys[i]] || {}
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return updated
    })
    setHasChanges(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-2 border-muted-foreground border-t-foreground animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
              <p className="mt-2 text-muted-foreground">Manage your store's configuration and preferences</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                  className="pl-10 py-2 h-10 text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSettings}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  size="sm"
                  onClick={saveSettings}
                  disabled={!hasChanges || isSaving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </div>
            </div>

            {/* Status Message */}
            {hasChanges && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                You have unsaved changes. Press Cmd+S or click Save to save.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="space-y-12">
          {/* Site Settings */}
          {(!searchQuery || 'site'.includes(searchQuery)) && settings.site && (
            <SettingSection title="Site" description="Basic store information and contact details">
              <SiteSettings site={settings.site} onUpdate={handleSettingUpdate} />
            </SettingSection>
          )}

          {/* Inventory Settings */}
          {(!searchQuery || 'inventory'.includes(searchQuery)) && settings.inventory && (
            <SettingSection title="Inventory" description="Stock management and tracking">
              <InventorySettings inventory={settings.inventory} onUpdate={handleSettingUpdate} />
            </SettingSection>
          )}

          {/* Reviews Settings */}
          {(!searchQuery || 'reviews'.includes(searchQuery)) && settings.reviews && (
            <SettingSection title="Reviews" description="Customer review moderation and settings">
              <ReviewsSettings reviews={settings.reviews} onUpdate={handleSettingUpdate} />
            </SettingSection>
          )}

          {/* Security Settings */}
          {(!searchQuery || 'security'.includes(searchQuery)) && settings.security && (
            <SettingSection title="Security" description="Authentication and access control">
              <SecuritySettings security={settings.security} onUpdate={handleSettingUpdate} />
            </SettingSection>
          )}

          {/* Payment Settings */}
          {(!searchQuery || 'payment'.includes(searchQuery)) && settings.payment && (
            <SettingSection title="Payments" description="Payment gateway configuration">
              <PaymentSettings payments={settings.payment} onUpdate={handleSettingUpdate} />
            </SettingSection>
          )}

          {/* SEO Settings */}
          {(!searchQuery || 'seo'.includes(searchQuery)) && settings.seo && (
            <SettingSection title="SEO" description="Search engine optimization">
              <SeoSettings seo={settings.seo} onUpdate={handleSettingUpdate} />
            </SettingSection>
          )}

          {/* Email Settings */}
          {(!searchQuery || 'email'.includes(searchQuery)) && settings.email && (
            <SettingSection title="Email" description="SMTP and email configuration">
              <EmailSettings email={settings.email} onUpdate={handleSettingUpdate} />
            </SettingSection>
          )}

          {/* Maintenance Settings */}
          {(!searchQuery || 'maintenance'.includes(searchQuery)) && settings.maintenance && (
            <SettingSection title="Maintenance" description="Maintenance mode and API settings">
              <MaintenanceSettings maintenance={settings.maintenance} onUpdate={handleSettingUpdate} />
            </SettingSection>
          )}

          {/* No Results */}
          {searchQuery &&
            !Object.keys(settings).some((key) => key.includes(searchQuery)) && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No settings found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search query
                </p>
              </div>
            )}
        </div>
      </main>
    </div>
  )
}
