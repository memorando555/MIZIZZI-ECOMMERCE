"use client"

import type React from "react"

import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form"
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
import { toast } from "@/components/ui/use-toast"
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
  const { setValue, watch, trigger } = form
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { updateProductOptimistic, isSyncing, hasPendingChanges } = useOptimisticProductUpdate({
    productId,
    onSuccess: () => {
      setLastSaved(new Date().toLocaleTimeString())
      setHasChanges(false)
    },
  })

  // Watch for form changes to enable auto-save
  const name = watch("name")
  const slug = watch("slug")
  const description = watch("description")
  const category_id = watch("category_id")
  const brand_id = watch("brand_id")
  const material = watch("material")
  const sku = watch("sku")

  // Handle name change to auto-generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setValue("name", newName)

    // Only auto-generate slug if it hasn't been manually edited or is empty
    if (!slug || slug === generateSlug(name)) {
      setValue("slug", generateSlug(newName))
    }

    setHasChanges(true)
  }

  // Handle save button click
  const handleSave = async () => {
    if (!hasChanges) {
      toast({
        description: "No changes to save",
      })
      return
    }

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

      // Dispatch custom event for product update
      window.dispatchEvent(
        new CustomEvent("product-basic-info-updated", {
          detail: { data: form.getValues() },
        }),
      )
    } catch (error) {
      console.error("Error saving basic info:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save on field changes (debounced)
  useEffect(() => {
    const autoSave = async () => {
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

          // Use optimistic update for instant UI feedback
          await updateProductOptimistic(changes, "Basic Info")
        } catch (error) {
          console.error("Auto-save failed:", error)
        }
      }, 1000) // 1 second debounce for auto-save
    }

    autoSave()

    return () => {
      clearTimeout(autoSaveTimerRef.current!)
    }
  }, [name, slug, description, category_id, brand_id, material, sku, hasChanges, isSaving, isSyncing])

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Product Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Product Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={handleNameChange}
                      placeholder="Enter product name"
                      className="h-10"
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
                  <FormLabel className="font-semibold">Slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="product-slug"
                      className="h-10 font-mono text-sm"
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
                  <div className="flex items-center justify-between">
                    <FormLabel className="font-semibold">Category</FormLabel>
                    {mutateCategories && (
                      <button
                        onClick={() => mutateCategories()}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Refresh
                      </button>
                    )}
                  </div>
                  <Select value={field.value?.toString() || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue
                          placeholder={
                            isLoadingCategories ? "Loading categories..." : "Select a category"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingCategories ? (
                        <div className="flex items-center gap-2 p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
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
                  <FormLabel className="font-semibold">Brand</FormLabel>
                  <Select value={field.value?.toString() || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue
                          placeholder={
                            isLoadingBrands ? "Loading brands..." : "Select a brand"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingBrands ? (
                        <div className="flex items-center gap-2 p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {brandError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                      <AlertCircle className="h-4 w-4" />
                      Failed to load brands
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
                  <FormLabel className="font-semibold">Material</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Cotton, Polyester, etc."
                      className="h-10"
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
                  <FormLabel className="font-semibold">SKU</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Stock Keeping Unit"
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right Column - Description */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="font-semibold">Product Description</FormLabel>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Show Preview
                    </Button>
                  </div>
                  <FormControl>
                    <RichDescriptionEditor {...field} />
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
              Syncing to users...
            </div>
          )}
          {hasPendingChanges && (
            <div className="text-xs text-blue-500">Pending sync to users</div>
          )}
          {lastSaved && !hasChanges && (
            <div className="text-sm text-green-600 font-medium flex items-center gap-2">
              <Check className="h-3 w-3" />
              Last saved: {lastSaved}
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

  // Watch for form changes to enable auto-save
  const name = watch("name")
  const slug = watch("slug")
  const description = watch("description")
  const category_id = watch("category_id")
  const brand_id = watch("brand_id")
  const material = watch("material")
  const sku = watch("sku")

  // Handle name change to auto-generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setValue("name", newName)

    // Only auto-generate slug if it hasn't been manually edited or is empty
    if (!slug || slug === generateSlug(name)) {
      setValue("slug", generateSlug(newName))
    }

    setHasChanges(true)
  }

  // Handle save button click
  const handleSave = async () => {
    if (!hasChanges) {
      toast({
        description: "No changes to save",
      })
      return
    }

    setIsSaving(true)
    try {
      const success = await saveSectionChanges("Basic Info")
      if (success) {
        setLastSaved(new Date().toLocaleTimeString())
        setHasChanges(false)

        // Dispatch custom event for product update
        window.dispatchEvent(
          new CustomEvent("product-basic-info-updated", {
            detail: { data: form.getValues() },
          }),
        )
      }
    } catch (error) {
      console.error("Error saving basic info:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Set up auto-save functionality
  useEffect(() => {
    // Clear any existing timer when form values change
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    if (hasChanges) {
      // Set a new timer to auto-save after 30 seconds of inactivity
      const timer = setTimeout(async () => {
        // Trigger validation before saving
        const isValid = await trigger()
        if (isValid) {
          handleSave()
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please correct the errors before auto-saving.",
          })
        }
      }, 30000)

      setAutoSaveTimer(timer)
    }

    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
    }
  }, [name, slug, description, category_id, brand_id, material, sku, hasChanges, trigger])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
    }
  }, [])

  const handleRefreshCategories = () => {
    if (mutateCategories) {
      console.log("[v0] Manually refreshing categories")
      mutateCategories()
    }
  }

  return (
    <Card className="border shadow-sm bg-white">
      <CardContent className="pt-6">
        <Form {...form}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} onChange={handleNameChange} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="text-base font-medium">Category</FormLabel>
                      <button
                        type="button"
                        onClick={handleRefreshCategories}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                        title="Refresh categories list"
                      >
                        Refresh
                      </button>
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

            <div className="space-y-6">
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

              {lastSaved && <div className="text-sm text-gray-500 mt-2">Last saved: {lastSaved}</div>}
            </div>
          </div>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 bg-gray-50">
        <div className="text-sm text-gray-500">
          {hasChanges && !isSaving && "Unsaved changes"}
          {isSaving && "Saving changes..."}
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={`bg-orange-500 hover:bg-orange-600 ${!hasChanges ? "opacity-70" : ""}`}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Basic Info
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
