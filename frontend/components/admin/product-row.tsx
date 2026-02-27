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
import { TableCell, TableRow } from "@/components/ui/table"
import { OptimizedImage } from "@/components/ui/optimized-image"
import type { Product } from "@/types"

interface ProductRowProps {
  product: Product
  isSelected: boolean
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
  imageSrc?: string
}

const ProductRow = memo(function ProductRow({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onView,
  imageSrc,
}: ProductRowProps) {
  // Memoized callbacks to prevent unnecessary re-renders
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
  const stockStatus = product.stock_quantity > 0

  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="w-12">
        <Checkbox checked={isSelected} onChange={handleSelect} />
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
        <div className="font-medium text-gray-900 line-clamp-1">{product.name}</div>
        <div className="text-sm text-gray-500">{product.sku || "No SKU"}</div>
      </TableCell>
      <TableCell className="text-right">${parseFloat(String(product.price || 0)).toFixed(2)}</TableCell>
      <TableCell className="text-right">{product.stock_quantity || 0} units</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {status ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Active</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Inactive</span>
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        {stockStatus ? (
          <Badge className="bg-green-50 text-green-700 border border-green-200">In Stock</Badge>
        ) : (
          <Badge className="bg-red-50 text-red-700 border border-red-200">Out of Stock</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
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
      </TableCell>
    </TableRow>
  )
})

ProductRow.displayName = "ProductRow"

export { ProductRow }
