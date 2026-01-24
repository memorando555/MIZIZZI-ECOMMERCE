"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function DailyFindsBannerCarousel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-8 relative overflow-hidden rounded-2xl shadow-xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[160px] md:min-h-[180px] lg:min-h-[200px]">
        {/* Left Side - Content Section */}
        <div className="relative col-span-1 bg-[#1a1a1a] p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden">
          {/* Decorative mesh background */}
          <div className="absolute inset-0 opacity-5">
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
                <span className="inline-flex items-center gap-1.5 bg-yellow-400/20 backdrop-blur-sm text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full border border-yellow-400/40">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300/80 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300/90"></span>
                  </span>
                  Daily Finds
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl sm:text-4xl lg:text-3xl font-black text-white leading-tight tracking-tight"
              >
                Today's Best
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-xs sm:text-sm max-w-xs leading-snug"
              >
                Special deals that refresh every day
              </motion.p>
            </div>

            {/* Daily Finds Announcement */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-2"
            >
              <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest">Limited Time</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">Save</span>
                <span className="text-3xl sm:text-4xl font-black text-yellow-300">Up to 60%</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Static Image */}
        <div className="relative col-span-1 lg:col-span-2 bg-[#1a1a1a] overflow-hidden">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full h-full"
          >
            <Image
              src="https://images.pexels.com/photos/4997894/pexels-photo-4997894.jpeg"
              alt="Daily finds"
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover"
              priority
            />
            {/* Subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
