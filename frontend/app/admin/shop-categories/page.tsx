"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2, GripVertical, Save, ImageIcon, Upload, Loader } from "lucide-react"
import Image from "next/image"
import { websocketService } from "@/services/websocket"
import { useSWRConfig } from "swr"
import { categoryService } from "@/services/category"

const getValidImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/placeholder.svg"

  // If it's already a data URL, use it directly
  if (url.startsWith("data:")) {
    return url
  }

  // If it's already an absolute URL, use it directly
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  // If it's a relative URL from the backend, prepend base URL
  if (url.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    return `${baseUrl}${url}`
  }

  return "/placeholder.svg"
}

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  image_url?: string
  banner_url?: string
  is_featured: boolean
  sort_order: number
  is_active?: boolean
}

interface FormData {
  name: string
  slug: string
  description: string
  image_url: string
  banner_url: string
  is_featured: boolean
  sort_order: number
  is_active: boolean
  // New fields for image upload
  image_data?: string
  image_filename?: string
  image_mimetype?: string
  banner_data?: string
  banner_filename?: string
  banner_mimetype?: string
}

export default function ShopCategoriesAdminPage() {
  const { toast } = useToast()
  const { mutate } = useSWRConfig()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    banner_url: "",
    is_featured: false,
    sort_order: 0,
    is_active: true,
    image_data: undefined,
    image_filename: undefined,
    image_mimetype: undefined,
    banner_data: undefined,
    banner_filename: undefined,
    banner_mimetype: undefined,
  })

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("admin_token") || localStorage.getItem("mizizzi_token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

      const response = await fetch(`${baseUrl}/api/admin/shop-categories/categories?per_page=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch categories")

      const data = await response.json()
      const normalizedCategories = (data.items || []).map((cat: Category) => ({
        ...cat,
        image_url: cat.image_url ? getValidImageUrl(cat.image_url) : undefined,
        banner_url: cat.banner_url ? getValidImageUrl(cat.banner_url) : undefined,
      }))
      setCategories(normalizedCategories)
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleImageUpload = async (file: File, field: "image_url" | "banner_url") => {
    if (!file) return

    try {
      setUploadingImage(true)

      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const token = localStorage.getItem("admin_token") || localStorage.getItem("mizizzi_token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

      const response = await fetch(`${baseUrl}/api/admin/shop-categories/categories/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()

      if (field === "image_url") {
        setFormData((prev) => ({
          ...prev,
          image_url: data.url, // Data URL for preview
          image_data: data.data, // Base64 data for saving
          image_filename: data.filename,
          image_mimetype: data.mimetype,
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          banner_url: data.url, // Data URL for preview
          banner_data: data.data, // Base64 data for saving
          banner_filename: data.filename,
          banner_mimetype: data.mimetype,
        }))
      }

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const token = localStorage.getItem("admin_token") || localStorage.getItem("mizizzi_token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

      // Prepare data for backend - include image_data fields
      const saveData: any = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description,
        is_featured: formData.is_featured,
        sort_order: formData.sort_order,
      }

      // Include image data if uploaded
      if (formData.image_data) {
        saveData.image_data = formData.image_data
        saveData.image_filename = formData.image_filename
        saveData.image_mimetype = formData.image_mimetype
      }

      // Include banner data if uploaded
      if (formData.banner_data) {
        saveData.banner_data = formData.banner_data
        saveData.banner_filename = formData.banner_filename
        saveData.banner_mimetype = formData.banner_mimetype
      }

      if (editingCategory) {
        // Update existing - use correct endpoint
        const response = await fetch(`${baseUrl}/api/admin/shop-categories/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(saveData),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to update category")
        }

        toast({
          title: "Success",
          description: "Category updated successfully",
        })

        await websocketService.emit("category_updated", {
          type: "updated",
          category: { id: editingCategory.id, ...formData },
        })
      } else {
        // Create new - use correct endpoint
        const response = await fetch(`${baseUrl}/api/admin/shop-categories/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(saveData),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to create category")
        }

        toast({
          title: "Success",
          description: "Category created successfully",
        })

        await websocketService.emit("category_updated", {
          type: "created",
          category: formData,
        })
      }

      setIsDialogOpen(false)
      fetchCategories()

      categoryService.clearCache()
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("categories")
      }

      // Invalidate SWR caches
      mutate((key: any) => typeof key === "string" && key.includes("categories"), undefined, { revalidate: true })
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save category",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return

    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("mizizzi_token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

      const response = await fetch(`${baseUrl}/api/admin/shop-categories/categories/${categoryToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete category")
      }

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })

      await websocketService.emit("category_updated", {
        type: "deleted",
        category: { id: categoryToDelete.id },
      })

      fetchCategories()

      categoryService.clearCache()
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("categories")
      }

      mutate((key: any) => typeof key === "string" && key.includes("categories"), undefined, { revalidate: true })
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setFormData({
      name: "",
      slug: "",
      description: "",
      image_url: "",
      banner_url: "",
      is_featured: false,
      sort_order: categories.length,
      is_active: true,
      image_data: undefined,
      image_filename: undefined,
      image_mimetype: undefined,
      banner_data: undefined,
      banner_filename: undefined,
      banner_mimetype: undefined,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      // Use the already normalized URLs from the categories state
      image_url: category.image_url || "",
      banner_url: category.banner_url || "",
      is_featured: category.is_featured,
      sort_order: category.sort_order,
      is_active: category.is_active ?? true,
      // Clear image data - will only be set if user uploads new image
      image_data: undefined,
      image_filename: undefined,
      image_mimetype: undefined,
      banner_data: undefined,
      banner_filename: undefined,
      banner_mimetype: undefined,
    })
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : slug,
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Shop Categories</h1>
              <p className="text-sm text-muted-foreground">Manage your store categories</p>
            </div>
            <Button 
              onClick={openCreateDialog}
              size="lg"
              className="gap-2 rounded-xl h-11 px-6 font-medium"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Add Category</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading categories...</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-2xl bg-muted/50 p-12 text-center space-y-3 max-w-md mx-auto">
              <div className="flex justify-center mb-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-primary/60" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground">No Categories Yet</h3>
              <p className="text-sm text-muted-foreground">Create your first category to get started managing your store</p>
              <Button 
                onClick={openCreateDialog}
                className="mt-6 gap-2 rounded-lg w-full"
              >
                <Plus className="h-4 w-4" />
                Create Category
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Apple-style List View */}
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="group flex items-center gap-4 px-5 py-4 rounded-xl border border-border/40 bg-card hover:bg-muted/40 transition-all duration-200 hover:border-border/60 hover:shadow-sm"
              >
                {/* Category Image - Thumbnail */}
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                  <Image
                    src={getValidImageUrl(category.image_url)}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Content - Middle Section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">{category.name}</h3>
                    {category.is_featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary flex-shrink-0 whitespace-nowrap">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                        </span>
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {category.description || "No description"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 font-mono mt-1">/{category.slug}</p>
                </div>

                {/* Actions - Right Section */}
                <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg p-0 hover:bg-muted"
                    title="Edit category"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(category)}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg p-0 hover:bg-destructive/10"
                    title="Delete category"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl border-border/50 overflow-hidden">
          {/* Header - Sticky */}
          <div className="flex-shrink-0 border-b border-border/40 px-5 sm:px-6 py-4 bg-background">
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {editingCategory ? "Update category details and manage visibility" : "Set up a new category with image, name, and display settings"}
            </DialogDescription>
          </div>

          {/* Content - Single Column Vertical Layout */}
          <div className="overflow-y-auto flex-1 min-h-0">
            <div className="space-y-4 p-5 sm:p-6">
              {/* Category Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold block">Category Image *</Label>
                <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 border border-border/50 h-32 sm:h-40 w-full">
                  <Image
                    src={getValidImageUrl(formData.image_url)}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  {!formData.image_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, "image_url")
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  size="sm"
                  className="w-full h-9 rounded-lg text-sm"
                >
                  {uploadingImage ? (
                    <>
                      <Loader className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-2" />
                      {formData.image_url ? "Change Image" : "Upload Image"}
                    </>
                  )}
                </Button>
              </div>

              {/* Category Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Electronics, Fashion"
                  className="h-9 rounded-lg text-sm"
                />
                <p className="text-xs text-muted-foreground">Clear, descriptive name</p>
              </div>

              {/* URL Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-sm font-semibold">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., electronics"
                  className="h-9 rounded-lg text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">Used in URLs and SEO</p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief category description"
                  rows={2}
                  className="rounded-lg text-sm resize-none"
                />
              </div>

              {/* Banner Image */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <Label className="text-sm font-semibold block">Banner Image (Optional)</Label>
                <div className="relative rounded-lg overflow-hidden bg-muted border border-border/50 h-24 w-full">
                  <Image
                    src={getValidImageUrl(formData.banner_url)}
                    alt="Banner"
                    fill
                    className="object-cover"
                  />
                </div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, "banner_url")
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingImage}
                  size="sm"
                  className="w-full h-9 rounded-lg text-sm"
                >
                  {uploadingImage ? "Uploading..." : (formData.banner_url ? "Change" : "Upload")} Banner
                </Button>
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold cursor-pointer">Featured Category</Label>
                  <p className="text-xs text-muted-foreground">Show on homepage</p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_featured: checked }))}
                />
              </div>

              {/* Display Order */}
              <div className="space-y-1.5">
                <Label htmlFor="sort_order" className="text-sm font-semibold">Display Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: Number.parseInt(e.target.value) || 0 }))}
                  min={0}
                  className="h-9 rounded-lg text-sm"
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
              </div>
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="flex-shrink-0 border-t border-border/40 bg-background px-5 sm:px-6 py-4 flex items-center justify-end gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              size="sm"
              className="h-9 rounded-lg px-4 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.image_url}
              size="sm"
              className="h-9 rounded-lg px-4 text-sm font-medium gap-2"
            >
              {saving ? (
                <>
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{editingCategory ? "Update" : "Create"}</span>
                  <span className="sm:hidden">{editingCategory ? "Save" : "Add"}</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl border-border/50">
          <AlertDialogHeader className="space-y-3">
            <div className="flex justify-center mb-1">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-lg">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">
              You're about to delete <span className="font-semibold text-foreground">"{categoryToDelete?.name}"</span>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel className="h-9 sm:h-10 rounded-lg text-xs sm:text-sm">Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-9 sm:h-10 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
