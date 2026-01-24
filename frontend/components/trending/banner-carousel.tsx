"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useState, useEffect } from "react"

interface FlashSaleEvent {
  id: number
  name: string
  time_remaining: number
}

export function TrendingBannerCarousel({ event }: { event?: FlashSaleEvent | null }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (event) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = event.time_remaining - now;
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });

        if (distance < 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [event]);

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
          <div className="relative z-10 space-y-3 sm:space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-3 sm:space-y-4">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-block"
              >
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/40">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/80 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white/90"></span>
                  </span>
                  Trending Now
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl sm:text-4xl lg:text-3xl font-black text-white leading-tight tracking-tight"
              >
                Hot Right Now
              </motion.h2>

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

            {/* Trending Announcement */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-2"
            >
              <p className="text-white/80 text-[10px] font-semibold uppercase tracking-widest">Today's Special</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">Save</span>
                <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-yellow-200 to-yellow-100 bg-clip-text text-transparent">Up to 60%</span>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <button className="px-5 py-2 bg-white hover:bg-gray-50 text-red-700 font-bold text-xs sm:text-sm rounded-lg transition-all duration-300 hover:shadow-lg active:scale-95 uppercase tracking-wide">
                Browse Trending
              </button>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Static Image */}
        <div className="relative col-span-1 lg:col-span-2 bg-gradient-to-br from-neutral-900 to-neutral-800 overflow-hidden">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full h-full"
          >
            <Image
              src="https://images.pexels.com/photos/29887462/pexels-photo-29887462.jpeg"
              alt="Trending deals"
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover"
              priority
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-transparent" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
