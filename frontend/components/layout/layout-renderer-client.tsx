"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export function LayoutRendererClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/auth")

  // For admin and auth routes, render children directly without wrapper
  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        className="min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}
