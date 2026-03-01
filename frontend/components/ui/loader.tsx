"use client"

import { motion } from "framer-motion"

export function Loader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
        className="relative h-12 w-12"
      >
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-cherry-600 border-r-cherry-600"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {/* Middle ring - offset animation */}
        <motion.div
          className="absolute inset-1 rounded-full border-3 border-transparent border-b-cherry-500 border-l-cherry-500"
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {/* Inner circle with gradient */}
        <motion.div
          className="absolute inset-3 rounded-full bg-gradient-to-br from-cherry-600/20 to-cherry-700/20"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(177, 24, 63, 0.4)",
              "0 0 0 10px rgba(177, 24, 63, 0)",
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeOut",
          }}
        />
      </motion.div>
    </div>
  )
}
