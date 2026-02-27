"use client"

import React, { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OptimizedImage } from "@/components/ui/optimized-image"
import type { Product } from "@/types"

interface ProductPreviewProps {
  product: Product
}

export function ProductPreview({ product }: ProductPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const primaryImage = product.images?.[0] || product.thumbnail_url || "/placeholder-product.png"
  const isOnSale = product.sale_price && product.sale_price < (product.price || 0)
  const discount = isOnSale ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Customer Preview</h3>
            <p className="text-sm text-gray-500">See how this product appears to customers</p>
          </div>
        </div>
        <ChevronDown
          className="h-5 w-5 text-gray-400 flex-shrink-0 transition-transform"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-5 sm:p-6 space-y-6 bg-gray-50">
          {/* Product Card Preview */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow max-w-sm mx-auto">
            {/* Image Container */}
            <div className="relative bg-gray-100 aspect-square overflow-hidden">
              <OptimizedImage
                src={primaryImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                  -{discount}%
                </div>
              )}
              {product.is_new && (
                <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full font-semibold text-xs">
                  NEW
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm">{product.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{product.sku}</p>
              </div>

              {/* Price Section */}
              <div className="flex items-center gap-2">
                {isOnSale ? (
                  <>
                    <span className="text-lg font-bold text-gray-900">
                      ${product.sale_price?.toFixed(2) || "0.00"}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ${product.price?.toFixed(2) || "0.00"}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-gray-900">
                    ${product.price?.toFixed(2) || "0.00"}
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                {product.is_featured && (
                  <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs">Featured</Badge>
                )}
                {product.is_flash_sale && (
                  <Badge className="bg-orange-50 text-orange-700 border border-orange-200 text-xs">Flash Sale</Badge>
                )}
                {product.is_luxury_deal && (
                  <Badge className="bg-purple-50 text-purple-700 border border-purple-200 text-xs">Luxury</Badge>
                )}
              </div>

              {/* Stock Status */}
              <div className="pt-2 border-t border-gray-100">
                {(product.stock || 0) > 0 ? (
                  <p className="text-xs text-green-600 font-medium">In Stock</p>
                ) : (
                  <p className="text-xs text-red-600 font-medium">Out of Stock</p>
                )}
              </div>

              {/* Add to Cart Button */}
              <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm" disabled={!product.stock}>
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
