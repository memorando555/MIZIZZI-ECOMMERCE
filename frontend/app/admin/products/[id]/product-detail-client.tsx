import React, { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Trash2, Save, Eye, EyeOff, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { adminService } from "@/services/admin"
import type { Product } from "@/types"
import { ProductBasicInfo } from "./components/product-basic-info"
import { ProductPricing } from "./components/product-pricing"
import { ProductInventory } from "./components/product-inventory"
import { ProductImages } from "./components/product-images"
import { ProductActions } from "./components/product-actions"
import { ProductPreview } from "./components/product-preview"

interface ProductDetailClientProps {
  initialProduct: Product
}

export function ProductDetailClient({ initialProduct }: ProductDetailClientProps) {
  const router = useRouter()
  const [product, setProduct] = useState<Product>(initialProduct)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Track changes
  const handleProductChange = useCallback((updatedProduct: Partial<Product>) => {
    setProduct((prev) => ({ ...prev, ...updatedProduct }))
    setHasChanges(true)
    setSaveStatus("idle")
  }, [])

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges) return

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save (3 seconds after last change)
    saveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 3000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [product])

  // Save product changes
  const handleSave = useCallback(async () => {
    try {
      setSaveStatus("saving")
      setIsSaving(true)
      await adminService.updateProduct(product.id.toString(), product)
      setHasChanges(false)
      setSaveStatus("saved")
      
      // Reset saved status after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000)
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      })
    } catch (error) {
      setSaveStatus("error")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [product])

  // Delete product
  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true)
      await adminService.deleteProduct(product.id.toString())
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
      router.push("/admin/products")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }, [product.id, router])

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Sticky with Glass Morphism */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full hover:bg-gray-100 flex-shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 truncate">{product.name}</h1>
                  {saveStatus === "saving" && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-gray-900" />
                      Saving...
                    </div>
                  )}
                  {saveStatus === "saved" && (
                    <div className="flex items-center gap-1.5 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      Saved
                    </div>
                  )}
                  {saveStatus === "error" && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Error
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">SKU: {product.sku || "N/A"}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  // Preview logic
                  window.open(`/products/${product.id}`, "_blank")
                }}
              >
                <Eye className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-full hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5 text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Apple-like Two Column Layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" style={{ contain: "layout" }}>
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6" style={{ contain: "content" }}>
            {/* Product Images */}
            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6" style={{ contain: "layout" }}>
              <h2 className="text-lg font-semibold text-gray-900">Gallery</h2>
              <ProductImages product={product} onProductChange={handleProductChange} />
            </section>

            {/* Basic Information */}
            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6" style={{ contain: "layout" }}>
              <h2 className="text-lg font-semibold text-gray-900">Information</h2>
              <ProductBasicInfo product={product} onProductChange={handleProductChange} />
            </section>

            {/* Pricing */}
            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6" style={{ contain: "layout" }}>
              <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
              <ProductPricing product={product} onProductChange={handleProductChange} />
            </section>

            {/* Inventory */}
            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6" style={{ contain: "layout" }}>
              <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
              <ProductInventory product={product} onProductChange={handleProductChange} />
            </section>

            {/* Product Preview - How it looks to customers */}
            <section className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6" style={{ contain: "layout" }}>
              <ProductPreview product={product} />
            </section>

          {/* Right Column - Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24" style={{ contain: "layout" }}>
            <ProductActions product={product} onProductChange={handleProductChange} />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Product?</h2>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl bg-white p-6 sm:p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Delete Product?</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              This action cannot be undone. The product "{product.name}" will be permanently deleted from your catalog.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-full"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
