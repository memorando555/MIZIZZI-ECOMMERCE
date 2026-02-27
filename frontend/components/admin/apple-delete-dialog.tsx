"use client"

import React, { useState, useCallback, memo } from "react"
import { AlertTriangle, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "@/types"

interface AppleDeleteDialogProps {
  isOpen: boolean
  product: Product | null
  isDeleting: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export const AppleDeleteDialog = memo(function AppleDeleteDialog({
  isOpen,
  product,
  isDeleting,
  onConfirm,
  onCancel,
}: AppleDeleteDialogProps) {
  const [showError, setShowError] = useState(false)

  const handleConfirm = useCallback(async () => {
    try {
      setShowError(false)
      await onConfirm()
    } catch (error) {
      setShowError(true)
      console.error("[v0] Delete error:", error)
    }
  }, [onConfirm])

  if (!isOpen || !product) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={onCancel}
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        style={{ opacity: isOpen ? 1 : 0 }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full pointer-events-auto transform transition-all duration-300"
          style={{
            transform: isOpen ? "scale(1) translateY(0)" : "scale(0.95) translateY(-20px)",
            opacity: isOpen ? 1 : 0,
          }}
        >
          {/* Header with close button */}
          <div className="relative pt-6 px-6">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Delete Product?
            </h2>

            {/* Message */}
            <p className="text-sm text-gray-600 text-center mb-1">
              You're about to delete
            </p>
            <p className="text-sm font-medium text-gray-900 text-center mb-6 line-clamp-2">
              {product.name}
            </p>

            {/* Warning message */}
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-6">
              <p className="text-xs text-red-700">
                This action cannot be undone. The product will be permanently removed from your catalog.
              </p>
            </div>

            {/* Error message */}
            {showError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-700">Failed to delete product. Please try again.</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200" />

          {/* Action buttons */}
          <div className="p-4 flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 h-10 rounded-lg font-medium text-gray-900 border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 h-10 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
})

AppleDeleteDialog.displayName = "AppleDeleteDialog"
