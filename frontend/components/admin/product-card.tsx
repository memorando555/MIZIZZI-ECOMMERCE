"use client"

import React, { memo, useCallback } from "react"
import { Trash2, Edit, Eye, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { OptimizedImage } from "@/components/ui/optimized-image"
import type { Product } from "@/types"
import { formatPrice } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  isSelected: boolean
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
  imageSrc?: string
}

const ProductCard = memo(function ProductCard({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onView,
  imageSrc,
}: ProductCardProps) {
  // Memoized callbacks
  const handleSelect = useCallback(() => {
    onSelect(product.id)
  }, [product.id, onSelect])

  const handleEdit = useCallback(() => {
    onEdit(product.id)
  }, [product.id, onEdit])

  const handleDelete = useCallback(() => {
    onDelete(product.id)
  }, [product.id, onDelete])

  const handleView = useCallback(() => {
    onView(product.id)
  }, [product.id, onView])

  const status = product.status === "active" || product.is_active
  const stockStatus = (product.stock || 0) > 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        {/* Checkbox */}
        <div className="flex items-start justify-between mb-3">
          <Checkbox checked={isSelected} onChange={handleSelect} className="mt-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleView}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Product Image */}
        <div className="w-full h-32 rounded-lg bg-gray-100 mb-3 overflow-hidden">
          {imageSrc ? (
            <OptimizedImage
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-cover"
              width={200}
              height={128}
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
          <p className="text-xs text-gray-500">SKU: {product.sku || "No SKU"}</p>

          {/* Price and Stock */}
          <div className="flex justify-between items-center py-2 border-t border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Price</p>
              <p className="font-semibold text-gray-900">{formatPrice(product.price)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Stock</p>
              <p className="font-semibold text-gray-900">{product.stock || 0}</p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 pt-2">
            {status ? (
              <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge className="bg-gray-50 text-gray-700 border border-gray-200 text-xs">
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
              </Badge>
            )}

            {stockStatus ? (
              <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">In Stock</Badge>
            ) : (
              <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs">Out of Stock</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

ProductCard.displayName = "ProductCard"

export { ProductCard }
