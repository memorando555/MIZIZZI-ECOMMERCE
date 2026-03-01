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
  refreshTheme: () => Promise<void>
  applyTheme: (theme: Theme) => void
  triggerFastRefresh: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
const THEME_STORAGE_KEY = "mizizzi_active_theme"

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme?: Theme | null }) {
  const [theme, setTheme] = useState<Theme | null>(initialTheme || null)
  const [lastFetchedThemeId, setLastFetchedThemeId] = useState<number | null>(initialTheme?.id || null)
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now())

  const applyTheme = useCallback((themeData: Theme) => {
    if (!themeData || !themeData.colors) {
      return
    }

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
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"}/api/theme/active`
      
      // Add cache-busting parameter to force fresh fetch
      const timestamp = new Date().getTime()
      const urlWithCacheBust = `${apiUrl}?t=${timestamp}`
      
      const response = await fetch(urlWithCacheBust, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error("Failed to fetch theme")
      }

      const data = await response.json()

      if (data.success && data.theme) {
        // Always check and apply if any color values differ
        const oldBg = theme?.colors?.background?.main
        const newBg = data.theme?.colors?.background?.main
        
        if (lastFetchedThemeId !== data.theme.id || oldBg !== newBg) {
          console.log(`[v0] 🎨 Theme refreshed - BG: ${oldBg} → ${newBg}`)
          applyTheme(data.theme)
          setLastFetchedThemeId(data.theme.id)
        } else {
          console.log("[v0] Theme up to date, no changes needed")
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching theme:", error)
    }
  }, [applyTheme, lastFetchedThemeId, theme])

  useEffect(() => {
    // Apply initial theme from SSR immediately
    if (initialTheme) {
      applyTheme(initialTheme)
      setLastFetchedThemeId(initialTheme.id)
    }

    try {
      const cachedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (cachedTheme && !initialTheme) {
        const parsedTheme = JSON.parse(cachedTheme) as Theme
        applyTheme(parsedTheme)
        setLastFetchedThemeId(parsedTheme.id)
      }
    } catch (error) {
      console.error("[v0] Error loading cached theme:", error)
    }

    // Then fetch fresh theme from API (will update if changed)
    refreshTheme()

    const unsubscribe = websocketService.on("theme_updated", (data: any) => {
      if (data.theme) {
        applyTheme(data.theme)
        setLastFetchedThemeId(data.theme.id)
      }
    })

    // Keep polling with dynamic interval (more frequent right after save, then back to normal)
    let pollInterval = 3000 // 3 seconds (fast refresh after save)
    const timeSinceLastRefresh = Date.now() - lastRefreshTime
    
    // After 30 seconds of no changes, switch to slower polling
    if (timeSinceLastRefresh > 30000) {
      pollInterval = 5000 // 5 seconds (slower polling after initial window)
    }
    
    const interval = setInterval(() => {
      refreshTheme()
    }, pollInterval)

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [refreshTheme, applyTheme, initialTheme, lastRefreshTime])

  return (
    <ThemeContext.Provider value={{ theme, refreshTheme, applyTheme, triggerFastRefresh: () => setLastRefreshTime(Date.now()) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
