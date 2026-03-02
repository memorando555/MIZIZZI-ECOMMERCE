import type React from "react"
import { Suspense } from "react"
import { headers } from "next/headers"
import { TopBar } from "@/components/layout/top-bar"
import { Header } from "@/components/layout/header"
import { FooterWithSettings } from "@/components/layout/footer-with-settings"
import ScrollToTop from "@/components/shared/scroll-to-top"
import { LayoutRendererClient } from "@/components/layout/layout-renderer-client"
import { getCategoriesWithSubcategories } from "@/lib/server/get-categories"

async function LayoutContent() {
  // Check if this is an admin route (but keep header/footer for auth)
  let isAdminRoute = false
  try {
    const headersList = await headers()
    const pathname = headersList.get("x-pathname") || ""
    isAdminRoute = pathname?.startsWith("/admin") || false
  } catch (error) {
    // Silently handle errors - default to non-admin
  }

  // Don't render store layout for admin routes
  if (isAdminRoute) {
    return null
  }

  // Fetch categories server-side to pass to Header
  let categories: Awaited<ReturnType<typeof getCategoriesWithSubcategories>> = []
  try {
    categories = await getCategoriesWithSubcategories()
  } catch (error) {
    // Silently handle errors - will use empty array
  }

  return (
    <>
      <TopBar />
      <Header categories={categories} />
    </>
  )
}

async function FooterContent() {
  // Check if this is an admin route (but keep footer for auth)
  let isAdminRoute = false
  try {
    const headersList = await headers()
    const pathname = headersList.get("x-pathname") || ""
    isAdminRoute = pathname?.startsWith("/admin") || false
  } catch (error) {
    // Silently handle errors - default to non-admin
  }

  // Don't render footer for admin routes
  if (isAdminRoute) {
    return null
  }

  return (
    <>
      <ScrollToTop />
      <FooterWithSettings />
    </>
  )
}

export async function LayoutRenderer({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LayoutContent />
      <LayoutRendererClient>{children}</LayoutRendererClient>
      <FooterContent />
    </Suspense>
  )
}
