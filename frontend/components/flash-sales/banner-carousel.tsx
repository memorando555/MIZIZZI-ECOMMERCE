"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import type { FlashSaleEvent } from "@/lib/server/get-flash-sale-products"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Typewriter effect component
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("")

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.substring(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [text])

  return <span>{displayedText}</span>
}

// Countdown timer component
function CountdownTimer({ event }: { event: FlashSaleEvent | null }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (event?.time_remaining) {
        const total = event.time_remaining
        setTimeLeft({
          hours: Math.floor(total / 3600),
          minutes: Math.floor((total % 3600) / 60),
          seconds: total % 60,
        })
      } else {
        const now = new Date()
        const endOfDay = new Date(now)
        endOfDay.setHours(23, 59, 59, 999)
        const total = Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000))
        setTimeLeft({
          hours: Math.floor(total / 3600),
          minutes: Math.floor((total % 3600) / 60),
          seconds: total % 60,
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [event?.time_remaining])

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className="flex flex-col items-center gap-0.5">
        <div className="bg-white/25 backdrop-blur-md rounded-lg px-2.5 sm:px-3 py-1.5 min-w-[44px] sm:min-w-[56px] text-center">
          <span className="text-lg sm:text-2xl font-bold text-white tabular-nums">{String(timeLeft.hours).padStart(2, "0")}</span>
        </div>
        <span className="text-[9px] sm:text-xs text-white/75 font-semibold">Hours</span>
      </div>
      <span className="text-xl sm:text-3xl text-white/40 font-light mb-3">:</span>
      <div className="flex flex-col items-center gap-0.5">
        <div className="bg-white/25 backdrop-blur-md rounded-lg px-2.5 sm:px-3 py-1.5 min-w-[44px] sm:min-w-[56px] text-center">
          <span className="text-lg sm:text-2xl font-bold text-white tabular-nums">{String(timeLeft.minutes).padStart(2, "0")}</span>
        </div>
        <span className="text-[9px] sm:text-xs text-white/75 font-semibold">Minutes</span>
      </div>
      <span className="text-xl sm:text-3xl text-white/40 font-light mb-3">:</span>
      <div className="flex flex-col items-center gap-0.5">
        <div className="bg-white/25 backdrop-blur-md rounded-lg px-2.5 sm:px-3 py-1.5 min-w-[44px] sm:min-w-[56px] text-center">
          <span className="text-lg sm:text-2xl font-bold text-white tabular-nums">{String(timeLeft.seconds).padStart(2, "0")}</span>
        </div>
        <span className="text-[9px] sm:text-xs text-white/75 font-semibold">Seconds</span>
      </div>
    </div>
  )
}

// Banner images - cool, minimal, non-shouting aesthetic
const bannerImages = [
  {
    url: "https://images.pexels.com/photos/20318840/pexels-photo-20318840.jpeg",
    description: "Premium shopping deals",
  },
  {
    url: "https://images.pexels.com/photos/3760770/pexels-photo-3760770.jpeg",
    description: "Curated collections",
  },
  {
    url: "https://images.pexels.com/photos/35552841/pexels-photo-35552841.jpeg",
    description: "Exclusive selections",
  },
  {
    url: "https://images.pexels.com/photos/5868119/pexels-photo-5868119.jpeg",
    description: "Limited time offers",
  },
]

export function FlashSaleBannerCarousel({ event }: { event: FlashSaleEvent | null }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true)

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    if (!autoPlayEnabled) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % bannerImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [autoPlayEnabled])

  const goToPrevious = () => {
    setAutoPlayEnabled(false)
    setCurrentImageIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length)
    setTimeout(() => setAutoPlayEnabled(true), 3000)
  }

  const goToNext = () => {
    setAutoPlayEnabled(false)
    setCurrentImageIndex((prev) => (prev + 1) % bannerImages.length)
    setTimeout(() => setAutoPlayEnabled(true), 3000)
  }

  const goToImage = (index: number) => {
    setAutoPlayEnabled(false)
    setCurrentImageIndex(index)
    setTimeout(() => setAutoPlayEnabled(true), 3000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-8 relative overflow-hidden rounded-2xl shadow-xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[160px] md:min-h-[180px] lg:min-h-[200px]">
        {/* Left Side - Content Section */}
        <div className="relative col-span-1 bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden">
          {/* Decorative mesh background */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
                  <circle cx="10" cy="10" r="2" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10 space-y-2 sm:space-y-3">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block"
            >
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/40">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/80 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white/90"></span>
                </span>
                Limited Time Offer
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-3xl font-black text-white leading-tight tracking-tight">
                <TypewriterText text="Flash" />
              </h2>
              <h2 className="text-3xl sm:text-4xl lg:text-3xl font-black text-white leading-tight tracking-tight -mt-1">
                <span className="text-red-200">Sale</span>
              </h2>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-white/95 text-xs sm:text-sm max-w-xs leading-snug"
            >
              Don't miss out on exclusive deals on premium products
            </motion.p>
          </div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="relative z-10"
          >
            <p className="text-white/80 text-[10px] font-semibold mb-2 uppercase tracking-widest">Sale Ends In</p>
            <CountdownTimer event={event} />
          </motion.div>
        </div>

        {/* Right Side - Image Carousel */}
        <div className="relative col-span-1 lg:col-span-2 bg-gradient-to-br from-neutral-900 to-neutral-800 overflow-hidden group">
          {/* Image Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={bannerImages[currentImageIndex].url || "/placeholder.svg"}
                alt={bannerImages[currentImageIndex].description}
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover"
                priority
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-red-900/10 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons - Left */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ x: -2 }}
            onClick={goToPrevious}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full p-2 sm:p-2.5 transition-all duration-200 text-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>

          {/* Navigation Buttons - Right */}
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            whileHover={{ x: 2 }}
            onClick={goToNext}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full p-2 sm:p-2.5 transition-all duration-200 text-white"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>

          {/* Indicator Dots */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {bannerImages.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToImage(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentImageIndex
                    ? "bg-white/90 w-6 sm:w-7"
                    : "bg-white/40 hover:bg-white/60 w-2 h-2 sm:w-2 sm:h-2"
                }`}
                whileHover={{ scale: 1.2 }}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Discount Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.3, type: "spring" }}
            className="absolute top-4 sm:top-6 right-4 sm:right-6 z-30"
          >
            <div className="bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-xl shadow-lg px-3 sm:px-4 py-2 sm:py-3 text-center border-2 border-white/30">
              <p className="text-red-700 text-[10px] sm:text-xs font-black uppercase leading-none">Up To</p>
              <p className="text-red-700 text-2xl sm:text-3xl font-black leading-none">70%</p>
              <p className="text-red-700 text-[9px] sm:text-xs font-black uppercase leading-none">Off</p>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-30"
          >
            <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white hover:bg-gray-50 text-red-700 font-bold text-xs sm:text-sm rounded-full transition-all duration-300 hover:shadow-xl active:scale-95 uppercase tracking-wide border-2 border-white">
              Shop Now
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
