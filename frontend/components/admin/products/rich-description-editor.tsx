"use client"

import React, { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Eye,
  EyeOff,
  LinkIcon,
  ImageIcon,
  Upload,
  Loader,
} from "lucide-react"

interface RichDescriptionEditorProps {
  value: string
  onChange: (value: string) => void
  productName?: string
}

export function RichDescriptionEditor({
  value,
  onChange,
  productName = "Product",
}: RichDescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url")

  // Initialize content on mount
  useEffect(() => {
    if (editorRef.current && !isInitialized && value) {
      editorRef.current.innerHTML = value
      setIsInitialized(true)
    }
  }, [isInitialized, value])

  const executeCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const insertHeading = (level: 1 | 2 | 3) => {
    document.execCommand("formatBlock", false, `<h${level}>`)
    editorRef.current?.focus()
  }

  const insertBulletList = () => {
    document.execCommand("insertUnorderedList", false)
    editorRef.current?.focus()
  }

  const insertNumberedList = () => {
    document.execCommand("insertOrderedList", false)
    editorRef.current?.focus()
  }

  const insertImageFromUrl = () => {
    if (!imageUrl.trim()) {
      alert("Please enter an image URL")
      return
    }
    
    // Add Cloudinary optimization if it's a Cloudinary URL
    let optimizedUrl = imageUrl
    if (imageUrl.includes("res.cloudinary.com")) {
      optimizedUrl = imageUrl.replace("/upload/", "/upload/c_limit,q_auto,f_auto/")
    }

    // Insert image wrapped in paragraph for better display
    const imgHtml = `<p><img src="${optimizedUrl}" alt="Product image" style="width: 100%; max-width: 100%; height: auto; display: block; border-radius: 8px; margin: 16px auto;" /></p>`
    document.execCommand("insertHTML", false, imgHtml)
    setImageUrl("")
    setShowImageModal(false)
    editorRef.current?.focus()
    
    // Trigger change to update state and cause re-render
    setTimeout(() => {
      if (editorRef.current) {
        handleChange()
      }
    }, 50)
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("product_id", "temp") // For description images, use temp product ID

      console.log("[v0] Uploading image file to Cloudinary:", file.name)

      // Get auth token
      const token = localStorage.getItem("admin_token") || localStorage.getItem("mizizzi_token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

      // Upload using the same backend endpoint as product images
      const response = await fetch(`${baseUrl}/api/admin/cloudinary/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }))
        console.error("[v0] Upload error:", errorData)
        throw new Error(errorData.error?.message || errorData.error || errorData.message || `Upload failed with status ${response.status}`)
      }

      const uploadResult = await response.json()
      console.log("[v0] Cloudinary upload response:", uploadResult)

      // Extract secure URL from backend response - check image object first
      const uploadedUrl = uploadResult.image?.secure_url || 
                         uploadResult.image?.url ||
                         uploadResult.secure_url || 
                         uploadResult.url || 
                         uploadResult.data?.secure_url

      if (!uploadedUrl) {
        console.error("[v0] No URL found in upload response:", uploadResult)
        throw new Error("No image URL returned from Cloudinary")
      }

      // Add Cloudinary optimization transformations for auto format and quality
      const cloudinaryOptimizedUrl = uploadedUrl.replace("/upload/", "/upload/c_limit,q_auto,f_auto/")

      console.log("[v0] Inserting image with optimized URL:", cloudinaryOptimizedUrl)

      // Insert image wrapped in a paragraph for better display in contentEditable
      const imgHtml = `<p><img src="${cloudinaryOptimizedUrl}" alt="Product image" style="width: 100%; max-width: 100%; height: auto; display: block; border-radius: 8px; margin: 16px auto;" /></p>`
      document.execCommand("insertHTML", false, imgHtml)
      
      console.log("[v0] Image inserted successfully into description")
      setShowImageModal(false)
      editorRef.current?.focus()
      
      // Trigger change to update state and cause immediate re-render
      setTimeout(() => {
        if (editorRef.current) {
          handleChange()
        }
      }, 50)
    } catch (error) {
      console.error("[v0] Image upload error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image"
      alert(`${errorMessage}. Please try again or use a URL instead.`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="space-y-4">
      <style>{`
        .editor-content img {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
          border-radius: 8px !important;
          margin: 16px auto !important;
          object-fit: cover !important;
        }
        .editor-content {
          word-break: break-word;
          overflow-wrap: break-word;
        }
      `}</style>
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold text-gray-900">Product Description</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Show Preview
            </>
          )}
        </Button>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <LinkIcon className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          Format your description with headings, bold text, bullets and lists like Jumia. Use the toolbar to add formatting and images.
        </AlertDescription>
      </Alert>

      {/* Formatting Toolbar */}
      <Card className="p-4 bg-gray-50 border border-gray-200">
        <div className="flex flex-wrap gap-3">
          {/* Headings Group */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3">
            <span className="text-xs font-medium text-gray-600 mr-1">Headings:</span>
            <button
              type="button"
              onClick={() => insertHeading(2)}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-700 hover:text-gray-900"
              title="Heading 2 - Use for main sections"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertHeading(3)}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-700 hover:text-gray-900"
              title="Heading 3 - Use for subsections"
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </div>

          {/* Text Formatting Group */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3">
            <span className="text-xs font-medium text-gray-600 mr-1">Format:</span>
            <button
              type="button"
              onClick={() => executeCommand("bold")}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors font-bold text-gray-700 hover:text-gray-900"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("italic")}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors italic text-gray-700 hover:text-gray-900"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>
          </div>

          {/* Lists Group */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3">
            <span className="text-xs font-medium text-gray-600 mr-1">Lists:</span>
            <button
              type="button"
              onClick={insertBulletList}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-700 hover:text-gray-900"
              title="Bullet List - Use for features/benefits"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={insertNumberedList}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-700 hover:text-gray-900"
              title="Numbered List - Use for steps"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>

          {/* Media Group */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-600 mr-1">Media:</span>
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-700 hover:text-gray-900"
              title="Insert Image - Add images between sections"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Editor */}
      <div className="border-2 border-gray-300 rounded-lg overflow-auto bg-white">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleChange}
          suppressContentEditableWarning
          className="editor-content min-h-96 p-6 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0
            text-gray-800 leading-relaxed font-sans
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-900
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-gray-800
            [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-3
            [&_strong]:font-bold [&_strong]:text-gray-900
            [&_em]:italic [&_em]:text-gray-600
            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-3 [&_ul]:text-gray-700
            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-3 [&_ol]:text-gray-700
            [&_li]:text-gray-700 [&_li]:my-1 [&_li]:mb-2
            [&_img]:w-full [&_img]:max-w-full [&_img]:h-auto [&_img]:block [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-0
          "
        />
      </div>

      {/* Image Insertion Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Add Image to Description</h3>
            
            {/* Mode Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setUploadMode("url")}
                className={`pb-2 px-2 font-medium transition-colors ${
                  uploadMode === "url"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                From URL
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`pb-2 px-2 font-medium transition-colors ${
                  uploadMode === "file"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Upload File
              </button>
            </div>

            {/* URL Mode */}
            {uploadMode === "url" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Image URL</Label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowImageModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={insertImageFromUrl}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Insert Image
                  </Button>
                </div>
              </div>
            )}

            {/* File Upload Mode */}
            {uploadMode === "file" && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
                {isUploading && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader className="h-4 w-4 animate-spin text-orange-600" />
                    <span className="text-sm text-gray-600">Uploading...</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowImageModal(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <Card className="p-6 bg-gray-50 border-2 border-orange-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Preview - How customers will see it:</h3>
          <div className="bg-white p-6 rounded-lg border border-gray-200 font-sans overflow-auto
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-900
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-gray-800
            [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-3
            [&_strong]:font-bold [&_strong]:text-gray-900
            [&_em]:italic [&_em]:text-gray-600
            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-3 [&_ul]:text-gray-700
            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-3 [&_ol]:text-gray-700
            [&_li]:text-gray-700 [&_li]:my-1 [&_li]:mb-2
            [&_img]:w-full [&_img]:max-w-full [&_img]:h-auto [&_img]:block [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto
          "
          style={{ minHeight: '300px', maxHeight: 'none' }}
          >
            <div dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        </Card>
      )}

      {/* Format Help */}
      <Card className="p-4 bg-green-50 border border-green-200">
        <p className="text-sm font-semibold text-green-900 mb-3">Formatting Tips (Jumia style):</p>
        <ul className="text-sm text-green-800 space-y-2 list-disc list-inside">
          <li><strong>Heading 2</strong> for main sections: "Key Benefits", "How to Use", "Specifications"</li>
          <li><strong>Heading 3</strong> for subsections within sections</li>
          <li><strong>Bold</strong> text for feature names: "<strong>Deeply Nourishes</strong> Dry and Damaged Hair"</li>
          <li><strong>Bullet Lists</strong> for features, benefits, and key points</li>
          <li><strong>Numbered Lists</strong> for step-by-step instructions like "How to Use"</li>
          <li><strong>Images</strong> between sections - upload from PC or paste image URLs to showcase product features</li>
        </ul>
      </Card>
    </div>
  )
}
