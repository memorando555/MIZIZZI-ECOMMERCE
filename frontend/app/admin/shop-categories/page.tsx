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
      {/* Header Section - Sticky & Responsive */}
      <div className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Shop By Category</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage category cards displayed on the homepage
              </p>
            </div>
            <Button onClick={openCreateDialog} className="gap-2 whitespace-nowrap flex-shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Category</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {/* Categories Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>Current Categories</CardTitle>
              <CardDescription className="text-sm">
                Click to edit • Categories are displayed in this order on the homepage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No categories yet</p>
                  <p className="text-sm">Click "Add Category" to create your first category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="group relative overflow-hidden rounded-lg border border-border bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                    >
                      {/* Category Image */}
                      <div className="relative h-32 w-full overflow-hidden bg-muted">
                        <Image
                          src={category.image_url || "/placeholder.svg"}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Category Info */}
                      <div className="p-4 space-y-3">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-base line-clamp-2">{category.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {category.description || "No description"}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{category.slug}</p>
                        </div>

                        {/* Actions - Visible on Hover (Desktop) or Always (Mobile) */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(category)}
                            className="flex-1 h-9"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            <span className="text-xs">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                            onClick={() => openDeleteDialog(category)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            <span className="text-xs">Delete</span>
                          </Button>
                        </div>
                      </div>

                      {/* Badge for Featured/Active Status */}
                      {category.is_featured && (
                        <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-md">
                          Featured
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[95vh] flex flex-col p-0 gap-0 rounded-2xl">
          {/* Header */}
          <div className="border-b border-border/40 bg-background px-6 py-5 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm">
              {editingCategory ? "Update the category details" : "Add a new category to your store"}
            </DialogDescription>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1">
            <div className="space-y-5 p-6">
              {/* Category Image - Compact */}
              <div className="space-y-2">
                <Label className="font-semibold">Category Image *</Label>
                <div className="relative">
                  <div className="relative h-32 w-full rounded-lg overflow-hidden bg-muted border border-border/50 mb-2">
                    <Image
                      src={formData.image_url || "/placeholder.svg"}
                      alt="Category preview"
                      fill
                      className="object-cover"
                    />
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
                    className="w-full h-9 rounded-lg"
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
              </div>

              {/* Name and Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Electronics"
                    className="h-9 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="slug" className="text-sm font-medium">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="electronics"
                    className="h-9 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description"
                  rows={2}
                  className="rounded-lg text-sm resize-none"
                />
              </div>

              {/* Banner Image - Compact */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <Label className="text-sm font-medium">Banner Image (Optional)</Label>
                <div className="relative">
                  <div className="relative h-24 w-full rounded-lg overflow-hidden bg-muted border border-border/50 mb-2">
                    <Image
                      src={formData.banner_url || "/placeholder.svg"}
                      alt="Banner preview"
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
                    className="w-full h-9 rounded-lg"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader className="h-3.5 w-3.5 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        {formData.banner_url ? "Change Banner" : "Upload Banner"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Featured & Sort Order */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <Label className="text-sm font-medium">Featured</Label>
                    <p className="text-xs text-muted-foreground">Show on homepage</p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_featured: checked }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sort_order" className="text-sm font-medium">Display Order</Label>
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
          </div>

          {/* Footer */}
          <div className="border-t border-border/40 bg-background px-6 py-3 flex items-center justify-between gap-2 flex-shrink-0">
            <Button 
              variant="ghost" 
              onClick={() => setIsDialogOpen(false)}
              size="sm"
              className="h-9"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.name || !formData.image_url}
              size="sm"
              className="h-9 gap-2"
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
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mx-auto">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">
              Are you sure you want to delete "<strong>{categoryToDelete?.name}</strong>"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel className="h-9 rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-9 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
