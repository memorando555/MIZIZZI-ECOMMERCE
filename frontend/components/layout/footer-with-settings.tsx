"use client"

import Image from "next/image"
import Link from "next/link"
import { Facebook, Instagram, Twitter, Linkedin, ChevronUp, ChevronDown, Gem } from "lucide-react"
import { useState, useEffect } from "react"
import type { FooterSettingsData } from "@/lib/server/get-footer-settings"
import { PaymentLogo } from "@/components/payment-logos/svg-payment-logos"

interface PaymentMethod {
  id: string
  name: string
  icon: string
  isImage?: boolean
  logoType?: "mpesa" | "pesapal" | "visa" | "mastercard" | "airtel" | "amex"
}

interface FooterWithSettingsProps {
  initialSettings?: FooterSettingsData | null
}

// Default settings inline for instant render
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

// Static payment methods - using SVG logos instead of PNG for optimization
const staticPaymentMethods: PaymentMethod[] = [
  { id: "mpesa", name: "M-Pesa", icon: "", isImage: false, logoType: "mpesa" },
  { id: "pesapal", name: "Pesapal", icon: "", isImage: false, logoType: "pesapal" },
  { id: "visa", name: "Visa", icon: "", isImage: false, logoType: "visa" },
  { id: "mastercard", name: "Mastercard", icon: "", isImage: false, logoType: "mastercard" },
  { id: "airtel", name: "Airtel Money", icon: "", isImage: false, logoType: "airtel" },
]

export function FooterWithSettings({ initialSettings }: FooterWithSettingsProps) {
  const [settings, setSettings] = useState<FooterSettingsData>(initialSettings || defaultSettings)
  const [email, setEmail] = useState("")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  useEffect(() => {
    // Scroll handler
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener("scroll", handleScroll)

    // Don't block rendering, just update in background
    const refreshSettings = async () => {
      try {
        const response = await fetch(`/api/footer/settings`, {
          cache: "no-store",
        })
        if (response.ok) {
          const data = await response.json()
          const settingsData = data.data || data
          setSettings((prev) => ({ ...prev, ...settingsData }))
        }
      } catch {
        // Silently fail - we already have settings
      }
    }

    // Background refresh after 10 seconds (non-blocking)
    const timeout = setTimeout(refreshSettings, 10000)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearTimeout(timeout)
    }
  }, [])

  const footerSettings = settings

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <footer className="text-white" style={{ backgroundColor: footerSettings.colors.background }}>
      {/* MOBILE: Accordion Style Footer */}
      <div className="md:hidden px-6 py-8 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold">{footerSettings.company.name}</h2>
          <p className="text-sm opacity-50">{footerSettings.company.tagline}</p>
        </div>

        {/* Newsletter */}
        <div className="space-y-3 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg px-4 py-3 text-sm bg-white/10 text-white placeholder-white/40 focus:outline-none focus:bg-white/15 transition-colors border-0"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-lg text-sm font-medium transition-transform active:scale-95"
              style={{
                backgroundColor: footerSettings.colors.accent,
                color: "#000",
              }}
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-2">
          {/* About Mizizzi Section */}
          <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => toggleSection("about")}
              className="w-full py-3 flex items-center justify-between text-left"
            >
              <span
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: footerSettings.colors.accent }}
              >
                About {footerSettings.company.name}
              </span>
              {expandedSection === "about" ? (
                <ChevronUp size={16} style={{ color: footerSettings.colors.accent }} />
              ) : (
                <ChevronDown size={16} style={{ color: footerSettings.colors.accent }} />
              )}
            </button>

            {expandedSection === "about" && (
              <div className="pb-4 animate-in slide-in-from-top-2 duration-200">
                <ul className="space-y-2.5 pl-2">
                  {footerSettings.sections.about.map((label) => (
                    <li key={label}>
                      <Link
                        href={`/${label.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm opacity-70 transition-opacity active:opacity-100 block py-1"
                        style={{ color: footerSettings.colors.link }}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Shop by Category Section */}
          <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => toggleSection("categories")}
              className="w-full py-3 flex items-center justify-between text-left"
            >
              <span
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: footerSettings.colors.accent }}
              >
                Shop by Category
              </span>
              {expandedSection === "categories" ? (
                <ChevronUp size={16} style={{ color: footerSettings.colors.accent }} />
              ) : (
                <ChevronDown size={16} style={{ color: footerSettings.colors.accent }} />
              )}
            </button>

            {expandedSection === "categories" && (
              <div className="pb-4 animate-in slide-in-from-top-2 duration-200">
                <ul className="space-y-2.5 pl-2">
                  {footerSettings.sections.categories.map((category) => (
                    <li key={category}>
                      <Link
                        href={`/category/${category.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm opacity-70 transition-opacity active:opacity-100 block py-1"
                        style={{ color: footerSettings.colors.link }}
                      >
                        {category}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Connect Section */}
          <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => toggleSection("connect")}
              className="w-full py-3 flex items-center justify-between text-left"
            >
              <span
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: footerSettings.colors.accent }}
              >
                Connect
              </span>
              {expandedSection === "connect" ? (
                <ChevronUp size={16} style={{ color: footerSettings.colors.accent }} />
              ) : (
                <ChevronDown size={16} style={{ color: footerSettings.colors.accent }} />
              )}
            </button>

            {expandedSection === "connect" && (
              <div className="pb-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex gap-3 pl-2 pt-2">
                  {[
                    { icon: Facebook, href: footerSettings.social.facebook, label: "Facebook" },
                    { icon: Instagram, href: footerSettings.social.instagram, label: "Instagram" },
                    { icon: Twitter, href: footerSettings.social.twitter, label: "Twitter" },
                  ].map(({ icon: Icon, href, label }) => (
                    <Link
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
                      style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    >
                      <Icon size={18} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Support Section */}
          <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => toggleSection("support")}
              className="w-full py-3 flex items-center justify-between text-left"
            >
              <span
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: footerSettings.colors.accent }}
              >
                Support
              </span>
              {expandedSection === "support" ? (
                <ChevronUp size={16} style={{ color: footerSettings.colors.accent }} />
              ) : (
                <ChevronDown size={16} style={{ color: footerSettings.colors.accent }} />
              )}
            </button>

            {expandedSection === "support" && (
              <div className="pb-4 animate-in slide-in-from-top-2 duration-200">
                <div className="pl-2 space-y-2">
                  <a
                    href={`mailto:${footerSettings.contact.email}`}
                    className="text-sm opacity-70 block py-1"
                    style={{ color: footerSettings.colors.link }}
                  >
                    {footerSettings.contact.email}
                  </a>
                  <div className="flex gap-4 text-xs opacity-60 pt-2">
                    {footerSettings.sections.needHelp.map((link) => (
                      <Link
                        key={link}
                        href={`/${link.toLowerCase().replace(/\s+/g, "-")}`}
                        className="transition-opacity active:opacity-100"
                      >
                        {link}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods Section */}
          <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => toggleSection("payment")}
              className="w-full py-3 flex items-center justify-between text-left"
            >
              <span
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: footerSettings.colors.accent }}
              >
                Payment Methods
              </span>
              {expandedSection === "payment" ? (
                <ChevronUp size={16} style={{ color: footerSettings.colors.accent }} />
              ) : (
                <ChevronDown size={16} style={{ color: footerSettings.colors.accent }} />
              )}
            </button>

            {expandedSection === "payment" && (
              <div className="pb-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-wrap gap-3">
                  {staticPaymentMethods.map((method, idx) => (
                    <div
                      key={idx}
                      className="relative flex items-center justify-center w-12 h-8 rounded bg-white p-1 shadow-sm overflow-hidden"
                      title={method.name}
                    >
                      {method.logoType ? (
                        <PaymentLogo type={method.logoType} className="w-full h-full" alt={method.name} />
                      ) : (
                        <span className="text-lg">{method.icon}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legal */}
        <div className="pt-4 space-y-2">
          <p className="text-xs opacity-40 text-center">
            © {new Date().getFullYear()} {footerSettings.company.name}
          </p>
          <div className="flex gap-4 justify-center text-xs opacity-50">
            <Link href="/privacy" className="transition-opacity active:opacity-100">
              Privacy
            </Link>
            <Link href="/terms" className="transition-opacity active:opacity-100">
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* DESKTOP: Full Featured Footer */}
      <div className="hidden md:block">
        {/* Newsletter & Luxury Section */}
        <div
          className="px-4 py-12 sm:px-6 lg:px-8 text-white border-b"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 md:grid-cols-3 md:items-start">
              {/* Logo and tagline */}
              <div className="md:col-span-1 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">{footerSettings.company.name}</h2>
                  <p className="mt-2 text-sm text-gray-400">{footerSettings.company.tagline}</p>
                </div>
                <div className="flex gap-4">
                  {[
                    { icon: Facebook, href: footerSettings.social.facebook, label: "Facebook" },
                    { icon: Instagram, href: footerSettings.social.instagram, label: "Instagram" },
                    { icon: Twitter, href: footerSettings.social.twitter, label: "Twitter" },
                    { icon: Linkedin, href: footerSettings.social.linkedin, label: "LinkedIn" },
                  ].map(({ icon: Icon, href, label }, idx) => (
                    <Link
                      key={idx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={label}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Icon size={20} />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter signup */}
              <div className="md:col-span-1">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                  New to {footerSettings.company.name}?
                </h3>
                <p className="mb-4 text-sm text-gray-400">
                  Subscribe to our newsletter to get updates on our latest offers!
                </p>
                <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter E-mail Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 rounded-md px-4 py-2.5 text-sm bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:bg-white/15 transition-all"
                    />
                    <button
                      type="submit"
                      className="rounded-md px-6 py-2.5 text-sm font-bold transition-all hover:brightness-110 whitespace-nowrap"
                      style={{
                        backgroundColor: footerSettings.colors.accent,
                        color: "#000",
                      }}
                    >
                      Subscribe
                    </button>
                  </div>
                  <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">
                    <input type="checkbox" className="mt-0.5 rounded border-gray-600 bg-transparent" defaultChecked />
                    <span>I agree to {footerSettings.company.name}&apos;s Privacy Policy</span>
                  </label>
                </form>
              </div>

              {/* Luxury Products */}
              <div className="md:col-span-1">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Gem size={16} className="text-yellow-500" />
                  Luxury Products
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Experience the finest collection of premium items selected just for you.
                  </p>
                  <Link
                    href="/luxury"
                    className="inline-flex items-center gap-2 text-sm font-semibold hover:underline decoration-2 underline-offset-4"
                    style={{ color: footerSettings.colors.accent }}
                  >
                    View Luxury Deals
                    <span className="text-xs">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-5">
              {/* Need Help */}
              <div>
                <h3
                  className="mb-4 text-sm font-bold uppercase tracking-wider"
                  style={{ color: footerSettings.colors.accent }}
                >
                  Need Help?
                </h3>
                <ul className="space-y-2">
                  {footerSettings.sections.needHelp.map((label) => (
                    <li key={label}>
                      <Link
                        href={`/${label.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm transition-colors hover:text-white"
                        style={{ color: footerSettings.colors.link }}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* About */}
              <div>
                <h3
                  className="mb-4 text-sm font-bold uppercase tracking-wider"
                  style={{ color: footerSettings.colors.accent }}
                >
                  About {footerSettings.company.name}
                </h3>
                <ul className="space-y-2">
                  {footerSettings.sections.about.map((label) => (
                    <li key={label}>
                      <Link
                        href={`/${label.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm transition-colors hover:text-white"
                        style={{ color: footerSettings.colors.link }}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Categories */}
              <div>
                <h3
                  className="mb-4 text-sm font-bold uppercase tracking-wider"
                  style={{ color: footerSettings.colors.accent }}
                >
                  Shop by Category
                </h3>
                <ul className="space-y-2">
                  {footerSettings.sections.categories.map((category) => (
                    <li key={category}>
                      <Link
                        href={`/category/${category.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm transition-colors hover:text-white"
                        style={{ color: footerSettings.colors.link }}
                      >
                        {category}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Useful Links */}
              <div>
                <h3
                  className="mb-4 text-sm font-bold uppercase tracking-wider"
                  style={{ color: footerSettings.colors.accent }}
                >
                  Useful Links
                </h3>
                <ul className="space-y-2">
                  {footerSettings.sections.usefulLinks.map((label) => (
                    <li key={label}>
                      <Link
                        href={`/${label.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm transition-colors hover:text-white"
                        style={{ color: footerSettings.colors.link }}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment & Contact */}
              <div>
                <h3
                  className="mb-4 text-sm font-bold uppercase tracking-wider"
                  style={{ color: footerSettings.colors.accent }}
                >
                  Payment Methods
                </h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {staticPaymentMethods.map((method, idx) => (
                    <div
                      key={idx}
                      className="relative flex items-center justify-center w-12 h-8 rounded bg-white p-1 shadow-sm overflow-hidden"
                      title={method.name}
                    >
                      {method.logoType ? (
                        <PaymentLogo type={method.logoType} className="w-full h-full" alt={method.name} />
                      ) : (
                        <span className="text-lg">{method.icon}</span>
                      )}
                    </div>
                  ))}
                </div>

                <h3
                  className="mb-4 text-sm font-bold uppercase tracking-wider"
                  style={{ color: footerSettings.colors.accent }}
                >
                  Contact Us
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: footerSettings.colors.link }}>
                  <li>{footerSettings.contact.email}</li>
                  <li>{footerSettings.contact.phone}</li>
                  <li>{footerSettings.contact.address}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t px-4 py-6 sm:px-6 lg:px-8" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm opacity-60">
              © {new Date().getFullYear()} {footerSettings.company.name}. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm opacity-60">
              <Link href="/privacy" className="hover:opacity-100 transition-opacity">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:opacity-100 transition-opacity">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg transition-all hover:scale-110 z-50"
          style={{ backgroundColor: footerSettings.colors.accent, color: "#000" }}
          aria-label="Scroll to top"
        >
          <ChevronUp size={20} />
        </button>
      )}
    </footer>
  )
}
