"use client"

import React, { memo, useCallback, useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, CheckCircle2, XCircle, Edit, Eye, MoreHorizontal, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Badge } from "@/components/ui/badge"
import { AppleDeleteDialog } from "./apple-delete-dialog"
import type { Product } from "@/types"

interface ProductRowProps {
  product: Product
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  imageSrc?: string
}

interface MenuItem {
  label: string
  icon: React.ReactNode
  onClick: () => void
  color?: "default" | "danger"
  disabled?: boolean
}

const ProductRow = memo(function ProductRow({
  product,
  isSelected,
  onSelect,
  onDelete,
  imageSrc,
}: ProductRowProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Memoized callbacks
  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(product.id)
  }, [product.id, onSelect])

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true)
    setIsMenuOpen(false)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      onDelete(product.id)
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
    }
  }, [product.id, onDelete])

  const handleView = useCallback(async () => {
    setIsLoading(true)
    try {
      await router.push(`/admin/products/${product.id}`)
    } finally {
      setIsLoading(false)
    }
  }, [product.id, router])

  const handleEdit = useCallback(async () => {
    setIsLoading(true)
    try {
      await router.push(`/admin/products/${product.id}/edit`)
    } finally {
      setIsLoading(false)
    }
  }, [product.id, router])

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    // Use capture phase for better event handling
    document.addEventListener("mousedown", handleClickOutside, true)
    return () => document.removeEventListener("mousedown", handleClickOutside, true)
  }, [isMenuOpen])

  // Close menu on escape key
  useEffect(() => {
    if (!isMenuOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isMenuOpen])

  const status = product.status === "active" || product.is_active
  const stockStatus = (product.stock || 0) > 0

  const menuItems: MenuItem[] = [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: handleView,
      disabled: isLoading,
    },
    {
      label: "Edit Product",
      icon: <Edit className="w-4 h-4" />,
      onClick: handleEdit,
      disabled: isLoading,
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      color: "danger",
      disabled: isLoading,
    },
  ]

  return (
    <>
      <TableRow 
        className="hover:bg-gray-50 transition-colors border-b border-gray-200"
      >
      <TableCell className="w-12" onClick={handleSelect}>
        <Checkbox checked={isSelected} onChange={() => {}} />
      </TableCell>
      <TableCell className="w-16">
        <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
          {imageSrc ? (
            <OptimizedImage
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-cover"
              width={56}
              height={56}
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium text-gray-900 line-clamp-2">{product.name}</div>
        <div className="text-xs text-gray-500 mt-0.5">{product.sku || "No SKU"}</div>
      </TableCell>
      <TableCell className="text-right font-semibold text-gray-900">${parseFloat(String(product.price || 0)).toFixed(2)}</TableCell>
      <TableCell className="text-right text-gray-700">{product.stock || 0} units</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {status ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-700 font-medium">Active</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Inactive</span>
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        {stockStatus ? (
          <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">In Stock</Badge>
        ) : (
          <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs">Out of Stock</Badge>
        )}
      </TableCell>
      <TableCell className="text-right relative">
        <div className="relative">
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 transition-all"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Product actions"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>

          {/* Custom Dropdown Menu */}
          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150"
              onClick={(e) => e.stopPropagation()}
              role="menu"
              aria-orientation="vertical"
            >
              <div className="px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </div>
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick()
                    if (!isLoading) {
                      setIsMenuOpen(false)
                    }
                  }}
                  disabled={item.disabled}
                  className={`
                    w-full px-3 py-2 text-sm flex items-center gap-3 transition-colors
                    ${item.color === "danger" 
                      ? "text-red-600 hover:bg-red-50 disabled:text-red-400" 
                      : "text-gray-700 hover:bg-blue-50 disabled:text-gray-400"
                    }
                    ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                  role="menuitem"
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Backdrop for closing menu */}
          {isMenuOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
          )}
        </div>
      </TableCell>
    </TableRow>

    {/* Apple-style Delete Dialog */}
    <AppleDeleteDialog
      isOpen={showDeleteDialog}
      product={product}
      isDeleting={isDeleting}
      onConfirm={handleConfirmDelete}
      onCancel={() => setShowDeleteDialog(false)}
    />
    </>
  )
})

ProductRow.displayName = "ProductRow"

export { ProductRow }

