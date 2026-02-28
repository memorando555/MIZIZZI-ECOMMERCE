"use client"

import { motion } from "framer-motion"

export function Loader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-black">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Netflix-style spinner */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
          {/* Outer rotating circle */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 border-r-red-600"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />

          {/* Middle rotating circle (opposite direction) */}
          <motion.div
            className="absolute inset-2 rounded-full border-4 border-transparent border-b-red-500 border-l-red-500"
            animate={{ rotate: -360 }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />

          {/* Inner pulsing circle */}
          <motion.div
            className="absolute inset-6 rounded-full bg-gradient-to-br from-red-600 to-red-800"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          {/* Netflix "N" text center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-2xl sm:text-3xl select-none">N</span>
          </div>
        </div>

        {/* Loading text */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-white text-sm sm:text-base font-medium">Loading...</p>
          <div className="flex gap-1 justify-center mt-2">
            <motion.div
              className="h-1 w-1 bg-red-600 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className="h-1 w-1 bg-red-600 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
            />
            <motion.div
              className="h-1 w-1 bg-red-600 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
