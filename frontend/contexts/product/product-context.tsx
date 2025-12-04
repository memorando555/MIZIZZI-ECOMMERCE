"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Product } from "@/types"
import { productService } from "@/services/product"
import { websocketService } from "@/services/websocket"

interface ProductContextType {
  products: Product[]
  featuredProducts: Product[]
  newProducts: Product[]
  saleProducts: Product[]
  isLoading: boolean
  error: string | null
  isBackendWakingUp: boolean
  refreshProduct: (id: string) => Promise<Product | null>
  refreshProducts: () => Promise<void>
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [saleProducts, setSaleProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBackendWakingUp, setIsBackendWakingUp] = useState(false)

  // Function to refresh a specific product
  const refreshProduct = useCallback(async (id: string): Promise<Product | null> => {
    try {
      console.log(`Refreshing product data for ID: ${id}`)

      // Force cache invalidation before fetching
      productService.invalidateProductCache(id)

      // Add timestamp to avoid caching issues and call productService directly
      const timestamp = Date.now()
      const updatedProduct = await productService.getProduct(`${id}?t=${timestamp}`)

      if (updatedProduct) {
        console.log("Product refreshed successfully:", updatedProduct)

        // Update the product in all relevant lists
        setProducts((prevProducts) => prevProducts.map((p) => (p.id.toString() === id ? updatedProduct : p)))

        setFeaturedProducts((prevProducts) => prevProducts.map((p) => (p.id.toString() === id ? updatedProduct : p)))

        setNewProducts((prevProducts) => prevProducts.map((p) => (p.id.toString() === id ? updatedProduct : p)))

        setSaleProducts((prevProducts) => prevProducts.map((p) => (p.id.toString() === id ? updatedProduct : p)))

        // Dispatch a custom event that other components can listen for
        if (typeof window !== "undefined") {
          const event = new CustomEvent("product-refreshed", {
            detail: { id, product: updatedProduct },
          })
          window.dispatchEvent(event)
        }
      }

      return updatedProduct ?? null
    } catch (error) {
      console.error(`Error refreshing product ${id}:`, error)
      return null
    }
  }, [])

  // Function to refresh all products
  const refreshProducts = useCallback(async () => {
    setIsLoading(true)

    try {
      console.log("[v0] ProductContext: fetching products...")
      // Directly fetch product lists from productService
      const [allProducts, featured, newProds, sale] = await Promise.all([
        productService.getProducts(),
        productService.getFeaturedProducts(),
        productService.getNewProducts(),
        productService.getSaleProducts(),
      ])

      const safeAllProducts = allProducts ?? []
      const safeFeatured = featured ?? []
      const safeNewProds = newProds ?? []
      const safeSale = sale ?? []

      console.log(
        `Loaded ${safeAllProducts.length} products, ${safeFeatured.length} featured, ${safeNewProds.length} new, ${safeSale.length} on sale`,
      )

      setProducts(safeAllProducts)
      setFeaturedProducts(safeFeatured)
      setNewProducts(safeNewProds)
      setSaleProducts(safeSale)

      // If all lists are empty we keep a generic message; otherwise clear error
      if (
        safeAllProducts.length === 0 &&
        safeFeatured.length === 0 &&
        safeNewProds.length === 0 &&
        safeSale.length === 0
      ) {
        setError("Products are unavailable. Please try again later.")
      } else {
        setError(null)
      }

      // Dispatch success event
      if (typeof document !== "undefined") {
        document.dispatchEvent(new CustomEvent("api-success"))
      }
    } catch (error: any) {
      console.error("Error refreshing products:", error)

      if (error.message?.includes("Network") || error.code === "ERR_NETWORK") {
        setError("Unable to connect to the server. Please check your connection and try again.")
      } else {
        setError("Failed to load products. Please try again.")
      }
    } finally {
      setIsLoading(false)
      setIsBackendWakingUp(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    refreshProducts()
  }, [refreshProducts])

  // Add a new method to listen for product updates
  useEffect(() => {
    const handleProductUpdate = async (data: { id: string }) => {
      console.log("Received product update for ID:", data.id)
      await refreshProduct(data.id)
    }

    // Subscribe to product updates
    const unsubscribe = websocketService.subscribe("product_updated", handleProductUpdate)

    // Also listen for the custom event
    const handleCustomEvent = (event: CustomEvent) => {
      const { id } = event.detail
      console.log("Received custom event for product update:", id)
      refreshProduct(id)
    }

    window.addEventListener("product-updated", handleCustomEvent as EventListener)
    window.addEventListener("product-refreshed", handleCustomEvent as EventListener)

    return () => {
      unsubscribe()
      window.removeEventListener("product-updated", handleCustomEvent as EventListener)
      window.removeEventListener("product-refreshed", handleCustomEvent as EventListener)
    }
  }, [refreshProduct])

  return (
    <ProductContext.Provider
      value={{
        products,
        featuredProducts,
        newProducts,
        saleProducts,
        isLoading,
        error,
        isBackendWakingUp,
        refreshProduct,
        refreshProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider")
  }
  return context
}
