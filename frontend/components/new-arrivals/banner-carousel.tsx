"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function NewArrivalsBannerCarousel() {
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
                  New Arrivals
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl sm:text-4xl lg:text-3xl font-black text-white leading-tight tracking-tight"
              >
                Just Dropped
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-sm sm:text-base text-white/90 font-medium"
              >
                Fresh products added to our collection
              </motion.p>
            </div>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-fit bg-white text-red-700 font-bold px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-blue-50 transition-colors duration-300 text-sm sm:text-base"
            >
              Explore New
            </motion.button>
          </div>
        </div>

        {/* Right Side - Images */}
        <div className="col-span-1 lg:col-span-2 relative overflow-hidden">
          <Image
            src="https://images.pexels.com/photos/29887460/pexels-photo-29887460.jpeg"
            alt="New Arrivals"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-blue-900/20"></div>
        </div>
      </div>
    </motion.div>
  )
}
