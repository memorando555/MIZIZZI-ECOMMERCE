/**
 * Performance Configuration
 * Controls animation and rendering optimizations for better LCP and TBT scores
 */

// Global flag to disable animations on initial page load
// Animations are re-enabled after page becomes interactive (TTI)
export const DISABLE_ANIMATIONS_ON_LOAD = true;

// Detect if user prefers reduced motion via system preferences
export const detectPreferReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Lazy-load Framer Motion only when needed
let framerMotionLoaded = false;

export const ensureFramerMotionLoaded = async () => {
  if (framerMotionLoaded) return;
  
  try {
    await import('framer-motion');
    framerMotionLoaded = true;
  } catch (error) {
    console.error('Failed to load framer-motion:', error);
  }
};

// Performance metrics tracking
export const PERF_MARKS = {
  PRELOAD: 'preload',
  HOME_START: 'home-start',
  HOME_END: 'home-end',
  CAROUSEL_READY: 'carousel-ready',
  INTERACTIVE: 'interactive',
} as const;

// Helper to mark performance points
export const markPerformance = (name: string) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      performance.mark(name);
    } catch (e) {
      // Silently fail if performance API not available
    }
  }
};
