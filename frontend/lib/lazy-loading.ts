/**
 * Lazy loading and code splitting utilities
 * Defers heavy components until needed to reduce initial bundle size
 */

import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

/**
 * Loading fallback component
 */
const LoadingFallback = () => (
  <div className="w-full h-32 bg-gradient-to-r from-neutral-200 to-neutral-100 rounded-lg animate-pulse" />
)

/**
 * Lazy load Google OAuth modal
 * This component includes all Google auth logic and is only loaded when needed
 */
export const GoogleOAuthModal = dynamic(
  () => import('@/components/auth/google-oauth-modal'),
  {
    loading: () => <LoadingFallback />,
    ssr: false, // Don't server-render heavy OAuth components
  }
)

/**
 * Lazy load social auth buttons
 * Only load when user navigates to login page
 */
export const SocialAuthButtons = dynamic(
  () => import('@/components/auth/social-auth-buttons'),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

/**
 * Lazy load password reset flow
 * Only load when user clicks "forgot password"
 */
export const PasswordResetFlow = dynamic(
  () => import('@/components/auth/password-reset-flow'),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

/**
 * Lazy load admin components
 * Only load on admin routes
 */
export const AdminDashboard = dynamic(
  () => import('@/components/admin/dashboard'),
  {
    loading: () => <LoadingFallback />,
    ssr: true,
  }
)

/**
 * Lazy load cart sidebar (heavy with interactions)
 */
export const CartSidebar = dynamic(
  () => import('@/components/cart/sidebar'),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

/**
 * Lazy load product filters (complex state management)
 */
export const ProductFilters = dynamic(
  () => import('@/components/products/filters'),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
)

/**
 * Wrapper component that defers lazy loading until client interaction
 * Useful for optional components that don't need to load immediately
 */
interface DeferredComponentProps {
  children: React.ReactNode
  onInteract?: () => void
}

export function DeferredComponent({ children, onInteract }: DeferredComponentProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  const handleInteraction = () => {
    if (!isVisible) {
      setIsVisible(true)
      onInteract?.()
    }
  }

  if (!isVisible) {
    return (
      <div onClick={handleInteraction} onFocus={handleInteraction} role="button" tabIndex={0}>
        {children}
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Wrap component with Suspense boundary for better loading UX
 */
export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback || <LoadingFallback />}>
        <Component {...props} />
      </Suspense>
    )
  }
}
