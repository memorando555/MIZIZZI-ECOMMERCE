"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { websocketService } from "@/services/websocket"

interface ThemeColors {
  primary: {
    main: string
    light: string
    dark: string
  }
  secondary: {
    main: string
    accent: string
  }
  background: {
    main: string
    card: string
    surface: string
  }
  text: {
    primary: string
    secondary: string
    onPrimary: string
  }
  border: {
    main: string
    divider: string
  }
  button: {
    primary: {
      background: string
      text: string
      hover: string
    }
    secondary: {
      background: string
      text: string
    }
  }
  status: {
    success: string
    warning: string
    error: string
    info: string
  }
  header: {
    background: string
    text: string
  }
  footer: {
    background: string
    text: string
  }
  link: {
    main: string
    hover: string
  }
  badge: {
    background: string
    text: string
  }
  navigation: {
    background: string
    text: string
    active: string
  }
  carousel: {
    background: string
    overlayDark: string
    overlayLight: string
    badgeBg: string
    badgeText: string
  }
}

interface Theme {
  id: number
  name: string
  is_active: boolean
  colors: ThemeColors
}

interface ThemeContextType {
  theme: Theme | null
  isLoading: boolean
  refreshTheme: () => Promise<void>
  applyTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
const THEME_STORAGE_KEY = "mizizzi_active_theme"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const applyTheme = useCallback((themeData: Theme) => {
    if (!themeData || !themeData.colors) return

    const root = document.documentElement
    const { colors } = themeData

    root.style.setProperty("--color-primary", colors.primary.main)
    root.style.setProperty("--color-primary-light", colors.primary.light)
    root.style.setProperty("--color-primary-dark", colors.primary.dark)
    root.style.setProperty("--color-secondary", colors.secondary.main)
    root.style.setProperty("--color-accent", colors.secondary.accent)

    root.style.setProperty("--color-background", colors.background.main)
    root.style.setProperty("--color-card-bg", colors.background.card)
    root.style.setProperty("--color-surface", colors.background.surface)

    root.style.setProperty("--color-text-primary", colors.text.primary)
    root.style.setProperty("--color-text-secondary", colors.text.secondary)
    root.style.setProperty("--color-text-on-primary", colors.text.onPrimary)

    root.style.setProperty("--color-border", colors.border.main)
    root.style.setProperty("--color-divider", colors.border.divider)

    root.style.setProperty("--color-button-primary-bg", colors.button.primary.background)
    root.style.setProperty("--color-button-primary-text", colors.button.primary.text)
    root.style.setProperty("--color-button-primary-hover", colors.button.primary.hover)
    root.style.setProperty("--color-button-secondary-bg", colors.button.secondary.background)
    root.style.setProperty("--color-button-secondary-text", colors.button.secondary.text)

    root.style.setProperty("--color-success", colors.status.success)
    root.style.setProperty("--color-warning", colors.status.warning)
    root.style.setProperty("--color-error", colors.status.error)
    root.style.setProperty("--color-info", colors.status.info)

    root.style.setProperty("--color-header-bg", colors.header.background)
    root.style.setProperty("--color-header-text", colors.header.text)
    root.style.setProperty("--color-footer-bg", colors.footer.background)
    root.style.setProperty("--color-footer-text", colors.footer.text)

    root.style.setProperty("--color-link", colors.link.main)
    root.style.setProperty("--color-link-hover", colors.link.hover)

    root.style.setProperty("--color-badge-bg", colors.badge.background)
    root.style.setProperty("--color-badge-text", colors.badge.text)

    root.style.setProperty("--color-nav-bg", colors.navigation.background)
    root.style.setProperty("--color-nav-text", colors.navigation.text)
    root.style.setProperty("--color-nav-active", colors.navigation.active)

    root.style.setProperty("--color-carousel-bg", colors.carousel.background)
    root.style.setProperty("--color-carousel-overlay-dark", colors.carousel.overlayDark)
    root.style.setProperty("--color-carousel-overlay-light", colors.carousel.overlayLight)
    root.style.setProperty("--color-carousel-badge-bg", colors.carousel.badgeBg)
    root.style.setProperty("--color-carousel-badge-text", colors.carousel.badgeText)

    setTheme(themeData)

    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeData))
    } catch (error) {
      console.error("[v0] Error saving theme to localStorage:", error)
    }
  }, [])

  const refreshTheme = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"}/api/theme/active`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch theme")
      }

      const data = await response.json()

      if (data.success && data.theme) {
        applyTheme(data.theme)
      }
    } catch (error) {
      console.error("[v0] Error fetching theme:", error)
    } finally {
      setIsLoading(false)
    }
  }, [applyTheme])

  useEffect(() => {
    try {
      const cachedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (cachedTheme) {
        const parsedTheme = JSON.parse(cachedTheme) as Theme
        applyTheme(parsedTheme)
      }
    } catch (error) {
      console.error("[v0] Error loading cached theme:", error)
    }

    // Then fetch fresh theme from API (will update if changed)
    refreshTheme()

    const unsubscribe = websocketService.on("theme_updated", (data: any) => {
      console.log("[v0] Theme updated via WebSocket:", data)
      if (data.theme) {
        applyTheme(data.theme)
      }
    })

    // Keep polling as fallback (increased to 15 seconds for better performance)
    const interval = setInterval(() => {
      refreshTheme()
    }, 15000)

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [refreshTheme, applyTheme])

  return (
    <ThemeContext.Provider value={{ theme, isLoading, refreshTheme, applyTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
