"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Palette, Save, Eye, RefreshCw, Loader2, AlertCircle, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/contexts/theme-context"

interface ThemeColors {
  background: {
    main: string
    [key: string]: string
  }
  [key: string]: any
}

interface Theme {
  id: number
  name: string
  is_active: boolean
  colors: ThemeColors
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

const PREMIUM_PALETTES = [
  { name: "Pristine White", color: "#FFFFFF", hex: "#FFFFFF", description: "Clean & minimal" },
  { name: "Pearl Cream", color: "#FFFBF0", hex: "#FFFBF0", description: "Warm & inviting" },
  { name: "Sky Breeze", color: "#F0F9FF", hex: "#F0F9FF", description: "Light & fresh" },
  { name: "Mint Fresh", color: "#F0FDF4", hex: "#F0FDF4", description: "Cool & calm" },
  { name: "Lavender Dream", color: "#F3E8FF", hex: "#F3E8FF", description: "Elegant & soft" },
  { name: "Blush Pink", color: "#FDF2F8", hex: "#FDF2F8", description: "Warm & welcoming" },
  { name: "Deep Charcoal", color: "#1A1A1A", hex: "#1A1A1A", description: "Bold & modern" },
  { name: "Ocean Blue", color: "#E0F2FE", hex: "#E0F2FE", description: "Professional" },
  { name: "Warm Beige", color: "#FEFCE8", hex: "#FEFCE8", description: "Comfortable" },
  { name: "Light Slate", color: "#F1F5F9", hex: "#F1F5F9", description: "Neutral gray" },
  { name: "Rose Gold", color: "#FFF7ED", hex: "#FFF7ED", description: "Luxury feel" },
  { name: "Sage Green", color: "#F2FDF7", hex: "#F2FDF7", description: "Natural & calm" },
]

export default function PremiumThemeCustomizer() {
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null)
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null)
  const [copiedHex, setCopiedHex] = useState(false)
  const [hexInput, setHexInput] = useState("#FFFFFF")
  const { toast } = useToast()
  const { refreshTheme, applyTheme } = useTheme()

  const getAuthToken = () => {
    return localStorage.getItem("admin_token") || localStorage.getItem("token")
  }

  useEffect(() => {
    fetchActiveTheme()
  }, [])

  const fetchActiveTheme = async () => {
    setIsLoading(true)
    try {
      const token = getAuthToken()

      if (!token) {
        console.log("[v0] No token found")
        setError("No authentication token found. Please login again.")
        setIsLoading(false)
        return
      }

      console.log("[v0] Fetching active theme from:", `${API_BASE_URL}/api/theme/admin/themes`)

      const response = await fetch(`${API_BASE_URL}/api/theme/admin/themes`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("[v0] Fetch response status:", response.status)

      if (!response.ok) {
        throw new Error("Failed to fetch theme settings")
      }

      const data = await response.json()
      console.log("[v0] Fetched themes data:", data)

      const active = data.themes?.find((t: Theme) => t.is_active)
      console.log("[v0] Active theme found:", active)

      if (active) {
        setActiveTheme(active)
        const bg = active.colors?.background?.main || "#FFFFFF"
        console.log("[v0] Setting background color:", bg)
        setBackgroundColor(bg)
        setHexInput(bg)
        setError(null)
      } else {
        console.log("[v0] No active theme found in data")
        setError("No active theme found")
      }
    } catch (error) {
      console.error("[v0] Error fetching theme:", error)
      setError("Unable to load theme settings")
      toast({
        title: "Error",
        description: "Failed to load theme. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleColorChange = (color: string) => {
    setBackgroundColor(color)
    setHexInput(color)
    setSelectedPalette(null)
  }

  const handleHexInputChange = (e: string) => {
    const value = e.toUpperCase()
    setHexInput(value)

    // Validate hex color
    if (/^#[0-9A-F]{6}$/.test(value)) {
      setBackgroundColor(value)
      setSelectedPalette(null)
    }
  }

  const applyPalette = (color: string) => {
    setBackgroundColor(color)
    setHexInput(color)
    setSelectedPalette(color)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(backgroundColor)
    setCopiedHex(true)
    toast({
      title: "Copied!",
      description: `Color ${backgroundColor} copied to clipboard`,
    })
    setTimeout(() => setCopiedHex(false), 2000)
  }

  const saveTheme = async () => {
    if (!activeTheme) {
      console.log("[v0] No active theme found, cannot save")
      toast({
        title: "Error",
        description: "No active theme found. Please reload the page.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const token = getAuthToken()

      if (!token) {
        throw new Error("No authentication token found")
      }

      console.log("[v0] Saving theme with backgroundColor:", backgroundColor)
      console.log("[v0] Active theme ID:", activeTheme.id)
      console.log("[v0] API URL:", `${API_BASE_URL}/api/theme/admin/themes/${activeTheme.id}`)

      const requestBody = {
        name: activeTheme.name,
        colors: {
          ...activeTheme.colors,
          background: {
            ...(activeTheme.colors?.background || {}),
            main: backgroundColor,
          },
        },
        is_active: true,
      }

      console.log("[v0] Request body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch(`${API_BASE_URL}/api/theme/admin/themes/${activeTheme.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorData = null
        try {
          errorData = await response.json()
          console.log("[v0] Error response data:", errorData)
        } catch (e) {
          console.log("[v0] Could not parse error response as JSON")
        }
        throw new Error(errorData?.message || `Failed to save theme (${response.status})`)
      }

      const data = await response.json()
      console.log("[v0] Theme saved successfully:", data)

      if (data.theme) {
        setActiveTheme(data.theme)
      }
      setIsPreviewMode(false)

      toast({
        title: "Success!",
        description: "Background color updated successfully",
      })

      await refreshTheme()
    } catch (error) {
      console.error("[v0] Error saving theme:", error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      const isNetworkError = errorMessage.includes("fetch") || errorMessage.includes("Failed to")

      toast({
        title: isNetworkError ? "Backend Server Offline" : "Error",
        description: isNetworkError
          ? "Cannot connect to backend server. Please ensure your Flask server is running on port 5000."
          : `Failed to save theme: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const resetChanges = () => {
    if (activeTheme) {
      const bg = activeTheme.colors.background?.main || "#FFFFFF"
      setBackgroundColor(bg)
      setHexInput(bg)
      setIsPreviewMode(false)
      setSelectedPalette(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading theme customizer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Premium Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                  <Palette className="h-5 w-5 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Color Studio</h1>
              </div>
              <p className="text-sm text-gray-600">Customize your store's background color with precision</p>
            </div>
            {isPreviewMode && (
              <div className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-medium text-blue-600">Preview Mode</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="max-w-5xl mx-auto px-6 pt-6">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 text-sm">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchActiveTheme}
                    className="mt-2 text-red-600 hover:text-red-700 h-auto p-0"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Premium Color Palettes */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Premium Color Palettes</h2>
            <p className="text-sm text-gray-600">Choose from our curated collection or pick any custom color</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {PREMIUM_PALETTES.map((palette) => (
              <button
                key={palette.color}
                onClick={() => applyPalette(palette.color)}
                className="group relative"
                title={palette.description}
              >
                <div className="relative overflow-hidden rounded-2xl transition-all duration-300">
                  <div
                    className="w-full aspect-square rounded-2xl border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg"
                    style={{
                      borderColor: selectedPalette === palette.color ? "#1F2937" : "#E5E7EB",
                      backgroundColor: palette.color,
                      boxShadow: selectedPalette === palette.color ? "0 0 0 3px #F3F4F6, 0 0 0 5px #1F2937" : "none",
                    }}
                  >
                    {selectedPalette === palette.color && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-5 w-5 text-gray-900" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs font-medium text-gray-900">{palette.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{palette.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Color Picker Card */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Advanced Color Picker</CardTitle>
                <CardDescription>Fine-tune your background color with precision control</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Color Picker Input Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {/* Color Picker */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Visual Picker</Label>
                  <div className="relative group">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="h-24 w-full cursor-pointer border-2 border-gray-200 rounded-2xl transition-all hover:border-gray-300 focus:outline-none focus:border-blue-500"
                    />
                    <div className="absolute inset-0 rounded-2xl pointer-events-none border-2 border-gray-200 group-hover:border-gray-300 group-focus-within:border-blue-500 group-focus-within:ring-4 group-focus-within:ring-blue-100 transition-all"></div>
                  </div>
                </div>

                {/* Hex Input */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Hex Code</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={hexInput}
                      onChange={(e) => handleHexInputChange(e.target.value)}
                      placeholder="#FFFFFF"
                      maxLength={7}
                      className="font-mono text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className="flex-shrink-0 border-gray-200 bg-transparent"
                    >
                      {copiedHex ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-600" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Live Preview Circle */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Live Preview</Label>
                  <div className="flex gap-3 items-center h-24">
                    <div
                      className="w-full h-full rounded-2xl border-2 border-gray-200 shadow-lg transition-all duration-200 hover:shadow-xl"
                      style={{ backgroundColor: backgroundColor }}
                    />
                    <div className="text-right text-xs">
                      <p className="font-mono font-semibold text-gray-900">{backgroundColor}</p>
                      <p className="text-gray-500 mt-1">RGB: {hexToRgb(backgroundColor)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Information */}
              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Red</p>
                    <p className="text-sm font-mono text-gray-900">{hexToRgb(backgroundColor).split(",")[0]}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Green</p>
                    <p className="text-sm font-mono text-gray-900">{hexToRgb(backgroundColor).split(",")[1]}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Blue</p>
                    <p className="text-sm font-mono text-gray-900">{hexToRgb(backgroundColor).split(",")[2]}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Brightness</p>
                    <p className="text-sm font-mono text-gray-900">{calculateBrightness(backgroundColor)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Store Preview */}
        <Card className="border-gray-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg">Store Preview</CardTitle>
            <CardDescription>How your store will look with this background color</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-8 transition-colors duration-300" style={{ backgroundColor: backgroundColor }}>
              <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded-full w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded-full w-full"></div>
                  <div className="h-3 bg-gray-200 rounded-full w-4/5"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl bg-gray-50 p-4 space-y-3">
                      <div className="aspect-square bg-gray-200 rounded-lg"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between sticky bottom-6">
          <Button
            variant="outline"
            onClick={resetChanges}
            disabled={isSaving}
            className="border-gray-300 text-gray-900 hover:bg-gray-50 bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              disabled={isSaving}
              className="border-gray-300 text-gray-900 hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              {isPreviewMode ? "Exit Preview" : "Preview"}
            </Button>

            <Button
              onClick={saveTheme}
              disabled={isSaving}
              className="bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Background Color
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return `${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)}`
  }
  return "0, 0, 0"
}

// Helper function to calculate brightness
function calculateBrightness(hex: string): number {
  const rgb = hexToRgb(hex).split(", ").map(Number)
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
  return Math.round((brightness / 255) * 100)
}
