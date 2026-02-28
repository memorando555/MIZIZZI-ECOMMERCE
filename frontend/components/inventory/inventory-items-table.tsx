"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { type EnhancedInventoryItem } from "@/services/inventory-service"

interface InventoryItemsTableProps {
  inventory: EnhancedInventoryItem[]
  pagination: {
    page: number
    per_page: number
    total_pages: number
    total_items: number
  }
  loading: boolean
  selectedItems: number[]
  onSelectionChange: (items: number[]) => void
  onQuickAdjustment: (item: EnhancedInventoryItem, amount: number) => void
  itemLoadingStates: Record<string, boolean>
  onPageChange: (page: number) => void
}

export function InventoryItemsTable({
  inventory,
  pagination,
  loading,
  selectedItems,
  onSelectionChange,
  onQuickAdjustment,
  itemLoadingStates,
  onPageChange,
}: InventoryItemsTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(inventory.map((item) => item.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, id])
    } else {
      onSelectionChange(selectedItems.filter((item) => item !== id))
    }
  }

  const getStockBadgeColor = (item: EnhancedInventoryItem) => {
    if (item.stock_level <= 0) return "bg-red-100 text-red-800"
    if (item.stock_level <= (item.low_stock_threshold || 5)) return "bg-orange-100 text-orange-800"
    return "bg-green-100 text-green-800"
  }

  if (loading) {
    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-48" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b p-4 flex items-center gap-4">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={inventory.length > 0 && selectedItems.length === inventory.length}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">SKU</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">Stock</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">Reserved</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">Available</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const isLoading =
                    itemLoadingStates[`${item.product_id}-${item.variant_id || "default"}`] || false
                  const available = Math.max(0, item.stock_level - (item.reserved_quantity || 0))

                  return (
                    <tr key={`${item.product_id}-${item.variant_id}`} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.product?.thumbnail_url && (
                            <OptimizedImage
                              src={item.product.thumbnail_url}
                              alt={item.product.name}
                              width={40}
                              height={40}
                              className="rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{item.product?.name || "N/A"}</p>
                            {item.product?.category && (
                              <p className="text-xs text-slate-500">{item.product.category}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.product?.sku || "N/A"}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{item.stock_level}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {item.reserved_quantity || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{available}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={getStockBadgeColor(item)}>
                          {item.stock_level <= 0 ? "Out" : item.stock_level <= (item.low_stock_threshold || 5) ? "Low" : "In Stock"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onQuickAdjustment(item, -1)}
                            disabled={isLoading}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onQuickAdjustment(item, 1)}
                            disabled={isLoading}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 bg-white rounded-lg border">
          <p className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.total_pages} ({pagination.total_items} total items)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
