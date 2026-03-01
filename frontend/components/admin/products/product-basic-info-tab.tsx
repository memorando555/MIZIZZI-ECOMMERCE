"use client"

import type React from "react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RichDescriptionEditor } from "./rich-description-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2, AlertCircle, Save, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateSlug } from "@/lib/utils"
import type { UseFormReturn } from "react-hook-form"
import type { ProductFormValues } from "@/hooks/use-product-form"
import { useState, useEffect, useRef, useCallback } from "react"
import { useOptimisticProductUpdate } from "@/hooks/use-optimistic-update"

interface ProductBasicInfoTabProps {
  form: UseFormReturn<ProductFormValues>
  categories: any[]
  brands: any[]
  isLoadingCategories: boolean
  isLoadingBrands: boolean
  brandError: boolean
  saveSectionChanges: (section: string) => Promise<boolean>
  mutateCategories?: () => void
  productId: string
}

export function ProductBasicInfoTab({
  form,
  categories,
  brands,
  isLoadingCategories,
  isLoadingBrands,
  brandError,
  saveSectionChanges,
  mutateCategories,
  productId,
}: ProductBasicInfoTabProps) {
  const { setValue, watch } = form
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { updateProductOptimistic, isSyncing } = useOptimisticProductUpdate({
    productId,
    onSuccess: () => {
      setLastSaved(new Date().toLocaleTimeString())
      setHasChanges(false)
    },
  })

  // Watch form values
  const name = watch("name")
  const slug = watch("slug")
  const description = watch("description")
  const category_id = watch("category_id")
  const brand_id = watch("brand_id")
  const material = watch("material")
  const sku = watch("sku")

  // Handle name changes and auto-generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setValue("name", newName)
    if (!slug || slug === generateSlug(name)) {
      setValue("slug", generateSlug(newName))
    }
    setHasChanges(true)
  }

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges || isSaving || isSyncing) return

    clearTimeout(autoSaveTimerRef.current!)
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const changes = {
          name,
          slug: slug || generateSlug(name),
          description,
          category_id: category_id ? Number(category_id) : null,
          brand_id: brand_id ? Number(brand_id) : null,
          material,
          sku,
        }
        await updateProductOptimistic(changes, "Basic Info")
      } catch (error) {
        console.error("Auto-save failed:", error)
      }
    }, 1000)

    return () => clearTimeout(autoSaveTimerRef.current!)
  }, [name, slug, description, category_id, brand_id, material, sku, hasChanges, isSaving, isSyncing])

  const handleSave = async () => {
    if (!hasChanges) return
    setIsSaving(true)
    try {
      const changes = {
        name,
        slug: slug || generateSlug(name),
        description,
        category_id: category_id ? Number(category_id) : null,
        brand_id: brand_id ? Number(brand_id) : null,
        material,
        sku,
      }
      await updateProductOptimistic(changes, "Basic Info")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border shadow-sm bg-white">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Product Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Product Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter product name"
                      {...field}
                      onChange={handleNameChange}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="product-slug"
                      {...field}
                      className="h-11 font-mono text-sm"
                      onChange={(e) => {
                        field.onChange(e)
                        setHasChanges(true)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-base font-medium">Category</FormLabel>
                    {mutateCategories && (
                      <button
                        type="button"
                        onClick={mutateCategories}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                        title="Refresh categories list"
                      >
                        Refresh
                      </button>
                    )}
                  </div>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => {
                      field.onChange(Number(value))
                      setHasChanges(true)
                    }}
                    disabled={isLoadingCategories}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a category">
                          {isLoadingCategories ? (
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </div>
                          ) : (
                            "Select a category"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Brand */}
            <FormField
              control={form.control}
              name="brand_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Brand</FormLabel>
                  <Select
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => {
                      field.onChange(value ? Number(value) : null)
                      setHasChanges(true)
                    }}
                    disabled={isLoadingBrands}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a brand">
                          {isLoadingBrands ? (
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </div>
                          ) : (
                            "Select a brand"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {brandError && (
                    <div className="flex items-center mt-2 text-sm text-amber-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>Warning: There was an issue loading brands. Only the current brand is shown.</span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Material */}
            <FormField
              control={form.control}
              name="material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Material</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Cotton, Polyester, etc."
                      {...field}
                      className="h-11"
                      onChange={(e) => {
                        field.onChange(e)
                        setHasChanges(true)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RichDescriptionEditor
                      value={field.value || ""}
                      onChange={(html) => {
                        field.onChange(html)
                        setHasChanges(true)
                      }}
                      productName={form.watch("name") || "Product"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SKU */}
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">SKU</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Stock Keeping Unit"
                      {...field}
                      className="h-11"
                      onChange={(e) => {
                        field.onChange(e)
                        setHasChanges(true)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-6 flex items-center justify-between">
        <div className="space-y-1">
          {hasChanges && (
            <div className="text-sm text-amber-600 font-medium flex items-center gap-2">
              <span className="h-2 w-2 bg-amber-600 rounded-full animate-pulse" />
              Unsaved changes
            </div>
          )}
          {isSyncing && (
            <div className="text-sm text-blue-600 font-medium flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing...
            </div>
          )}
          {lastSaved && !hasChanges && (
            <div className="text-sm text-green-600 font-medium flex items-center gap-2">
              <Check className="h-3 w-3" />
              Saved at {lastSaved}
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          size="lg"
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Basic Info
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
