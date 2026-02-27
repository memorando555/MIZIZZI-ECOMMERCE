"use client"

import React, { memo } from "react"
import { ProductRow } from "@/components/admin/product-row"
import { ProductCard } from "@/components/admin/product-card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Product } from "@/types"

interface ProductListProps {
  products: Product[]
  selectedProducts: string[]
  viewMode: "list" | "grid"
  isMobile: boolean
  productImages: Record<string, string>
  onSelectProduct: (id: string) => void
  onDeleteProduct: (id: string) => void
  getProductImage: (product: Product) => string
}

const ProductList = memo(function ProductList({
  products,
  selectedProducts,
  viewMode,
  isMobile,
  productImages,
  onSelectProduct,
  onDeleteProduct,
  getProductImage,
}: ProductListProps) {
  // Auto-switch to grid on mobile
  const displayMode = isMobile ? "grid" : viewMode

  if (displayMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSelected={selectedProducts.includes(product.id.toString())}
            onSelect={onSelectProduct}
            onDelete={onDeleteProduct}
            imageSrc={productImages[product.id] || getProductImage(product)}
          />
        ))}
      </div>
    )
  }

  // Table view - desktop only with content-visibility for better performance
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden" style={{ contain: "layout" }}>
      <Table>
        <TableHeader className="bg-gray-50 border-b border-gray-200">
          <TableRow className="hover:bg-gray-50">
            <TableHead className="w-12 font-semibold text-gray-900">
              <input type="checkbox" className="w-4 h-4 rounded cursor-pointer" />
            </TableHead>
            <TableHead className="font-semibold text-gray-900">Product</TableHead>
            <TableHead className="font-semibold text-gray-900">Price</TableHead>
            <TableHead className="font-semibold text-gray-900">Stock</TableHead>
            <TableHead className="font-semibold text-gray-900">Status</TableHead>
            <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isSelected={selectedProducts.includes(product.id.toString())}
              onSelect={onSelectProduct}
              onDelete={onDeleteProduct}
              imageSrc={productImages[product.id] || getProductImage(product)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
})

ProductList.displayName = "ProductList"

// Custom comparison for memo to prevent unnecessary re-renders when props are shallowly equal
const arePropsEqual = (prevProps: ProductListProps, nextProps: ProductListProps) => {
  // Check if products array content is the same (same products in same order)
  if (prevProps.products.length !== nextProps.products.length) return false
  if (prevProps.products.some((p, i) => p.id !== nextProps.products[i]?.id)) return false
  
  // Check other critical props
  if (prevProps.viewMode !== nextProps.viewMode) return false
  if (prevProps.isMobile !== nextProps.isMobile) return false
  if (prevProps.selectedProducts.length !== nextProps.selectedProducts.length) return false
  
  return true
}

const MemoizedProductList = React.memo(ProductList, arePropsEqual)
export { MemoizedProductList as ProductList }
