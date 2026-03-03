"use client"

import { useState, useEffect } from "react"
import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
}

const testimonials = [
  {
    name: "Sofia Davis",
    role: "Premium Customer",
    initials: "SD",
    quote: "Great quality, fast delivery, and a smooth experience!",
  },
  {
    name: "James Miller",
    role: "Verified Buyer",
    initials: "JM",
    quote: "Mizizzi never disappoints with their service!",
  },
  {
    name: "Amina Khan",
    role: "Loyal Customer",
    initials: "AK",
    quote: "The platform is intuitive and shopping feels personalized!",
  },
]

export function AuthLayout({ children, className }: AuthLayoutProps) {
  const [current, setCurrent] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [mounted])

  if (!mounted) {
    return (
      <div className="flex justify-center items-start pt-3 px-3 min-h-screen bg-gradient-to-br from-cherry-50 via-white to-gold-50">
        <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-7 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="hidden md:block md:col-span-3 bg-gradient-to-br from-cherry-600 to-cherry-800 p-6"></div>
          <div className="p-4 md:col-span-4 flex flex-col justify-center">
            <div className="mx-auto w-full max-w-sm h-64 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-start pt-2 px-3 min-h-screen bg-gradient-to-br from-cherry-50 via-white to-gold-50">
      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-7 bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Image Section - Compact */}
        <div className="relative hidden md:flex md:col-span-3 bg-gradient-to-br from-cherry-600 to-cherry-800 flex-col items-center justify-between p-4 min-h-[500px]">
          {/* Logo */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
            <motion.div
              className="mb-3 p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src="/logo.png"
                alt="Mizizzi Store"
                width={80}
                height={80}
                className="rounded-lg"
                priority={true}
              />
            </motion.div>
            <motion.h1
              className="text-2xl font-bold text-white text-center mb-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Mizizzi Store
            </motion.h1>
            <motion.p
              className="text-white/70 text-center text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Premium E-commerce
            </motion.p>
          </div>

          {/* Testimonial */}
          <div className="relative z-10 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20 shadow-lg"
              >
                <blockquote className="text-xs font-medium text-white leading-snug">
                  "{testimonials[current].quote}"
                </blockquote>
                <footer className="text-xs text-white/70 mt-1.5 flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-semibold">{testimonials[current].initials}</span>
                  </div>
                  <span className="truncate">{testimonials[current].name}</span>
                </footer>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Form Section - Compact */}
        <div className={cn("p-4 md:p-5 md:col-span-4 flex flex-col justify-center", className)}>
          <div className="mx-auto w-full max-w-sm">
            <Link href="/" className="mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="Mizizzi"
                width={36}
                height={36}
                className="rounded"
                priority={true}
              />
              <span className="text-lg font-bold text-gray-900">Mizizzi</span>
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
