"use client"

import { productService } from "@/services/product"
import { adminService } from "@/services/admin"

/**
 * Utility for intelligent prefetching and caching of product data
 * Reduces latency for product editing by pre-loading related data
 */
export class ProductPrefetchManager {
  private static prefetchQueue: Set<string> = new Set()
  private static prefetchInProgress: Set<string> = new Set()

  /**
   * Prefetch a single product with all related data
   */
  static async prefetchProduct(productId: string | number): Promise<void> {
    const id = String(productId)

    // Skip if already prefetched or in progress
    if (this.prefetchQueue.has(id) || this.prefetchInProgress.has(id)) {
      return
    }

    this.prefetchInProgress.add(id)
    this.prefetchQueue.add(id)

    try {
      // Fetch product and images in parallel
      await Promise.all([
        adminService.getProduct(id),
        adminService.getProductImages(Number(id)),
        adminService.getCategories(),
        adminService.getBrands(),
      ])

      console.log(`[v0] Prefetched product ${id} and related data`)
    } catch (error) {
      console.error(`[v0] Failed to prefetch product ${id}:`, error)
    } finally {
      this.prefetchInProgress.delete(id)
    }
  }

  /**
   * Prefetch multiple products
   */
  static async prefetchProducts(productIds: (string | number)[]): Promise<void> {
    const uniqueIds = [...new Set(productIds.map(String))]
    await Promise.allSettled(uniqueIds.map((id) => this.prefetchProduct(id)))
  }

  /**
   * Clear prefetch cache
   */
  static clearCache(): void {
    this.prefetchQueue.clear()
    this.prefetchInProgress.clear()
  }

  /**
   * Get prefetch status
   */
  static getStatus() {
    return {
      queued: this.prefetchQueue.size,
      inProgress: this.prefetchInProgress.size,
    }
  }
}

/**
 * Hook for managing intelligent prefetching
 */
export function usePrefetchProduct(productId?: string | number) {
  const prefetch = async () => {
    if (!productId) return
    await ProductPrefetchManager.prefetchProduct(productId)
  }

  return {
    prefetch,
    prefetchMultiple: ProductPrefetchManager.prefetchProducts,
    clearCache: ProductPrefetchManager.clearCache,
  }
}
