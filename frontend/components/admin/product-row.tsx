"use client"

import React, { memo, useCallback, useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Edit, Eye, MoreHorizontal, Loader2, Trash2, AlertTriangle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { adminService } from "@/services/admin"
import type { Product } from "@/types"

interface ProductRowProps {
  product: Product
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete?: (id: string) => void
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
    onSelect(String(product.id))
  }, [product.id, onSelect])



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

  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true)
    setIsMenuOpen(false)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      const result = await adminService.deleteProduct(String(product.id))
      
      if (result.success) {
        toast({
          title: "Success",
          description: `"${product.name}" has been deleted successfully`,
          variant: "success",
          duration: 3000,
        })
        setShowDeleteDialog(false)
        onDelete?.(String(product.id))
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to delete product"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [product.id, product.name, onDelete])

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

  // Safely handle a possible legacy `is_active` field without assuming it exists on the Product type
  const status =
    product.status === "active" ||
    (("is_active" in product) ? Boolean((product as any).is_active) : false)

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
      onClick: handleDeleteClick,
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
      {/* Modern Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header with warning icon */}
            <div className="bg-gradient-to-r from-red-50 to-red-100/50 px-6 py-6 flex items-start gap-4">
              <div className="flex-shrink-0 pt-0.5">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Delete Product?</h2>
                <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700 mb-4">
                You are about to permanently delete <span className="font-semibold text-gray-900">"{product.name}"</span>. This will:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Remove the product from your catalog</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Delete all associated images and data</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Cannot be recovered</span>
                </li>
              </ul>
            </div>

            {/* Footer with actions */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Product
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

ProductRow.displayName = "ProductRow"

export { ProductRow }

