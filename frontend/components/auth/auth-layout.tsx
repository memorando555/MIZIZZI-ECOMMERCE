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
    quote: "Mizizzi has transformed how I shop online. The experience is seamless and the products are amazing!",
  },
  {
    name: "James Miller",
    role: "Verified Buyer",
    initials: "JM",
    quote: "Great quality, fast delivery, and an overall smooth experience. Mizizzi never disappoints!",
  },
  {
    name: "Amina Khan",
    role: "Loyal Customer",
    initials: "AK",
    quote: "I love how intuitive the platform is. Shopping with Mizizzi feels personalized every time!",
  },
  {
    name: "Emeka Nwosu",
    role: "Business Owner",
    initials: "EN",
    quote: "Mizizzi helps me restock with ease. I rely on it for both quality and consistency.",
  },
  {
    name: "Lily Zhang",
    role: "Happy Customer",
    initials: "LZ",
    quote: "From browsing to checkout, everything is smooth. The attention to detail is what sets Mizizzi apart.",
  },
]

export function AuthLayout({ children, className }: AuthLayoutProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex justify-center items-start pt-3 px- min-h-screen bg-[#f9f9f9]">
      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-7 bg-white rounded-lg shadow-md overflow-hidden">
        {/* Image Section */}
        <div className="relative hidden md:block md:col-span-3 bg-gradient-to-br from-cherry-600 to-cherry-800 flex flex-col items-center justify-center p-8">
          {/* Mizizzi Logo Background */}
          <div className="absolute inset-0 opacity-10">
            <Image
              src="/logo.png"
              alt="Mizizzi Background"
              fill
              className="object-cover"
              priority={false}
              loading="lazy"
            />
          </div>

          {/* Center Logo */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1">
            <div className="mb-4 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
              <Image
                src="/logo.png"
                alt="Mizizzi Store"
                width={120}
                height={120}
                className="rounded-2xl"
                priority={false}
                loading="lazy"
              />
            </div>
            <h1 className="text-3xl font-bold text-white text-center mb-2">Mizizzi Store</h1>
            <p className="text-white/80 text-center text-sm">Premium E-commerce</p>
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30 flex flex-col justify-end p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white/10 backdrop-blur-md p-3 rounded-lg mb-3 border border-white/20 shadow-lg"
              >
                <blockquote className="text-sm font-medium text-white">"{testimonials[current].quote}"</blockquote>
                <footer className="text-xs text-white/80 mt-2 flex items-center">
                  <div className="w-6 h-6 rounded-full bg-white/30 mr-2 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">{testimonials[current].initials}</span>
                  </div>
                  {testimonials[current].name}, {testimonials[current].role}
                </footer>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Form Section */}
        <div className={cn("p-6 md:col-span-4 flex flex-col justify-center", className)}>
          <div className="mx-auto w-full max-w-sm">
            <Link href="/" className="mb-4 flex items-center">
              <Image
                src="/logo.png"
                alt="Mizizzi"
                width={40}
                height={40}
                className="mr-2"
                loading="eager"
              />
              <span className="text-xl font-bold text-gray-800">Mizizzi Store</span>
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
