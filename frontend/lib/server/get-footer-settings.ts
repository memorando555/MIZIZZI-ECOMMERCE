import { cache } from "react"
import { API_BASE_URL } from "../config"

export interface FooterSettingsData {
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

// Default footer settings - used as fallback
const defaultSettings: FooterSettingsData = {
  colors: {
    background: "#2D2D2D",
    text: "#FFFFFF",
    accent: "#FFA500",
    link: "#B8B8B8",
    linkHover: "#FFFFFF",
  },
  company: {
    name: "Mizizzi",
    tagline: "Your Local Marketplace",
  },
  contact: {
    email: "support@mizizzi.com",
    phone: "+254 700 123 456",
    address: "Nairobi, Kenya",
  },
  social: {
    facebook: "https://facebook.com/mizizzi",
    instagram: "https://instagram.com/mizizzi",
    twitter: "https://twitter.com/mizizzi",
    linkedin: "https://linkedin.com/company/mizizzi",
  },
  sections: {
    needHelp: ["Chat with us", "Help Center", "Contact Us"],
    about: ["About us", "Returns and Refunds Policy", "Careers", "Terms and Conditions", "Privacy Notice"],
    categories: ["Accessories", "Activewear", "Bags", "Clothing", "Electronics", "Jewelry"],
    usefulLinks: ["Track Your Order", "Shipping and delivery", "Return Policy"],
    resources: ["Size Guide", "Shipping Info", "Gift Cards", "FAQ", "Store Locator"],
  },
  paymentMethods: ["Pesapal", "M-Pesa", "Card Payment", "Airtel Money", "Cash on Delivery"],
}

// Server-side cached fetcher for footer settings
export const getFooterSettings = cache(async (): Promise<FooterSettingsData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/footer/settings`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn("[Footer] API returned non-OK status, using defaults")
      return defaultSettings
    }

    const data = await response.json()
    const settingsData = data.data || data

    // Merge with defaults to ensure all fields exist
    return {
      colors: { ...defaultSettings.colors, ...settingsData.colors },
      company: { ...defaultSettings.company, ...settingsData.company },
      contact: { ...defaultSettings.contact, ...settingsData.contact },
      social: { ...defaultSettings.social, ...settingsData.social },
      sections: { ...defaultSettings.sections, ...settingsData.sections },
      paymentMethods: settingsData.paymentMethods || defaultSettings.paymentMethods,
    }
  } catch (error) {
    console.warn("[Footer] Failed to fetch settings, using defaults:", error)
    return defaultSettings
  }
})

// Export default settings for immediate rendering
export { defaultSettings }
