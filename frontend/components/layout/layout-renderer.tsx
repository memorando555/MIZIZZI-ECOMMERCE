import type React from "react"
import { headers } from "next/headers"
import { TopBar } from "@/components/layout/top-bar"
import { Header } from "@/components/layout/header"
import { FooterWithSettings } from "@/components/layout/footer-with-settings"
import ScrollToTop from "@/components/shared/scroll-to-top"
import { LayoutRendererClient } from "@/components/layout/layout-renderer-client"
import { getCategoriesWithSubcategories } from "@/lib/server/get-categories"

export async function LayoutRenderer({ children }: { children: React.ReactNode }) {
  // Fetch categories server-side to pass to Header
  let categories: Awaited<ReturnType<typeof getCategoriesWithSubcategories>> = []
  try {
    categories = await getCategoriesWithSubcategories()
  } catch (error) {
    // Silently handle errors - will use empty array
  }

  // Get pathname for route detection
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  const isAdminRoute = pathname?.startsWith("/admin")

  // Don't render standard layout components for admin routes
  if (isAdminRoute) {
    return children
  }

  return (
    <>
      <TopBar />
      <Header categories={categories} />
      <LayoutRendererClient>{children}</LayoutRendererClient>
      <ScrollToTop />
      <FooterWithSettings />
    </>
  )
}
