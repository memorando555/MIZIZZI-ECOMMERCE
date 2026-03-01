"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2, Loader, ImageIcon, Upload, Save } from "lucide-react"
import Image from "next/image"
import { websocketService } from "@/services/websocket"
import { useSWRConfig } from "swr"
import { categoryService } from "@/services/category"

const getValidImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/placeholder.svg"

  if (url.startsWith("data:")) {
    return url
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

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

export default function ShopCategoriesAdminPage() {
  const { toast } = useToast()
  const { mutate } = useSWRConfig()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    banner_url: "",
    is_featured: false,
    sort_order: 0,
  })

  const imageInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

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

  const handleDelete = async (category: Category) => {
    try {
      setDeletingId(category.id)
      const token = localStorage.getItem("admin_token") || localStorage.getItem("mizizzi_token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

      const response = await fetch(`${baseUrl}/api/admin/shop-categories/categories/${category.id}`, {
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
        category: { id: category.id },
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
      setDeletingId(null)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      banner_url: category.banner_url || "",
      is_featured: category.is_featured,
      sort_order: category.sort_order,
    })
    setIsDialogOpen(true)
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
      sort_order: 0,
    })
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    }))
  }

  const handleImageUpload = async (file: File, fieldName: "image_url" | "banner_url") => {
    if (!file) return

    try {
      setUploadingImage(true)
      const formDataObj = new FormData()
      formDataObj.append("file", file)

      const token = localStorage.getItem("admin_token") || localStorage.getItem("mizizzi_token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

      const response = await fetch(`${baseUrl}/api/admin/shop-categories/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataObj,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      setFormData((prev) => ({
        ...prev,
        [fieldName]: data.url,
      }))
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
    if (!formData.name || !formData.image_url) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem("admin_token") || localStorage.getItem("mizizzi_token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

      const payload = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description,
        image_url: formData.image_url,
        banner_url: formData.banner_url,
        is_featured: formData.is_featured,
        sort_order: formData.sort_order,
      }

      const url = editingCategory
        ? `${baseUrl}/api/admin/shop-categories/categories/${editingCategory.id}`
        : `${baseUrl}/api/admin/shop-categories/categories`

      const response = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to save category")
      }

      toast({
        title: "Success",
        description: editingCategory ? "Category updated successfully" : "Category created successfully",
      })

      setIsDialogOpen(false)
      await websocketService.emit("category_updated", {
        type: editingCategory ? "updated" : "created",
        category: payload,
      })

      fetchCategories()
      categoryService.clearCache()
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
            {categories.map((category) => (
              <div
                key={category.id}
                className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-all duration-200 hover:border-border/60 hover:shadow-sm"
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

                {/* Actions - Right Section - Apple Style */}
                <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:opacity-100">
                  {/* Edit Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category)}
                    className="h-9 rounded-lg px-4 gap-2 border-blue-200/50 hover:border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700 font-medium text-sm transition-all duration-200"
                    title="Edit category"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>

                  {/* Delete Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(category)}
                    disabled={deletingId === category.id}
                    className="h-9 rounded-lg px-4 gap-2 border-red-200/50 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete category"
                  >
                    {deletingId === category.id ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog - Modern Apple-style Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col p-0 gap-0 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
          {/* Fixed Header */}
          <div className="flex-shrink-0 border-b border-border/40 px-6 sm:px-8 py-5 bg-background sticky top-0 z-10">
            <DialogTitle className="text-2xl sm:text-3xl font-bold">
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm sm:text-base text-muted-foreground">
              {editingCategory ? "Update your category details and visibility settings" : "Set up a new category for your store with all necessary details"}
            </DialogDescription>
          </div>

          {/* Scrollable Content - Clean organized layout */}
          <div className="overflow-y-auto flex-1 min-h-0 px-6 sm:px-8 py-6">
            <div className="space-y-6 max-w-3xl">
              {/* Section 1: Image Uploads */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-widest">Images</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Main Category Image */}
                  <div className="space-y-2">
                    <Label htmlFor="category-image" className="text-sm font-semibold">Category Image *</Label>
                    <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 border-2 border-border/40 h-32 sm:h-40 group hover:border-border/60 transition-colors">
                      <Image
                        src={getValidImageUrl(formData.image_url)}
                        alt="Category preview"
                        fill
                        className="object-cover group-hover:opacity-90 transition-opacity"
                      />
                      {!formData.image_url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
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
                      className="w-full h-9 rounded-lg font-medium text-xs sm:text-sm"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader className="h-3.5 w-3.5 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5 mr-2" />
                          {formData.image_url ? "Change" : "Upload"} Image
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Banner Image */}
                  <div className="space-y-2">
                    <Label htmlFor="banner-image" className="text-sm font-semibold">Banner (Optional)</Label>
                    <div className="relative rounded-lg overflow-hidden bg-muted border border-border/40 h-32 sm:h-40 group hover:border-border/60 transition-colors">
                      <Image
                        src={getValidImageUrl(formData.banner_url)}
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
                      className="w-full h-9 rounded-lg font-medium text-xs sm:text-sm"
                    >
                      {uploadingImage ? "Uploading..." : (formData.banner_url ? "Change" : "Upload")} Banner
                    </Button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/40" />

              {/* Section 2: Basic Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-widest">Information</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium">Category Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Electronics, Fashion"
                      className="h-10 rounded-lg text-sm border-border/40 focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="slug" className="text-sm font-medium">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="e.g., electronics"
                      className="h-10 rounded-lg text-sm font-mono text-xs border-border/40 focus:border-primary/50"
                    />
                    <p className="text-xs text-muted-foreground">Used in URLs and SEO</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this category..."
                      rows={2}
                      className="rounded-lg text-sm border-border/40 focus:border-primary/50 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/40" />

              {/* Section 3: Display Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-widest">Settings</h3>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/40 hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold cursor-pointer">Featured Category</Label>
                    <p className="text-xs text-muted-foreground">Show on homepage</p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_featured: checked }))}
                  />
                </div>

                {/* Sort Order */}
                <div className="space-y-1.5">
                  <Label htmlFor="sort_order" className="text-sm font-medium">Display Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: Number.parseInt(e.target.value) || 0 }))}
                    min={0}
                    className="h-10 rounded-lg text-sm border-border/40 focus:border-primary/50"
                  />
                  <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 border-t border-border/40 bg-background px-6 sm:px-8 py-4 flex items-center justify-end gap-3 sticky bottom-0 z-10">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              size="sm"
              className="h-10 px-6 rounded-lg font-medium text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.image_url}
              size="sm"
              className="h-10 px-6 rounded-lg font-medium text-sm gap-2"
            >
              {saving ? (
                <>
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {editingCategory ? "Update" : "Create"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Modern Style */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl border-border/50">
          <AlertDialogHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-2xl">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              You're about to delete <span className="font-semibold text-foreground">"{categoryToDelete?.name}"</span>
              <br />
              <span className="text-sm">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-3 sm:flex-row pt-4">
            <AlertDialogCancel className="h-11 rounded-lg font-medium text-base">Keep Category</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (categoryToDelete) {
                  handleDelete(categoryToDelete)
                  setDeleteDialogOpen(false)
                }
              }}
              className="h-11 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium text-base"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
