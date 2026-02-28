"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { adminService } from "@/services/admin"
import { generateSlug } from "@/lib/utils"
import type { Product, ProductVariant } from "@/types"

// Helper function to validate product IDs
function isValidProductId(id: string | undefined): boolean {
  if (!id) return false
  if (id === "images") return false
  if (isNaN(Number(id))) return false
  return true
}

// Define product schema for form validation
const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  sale_price: z.coerce.number().positive("Sale price must be positive").optional().nullable(),
  stock: z.coerce.number().int("Stock must be an integer").nonnegative("Stock must be non-negative"),
  category_id: z.coerce.number().positive("Please select a category"),
  brand_id: z.coerce.number().positive("Please select a brand").optional().nullable(),
  sku: z.string().optional(),
  weight: z.coerce.number().positive("Weight must be positive").optional().nullable(),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(true),
  is_sale: z.boolean().default(false),
  is_flash_sale: z.boolean().default(false),
  is_luxury_deal: z.boolean().default(false),
  is_daily_find: z.boolean().default(false),
  is_top_pick: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  material: z.string().optional(),
  features: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  package_contents: z.array(z.string()).optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>

interface UseProductFormProps {
  productId: string
  onSuccess: (product: Product) => void
  onError: (error: string) => void
}

export function useProductForm({ productId, onSuccess, onError }: UseProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formChanged, setFormChanged] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])

  // Use refs to track initialization and prevent unnecessary updates
  const formInitialized = useRef(false)
  const isUpdatingForm = useRef(false)

  // Initialize form with default values
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      sale_price: null,
      stock: 0,
      category_id: 0,
      brand_id: null,
      sku: "",
      weight: null,
      is_featured: false,
      is_new: true,
      is_sale: false,
      is_flash_sale: false,
      is_luxury_deal: false,
      is_daily_find: false,
      is_top_pick: false,
      is_trending: false,
      is_new_arrival: false,
      meta_title: "",
      meta_description: "",
      material: "",
      features: [],
      specifications: {},
      package_contents: [],
    },
    mode: "onChange", // Validate on change for better user experience
  })

  const { watch, setValue, formState } = form

  // Watch the name field to auto-generate slug
  const name = watch("name", "")
  useEffect(() => {
    if (!formInitialized.current || isUpdatingForm.current) return

    if (name && !formState.dirtyFields.slug) {
      isUpdatingForm.current = true
      setValue("slug", generateSlug(name), { shouldDirty: false })
      isUpdatingForm.current = false
    }
  }, [name, setValue, formState.dirtyFields.slug])

  // Watch sale price to auto-set is_sale
  const salePrice = watch("sale_price", null)
  useEffect(() => {
    if (!formInitialized.current || isUpdatingForm.current) return

    isUpdatingForm.current = true
    setValue("is_sale", salePrice !== null && salePrice !== undefined && salePrice > 0, { shouldDirty: false })
    isUpdatingForm.current = false
  }, [salePrice, setValue])

  // Reset form with product data
  const resetForm = useCallback(
    (product: Product) => {
      console.log("Resetting form with product data:", product)

      // Temporarily disable form change tracking
      isUpdatingForm.current = true

      try {
        // Set form values
        Object.entries(product).forEach(([key, value]) => {
          if (key in form.getValues()) {
            if (key === "price" || key === "stock") {
              setValue(key as "price" | "stock", value || 0, { shouldDirty: false })
            } else if (key === "sale_price" || key === "weight") {
              setValue(key as "sale_price" | "weight", value === undefined ? null : value, { shouldDirty: false })
            } else if (key === "features") {
              setValue(
                "features" as const,
                Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [],
                { shouldDirty: false },
              )
            } else if (key === "specifications") {
              setValue(
                "specifications" as const,
                value && typeof value === "object" ? (value as Record<string, string>) : {},
                { shouldDirty: false },
              )
            } else if (key === "package_contents") {
              setValue(
                "package_contents" as const,
                Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [],
                { shouldDirty: false },
              )
            } else if (
              [
                "name",
                "slug",
                "description",
                "sku",
                "meta_title",
                "meta_description",
                "material",
                "is_featured",
                "is_new",
                "is_sale",
                "is_flash_sale",
                "is_luxury_deal",
                "is_daily_find",
                "is_top_pick",
                "is_trending",
                "is_new_arrival",
              ].includes(key)
            ) {
              setValue(
                key as keyof ProductFormValues,
                value || (key === "is_new" ? true : false), // Handle defaults
                { shouldDirty: false },
              )
            } else if (["category_id", "brand_id"].includes(key)) {
              setValue(key as "category_id" | "brand_id", value === null ? (key === "brand_id" ? null : 0) : value, {
                shouldDirty: false,
              })
            }
          }
        })

        // Set images and variants
        setImages(product.image_urls || [])
        setVariants(product.variants || [])

        // Mark form as initialized
        formInitialized.current = true
        setFormChanged(false)

        console.log("Form reset complete")
      } catch (error) {
        console.error("Error resetting form:", error)
      } finally {
        // Re-enable form change tracking
        setTimeout(() => {
          isUpdatingForm.current = false
        }, 100)
      }
    },
    [setValue],
  )

  // Handle form submission
  const handleSubmit = async (data: ProductFormValues) => {
    try {
      setIsSubmitting(true)
      console.log("Form submission started with data:", data)

      // Prepare product data for submission
      const productData = {
        ...data,
        image_urls: images,
        thumbnail_url: images.length > 0 ? images[0] : null,
        variants: variants,
      }

      // If the brand_id is 0 (from the "None" option), set it to null
      if (productData.brand_id === 0) {
        productData.brand_id = null
      }

      console.log("Submitting product data:", productData)

      // Update the product
      try {
        const updatedProduct = await adminService.updateProduct(productId, productData)
        console.log("Product updated successfully:", updatedProduct)

        // Call the success callback
        onSuccess(updatedProduct)

        // Update local storage to track last saved time
        try {
          localStorage.setItem(`product_${productId}_last_saved`, new Date().toISOString())
        } catch (storageError) {
          console.warn("Could not save to localStorage:", storageError)
        }
      } catch (updateError: any) {
        console.error("Error during product update:", updateError)
        
        // Don't trigger auth error for 401 - the API request will handle retry
        // with refreshed token if needed. Keep user on the page so they don't lose work.
        if (updateError.response?.status === 401) {
          // Let the API error handler in adminService deal with token refresh
          throw new Error("Session verification required. Please try saving again.")
        }
        if (updateError.message && updateError.message.includes("Authentication")) {
          throw new Error("Session verification failed. Please check your connection and try again.")
        }
        throw updateError
      }
    } catch (error: any) {
      console.error("Failed to update product:", error)
      const errorMessage = error.message || "There was a problem updating the product. Please try again."
      onError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    form,
    formState,
    isSubmitting,
    formChanged,
    setFormChanged,
    images,
    setImages,
    variants,
    setVariants,
    handleSubmit,
    resetForm,
    isUpdatingForm,
  }
}
