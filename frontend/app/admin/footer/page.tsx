'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Palette, Settings, RotateCcw, Check, LinkIcon, Mail, MapPin, Share2, CreditCard, Eye } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { motion, AnimatePresence } from 'framer-motion'
import { FooterWithSettings } from '@/components/layout/footer-with-settings'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

interface FooterSettings {
  colors: {
    background: string
    text: string
    accent: string
    link: string
    linkHover: string
  }
  company: {
    name: string
    tagline: string
  }
  contact: {
    email: string
    phone: string
    address: string
  }
  social: {
    facebook: string
    instagram: string
    twitter: string
    linkedin: string
  }
  sections: {
    needHelp: string[]
    about: string[]
    categories: string[]
    usefulLinks: string[]
    resources: string[]
  }
  paymentMethods: string[]
}

export default function FooterAdminPage() {
  const [settings, setSettings] = useState<FooterSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [previewKey, setPreviewKey] = useState(0)

  const getAuthToken = () => {
    return localStorage.getItem("admin_token") || localStorage.getItem("token")
  }

  useEffect(() => {
    fetchFooterSettings()
  }, [])

  const fetchFooterSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('[v0] Admin: Fetching footer settings from /api/footer/settings')
      const response = await fetch(`${API_BASE_URL}/api/footer/settings?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })
      
      console.log('[v0] Admin: Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[v0] Admin: Error response:', errorText)
        throw new Error(`Failed to fetch footer settings: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[v0] Admin: Received data:', data)
      
      const defaultSettings: FooterSettings = {
        colors: {
          background: '#2D2D2D',
          text: '#FFFFFF',
          accent: '#FFA500',
          link: '#B8B8B8',
          linkHover: '#FFFFFF',
        },
        company: {
          name: 'Mizizzi',
          tagline: 'Your Local Marketplace',
        },
        contact: {
          email: 'support@mizizzi.com',
          phone: '+254 700 123 456',
          address: 'Nairobi, Kenya',
        },
        social: {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
        },
        sections: {
          needHelp: [],
          about: [],
          categories: [],
          usefulLinks: [],
          resources: [],
        },
        paymentMethods: [],
      }
      
      const settingsData = data.data || data
      setSettings({ ...defaultSettings, ...settingsData })
      console.log('[v0] Admin: Settings loaded successfully')
    } catch (err) {
      console.error('[v0] Admin: Error fetching settings:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      console.log('[v0] Admin: Saving settings:', settings)

      const token = getAuthToken()
      console.log('[v0] Admin: Using token:', token ? 'Token exists' : 'No token')
      
      const response = await fetch(`${API_BASE_URL}/api/footer/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })

      console.log('[v0] Admin: Save response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[v0] Admin: Save error response:', errorText)
        
        let errorMessage = 'Failed to save settings'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = `Server error: ${response.status}`
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('[v0] Admin: Save successful:', data)
      
      setSettings(data.data || data)
      setSuccess(true)
      
      setPreviewKey(prev => prev + 1)
      
      window.dispatchEvent(new CustomEvent('footer-settings-updated'))
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('[v0] Admin: Save failed:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = async () => {
    if (!window.confirm('Are you sure you want to reset to default settings?')) return

    try {
      setSaving(true)
      setError(null)
      
      console.log('[v0] Admin: Resetting settings')
      
      const token = getAuthToken()
      
      const response = await fetch(`${API_BASE_URL}/api/footer/admin/settings/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      console.log('[v0] Admin: Reset response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[v0] Admin: Reset error response:', errorText)
        throw new Error(`Failed to reset settings: ${response.status}`)
      }

      const data = await response.json()
      console.log('[v0] Admin: Reset successful:', data)
      
      setSettings(data.data || data)
      setSuccess(true)
      setPreviewKey(prev => prev + 1)
      
      window.dispatchEvent(new CustomEvent('footer-settings-updated'))
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('[v0] Admin: Reset failed:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
          <svg
            className="w-full h-full drop-shadow-lg"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer rotating arc - Dark Cherry Red */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#8B1428"
              strokeWidth="6"
              strokeDasharray="62.8 188.4"
              strokeLinecap="round"
              animate={{ 
                rotate: 360,
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              style={{ transformOrigin: "50px 50px" }}
            />
            
            {/* Secondary accent arc - subtle glow effect */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#8B1428"
              strokeWidth="2"
              strokeDasharray="62.8 188.4"
              strokeLinecap="round"
              opacity={0.3}
              animate={{ 
                rotate: -360,
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              style={{ transformOrigin: "50px 50px" }}
            />
          </svg>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load footer settings</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-[1800px] px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Footer Management</h1>
          <p className="text-gray-600">Customize every aspect of your website footer including colors, content, links, and payment methods</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Hide' : 'Show'} Live Preview
        </Button>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="mb-6 border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Settings saved successfully!</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Layout for Editor and Preview */}
      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
        {/* Editor Section */}
        <div className="space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="colors" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="colors"><Palette className="w-4 h-4 mr-2" />Colors</TabsTrigger>
              <TabsTrigger value="company"><Settings className="w-4 h-4 mr-2" />Company</TabsTrigger>
              <TabsTrigger value="contact"><MapPin className="w-4 h-4 mr-2" />Contact</TabsTrigger>
              <TabsTrigger value="sections"><LinkIcon className="w-4 h-4 mr-2" />Sections</TabsTrigger>
              <TabsTrigger value="social"><Share2 className="w-4 h-4 mr-2" />Social</TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Footer Color Scheme</CardTitle>
                  <CardDescription>Customize the footer colors to match your brand</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: 'background', label: 'Background Color', description: 'Main footer background' },
                    { key: 'text', label: 'Text Color', description: 'Primary text color' },
                    { key: 'accent', label: 'Accent Color', description: 'Buttons and highlights' },
                    { key: 'link', label: 'Link Color', description: 'Default link color' },
                    { key: 'linkHover', label: 'Link Hover Color', description: 'Color when hovering links' },
                  ].map((color) => (
                    <div key={color.key} className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold">{color.label}</Label>
                        <p className="text-xs text-gray-500">{color.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.colors[color.key as keyof typeof settings.colors]}
                          onChange={(e) => setSettings({
                            ...settings,
                            colors: { ...settings.colors, [color.key]: e.target.value }
                          })}
                          className="w-16 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={settings.colors[color.key as keyof typeof settings.colors]}
                          onChange={(e) => setSettings({
                            ...settings,
                            colors: { ...settings.colors, [color.key]: e.target.value }
                          })}
                          className="flex-1 font-mono text-sm"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Tab */}
            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Update your company branding details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={settings.company.name}
                      onChange={(e) => setSettings({
                        ...settings,
                        company: { ...settings.company, name: e.target.value }
                      })}
                      placeholder="Mizizzi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tagline</Label>
                    <Input
                      value={settings.company.tagline}
                      onChange={(e) => setSettings({
                        ...settings,
                        company: { ...settings.company, tagline: e.target.value }
                      })}
                      placeholder="Your Local Marketplace"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Manage your public contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={settings.contact.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        contact: { ...settings.contact, email: e.target.value }
                      })}
                      placeholder="support@mizizzi.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      value={settings.contact.phone}
                      onChange={(e) => setSettings({
                        ...settings,
                        contact: { ...settings.contact, phone: e.target.value }
                      })}
                      placeholder="+254 700 123 456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={settings.contact.address}
                      onChange={(e) => setSettings({
                        ...settings,
                        contact: { ...settings.contact, address: e.target.value }
                      })}
                      placeholder="Nairobi, Kenya"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {[
                  { key: 'needHelp', label: 'Need Help?', placeholder: 'Chat with us\nHelp Center\nContact Us' },
                  { key: 'about', label: 'About Section', placeholder: 'About us\nReturns Policy\nCareers' },
                  { key: 'categories', label: 'Shop Categories', placeholder: 'Accessories\nActivewear\nBags' },
                  { key: 'usefulLinks', label: 'Useful Links', placeholder: 'Track Order\nShipping\nReturn Policy' },
                  { key: 'resources', label: 'Resources', placeholder: 'Size Guide\nShipping Info\nGift Cards' },
                ].map((section) => (
                  <Card key={section.key}>
                    <CardHeader>
                      <CardTitle>{section.label}</CardTitle>
                      <CardDescription>Enter one link per line</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        value={settings.sections[section.key as keyof typeof settings.sections].join('\n')}
                        onChange={(e) => setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            [section.key]: e.target.value.split('\n').filter(line => line.trim())
                          }
                        })}
                        placeholder={section.placeholder}
                        className="w-full px-3 py-2 border rounded-md font-mono text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </CardContent>
                  </Card>
                ))}

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>List available payment methods (one per line)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={settings.paymentMethods.join('\n')}
                      onChange={(e) => setSettings({
                        ...settings,
                        paymentMethods: e.target.value.split('\n').filter(line => line.trim())
                      })}
                      placeholder="Pesapal&#10;M-Pesa&#10;Card Payment"
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Links</CardTitle>
                  <CardDescription>Connect your social profiles</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
                    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                    { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/...' },
                    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/...' },
                  ].map((social) => (
                    <div key={social.key} className="space-y-2">
                      <Label>{social.label}</Label>
                      <Input
                        type="url"
                        value={settings.social[social.key as keyof typeof settings.social]}
                        onChange={(e) => setSettings({
                          ...settings,
                          social: { ...settings.social, [social.key]: e.target.value }
                        })}
                        placeholder={social.placeholder}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={resetSettings}
              disabled={saving}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Defaults
            </Button>
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="gap-2 bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Live Preview Section */}
        {showPreview && (
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your footer will look on the website. Save changes to update the preview.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden bg-gray-50 max-h-[800px] overflow-y-auto">
                  <div className="scale-90 origin-top">
                    <FooterWithSettings key={previewKey} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
