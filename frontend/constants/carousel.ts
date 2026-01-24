import type { LucideIcon } from "lucide-react"

export interface FeatureCard {
  icon: LucideIcon
  title: string
  description: string
  href: string
  iconBg: string
  iconColor: string
  hoverBg: string
}

export interface PromoSlide {
  icon: LucideIcon
  title: string
  subtitle: string
  description: string
  bgGradient: string
  glowColor: string
  shadowColor: string
  iconBg: string
  particles: string
}

// Breakpoint constants for responsive layout
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  minSpaceForCards: 600,
  minSpaceForSidePanels: 1280, // Changed from 1536 to 1280 (xl breakpoint) for better laptop support
}

// Timing constants
export const TIMING = {
  slideInterval: 5000,
  autoSlideInterval: 5000,
  componentRotationInterval: 3000,
  animationDuration: 800,
  progressUpdateInterval: 50,
  transitionDelay: 800,
}

// Animation configurations
export const ANIMATION_CONFIGS = {
  slideTransition: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },
  cardHover: {
    duration: 0.3,
    ease: "easeOut" as const,
  },
  iconPulse: {
    duration: 2,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut" as const,
  },
  particleFloat: {
    duration: 3,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut" as const,
  },
}
