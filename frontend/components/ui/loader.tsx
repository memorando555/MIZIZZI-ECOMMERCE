"use client"

import { motion } from "framer-motion"

export function Loader() {
  return (
    <div className="flex items-center justify-center py-8">
      {/* Netflix-style rotating crescent spinner - Dark Cherry Red */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20">
        <svg
          className="w-full h-full drop-shadow-lg"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer rotating arc - Dark Cherry Red */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#8B1428"
            strokeWidth="6"
            strokeDasharray="62.8 188.4"
            strokeLinecap="round"
            animate={{ 
              rotate: 360,
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{ transformOrigin: "50px 50px" }}
          />
          
          {/* Secondary accent arc - subtle glow effect */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#8B1428"
            strokeWidth="2"
            strokeDasharray="62.8 188.4"
            strokeLinecap="round"
            opacity={0.3}
            animate={{ 
              rotate: -360,
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{ transformOrigin: "50px 50px" }}
          />
        </svg>
      </div>
    </div>
  )
}


