"use client"

import { motion } from "framer-motion"

export function Loader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-black">
      <div className="flex flex-col items-center justify-center gap-8">
        {/* Netflix-style rotating crescent */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#E50914"
              strokeWidth="8"
              strokeDasharray="70.7 282.8"
              strokeLinecap="round"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              style={{ transformOrigin: "50px 50px" }}
            />
          </svg>
        </div>

        {/* Loading text */}
        <motion.p
          className="text-white text-xs sm:text-sm font-medium tracking-widest"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          LOADING...
        </motion.p>
      </div>
    </div>
  )
}
