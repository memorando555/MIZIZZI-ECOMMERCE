"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface LoaderProps {
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  label?: string
  variant?: "dots" | "ring" | "pulse" | "bars" | "icon"
}

/**
 * Primary Loader - Modern animated dots
 */
export function Loader({ 
  size = "md", 
  showLabel = false, 
  label = "Loading",
  variant = "dots" 
}: LoaderProps) {
  const sizeMap = {
    sm: { container: "h-8 w-8", dot: "h-2 w-2", text: "text-xs" },
    md: { container: "h-12 w-12", dot: "h-3 w-3", text: "text-sm" },
    lg: { container: "h-16 w-16", dot: "h-4 w-4", text: "text-base" },
  }

  const { container, dot, text } = sizeMap[size]

  if (variant === "icon") {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <Loader2 className={`${size === "sm" ? "h-6 w-6" : size === "lg" ? "h-10 w-10" : "h-8 w-8"} text-primary`} />
        </motion.div>
        {showLabel && (
          <motion.p
            className={`${text} font-medium text-muted-foreground text-center`}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            {label}
          </motion.p>
        )}
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <motion.div
          className={`${container} rounded-full bg-gradient-to-r from-primary to-blue-500 shadow-lg`}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.8, 0.4, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        {showLabel && (
          <motion.p
            className={`${text} font-medium text-muted-foreground text-center`}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            {label}
          </motion.p>
        )}
      </div>
    )
  }

  if (variant === "bars") {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <div className={`${container} flex items-end justify-center gap-1`}>
          {[0, 1, 2, 3, 4].map((index) => (
            <motion.div
              key={index}
              className="w-1 bg-gradient-to-t from-primary to-blue-400 rounded-full"
              animate={{ height: ["12px", "32px", "12px"] }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        {showLabel && (
          <motion.p
            className={`${text} font-medium text-muted-foreground text-center`}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 0.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            {label}
          </motion.p>
        )}
      </div>
    )
  }

  if (variant === "ring") {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <div className={`relative ${sizeMap[size].container}`}>
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-3 border-transparent border-t-primary border-r-primary shadow-lg"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />

          {/* Middle rotating ring - opposite direction */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-transparent border-b-blue-400 border-l-blue-400"
            animate={{ rotate: -360 }}
            transition={{
              duration: 1.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />

          {/* Inner pulsing dot */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gradient-to-r from-primary to-blue-400" />
          </motion.div>
        </div>
        {showLabel && (
          <motion.p
            className={`${text} font-medium text-muted-foreground text-center`}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            {label}
          </motion.p>
        )}
      </div>
    )
  }

  // Default: dots variant
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${container} flex items-center justify-center gap-1.5`}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={`${dot} rounded-full bg-gradient-to-b from-primary via-blue-500 to-blue-400 shadow-md`}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              delay: index * 0.15,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {showLabel && (
        <motion.p
          className={`${text} font-medium text-muted-foreground text-center`}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          {label}
        </motion.p>
      )}
    </div>
  )
}

/**
 * Compact Loader - For inline loading states
 */
export function LoaderCompact({ 
  size = "sm",
  variant = "dots" 
}: Omit<LoaderProps, "showLabel" | "label">) {
  const sizeMap = {
    sm: { container: "h-4 w-4", dot: "h-1 w-1" },
    md: { container: "h-6 w-6", dot: "h-1.5 w-1.5" },
    lg: { container: "h-8 w-8", dot: "h-2 w-2" },
  }

  const { container, dot } = sizeMap[size]

  if (variant === "icon") {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        <Loader2 className={`${container} text-primary`} />
      </motion.div>
    )
  }

  return (
    <div className={`${container} flex items-center justify-center gap-0.5`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${dot} rounded-full bg-primary`}
          animate={{
            scale: [0.8, 1.1, 0.8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            delay: index * 0.1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

/**
 * Full Page Loader - For page transitions
 */
export function LoaderFullPage({ 
  label = "Loading...",
  variant = "ring"
}: Omit<LoaderProps, "size">) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        <Loader size="lg" showLabel={true} label={label} variant={variant} />
      </div>
    </div>
  )
}

/**
 * Skeleton Loader - For content loading
 */
export function LoaderSkeleton({ 
  className = "h-12 w-full",
  count = 3 
}: { 
  className?: string
  count?: number 
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={`${className} rounded-lg bg-muted`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            delay: index * 0.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

/**
 * Deprecated: Use Loader with variant prop instead
 */
export function LoaderRing({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return <Loader size={size} variant="ring" />
}
