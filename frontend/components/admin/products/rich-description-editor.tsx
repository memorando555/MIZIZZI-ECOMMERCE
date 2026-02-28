"use client"

import React, { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ImageIcon, Plus, X, Eye, EyeOff, LinkIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface RichDescriptionEditorProps {
  value: string
  onChange: (value: string) => void
  productName?: string
}

interface DescriptionBlock {
  id: string
  type: "text" | "image"
  content: string
}

export function RichDescriptionEditor({ value, onChange, productName = "Product" }: RichDescriptionEditorProps) {
  const [blocks, setBlocks] = useState<DescriptionBlock[]>(() => {
    // Parse existing HTML description into blocks
    if (!value) return [{ id: "1", type: "text", content: "" }]

    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(value, "text/html")
      const parsedBlocks: DescriptionBlock[] = []
      let blockId = 1

      // Extract text and images
      const children = doc.body.childNodes
      let textBuffer = ""

      children.forEach((node) => {
        if (node.nodeName === "IMG") {
          // Save any accumulated text
          if (textBuffer.trim()) {
            parsedBlocks.push({
              id: String(blockId++),
              type: "text",
              content: textBuffer.trim(),
            })
            textBuffer = ""
          }
          // Add image block
          const img = node as HTMLImageElement
          parsedBlocks.push({
            id: String(blockId++),
            type: "image",
            content: img.src || "",
          })
        } else {
          // Accumulate text content
          textBuffer += node.textContent || ""
        }
      })

      // Add any remaining text
      if (textBuffer.trim()) {
        parsedBlocks.push({
          id: String(blockId++),
          type: "text",
          content: textBuffer.trim(),
        })
      }

      return parsedBlocks.length > 0 ? parsedBlocks : [{ id: "1", type: "text", content: value }]
    } catch (error) {
      // Fallback to single text block
      return [{ id: "1", type: "text", content: value }]
    }
  })

  const [showPreview, setShowPreview] = useState(false)

  // Convert blocks to HTML
  const blocksToHTML = (blocks: DescriptionBlock[]): string => {
    const html = blocks
      .map((block) => {
        if (block.type === "text") {
          return `<p>${block.content.replace(/\n/g, "<br>")}</p>`
        } else {
          // Wrap image in a figure tag for better semantic HTML and styling
          return `<figure style="width: 100%; margin: 2rem 0; display: block; clear: both;"><img src="${block.content}" alt="${productName}" style="width: 100%; height: auto; border-radius: 8px;" /></figure>`
        }
      })
      .join("\n")
    
    console.log("[v0] Generated HTML for product description:", html)
    console.log("[v0] HTML length:", html.length)
    console.log("[v0] Number of blocks:", blocks.length)
    console.log("[v0] Blocks:", blocks)
    return html
  }

  // Update parent component whenever blocks change
  React.useEffect(() => {
    const html = blocksToHTML(blocks)
    onChange(html)
  }, [blocks])

  const addTextBlock = () => {
    setBlocks([...blocks, { id: Date.now().toString(), type: "text", content: "" }])
  }

  const addImageBlock = () => {
    setBlocks([...blocks, { id: Date.now().toString(), type: "image", content: "" }])
  }

  const updateBlock = (id: string, content: string) => {
    setBlocks(blocks.map((block) => (block.id === id ? { ...block, content } : block)))
  }

  const removeBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter((block) => block.id !== id))
    }
  }

  const moveBlockUp = (id: string) => {
    const index = blocks.findIndex((b) => b.id === id)
    if (index > 0) {
      const newBlocks = [...blocks]
      ;[newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]]
      setBlocks(newBlocks)
    }
  }

  const moveBlockDown = (id: string) => {
    const index = blocks.findIndex((b) => b.id === id)
    if (index < blocks.length - 1) {
      const newBlocks = [...blocks]
      ;[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]]
      setBlocks(newBlocks)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Product Description</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" /> Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" /> Show Preview
              </>
            )}
          </Button>
        </div>
      </div>

      <Alert>
        <LinkIcon className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Build your product description  - add text sections and images alternately to showcase features.
          Images will be displayed full-width between text sections.
        </AlertDescription>
      </Alert>

      {/* Editor Blocks */}
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <Card key={block.id} className="p-4 border-2 hover:border-orange-200 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    {block.type === "text" ? "Text Section" : "Image Section"}
                  </span>
                  <div className="flex gap-1">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveBlockUp(block.id)}
                        className="h-7 w-7 p-0"
                      >
                        ↑
                      </Button>
                    )}
                    {index < blocks.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveBlockDown(block.id)}
                        className="h-7 w-7 p-0"
                      >
                        ↓
                      </Button>
                    )}
                    {blocks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlock(block.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {block.type === "text" ? (
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder="Enter text content for this section..."
                    className="min-h-[120px] resize-y"
                  />
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                      className="font-mono text-sm"
                    />
                    {block.content && (
                      <div className="relative w-full max-w-md h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={block.content || "/placeholder.svg"}
                          alt="Preview"
                          fill
                          className="object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Block Buttons */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={addTextBlock} className="flex-1 bg-transparent">
          <Plus className="h-4 w-4 mr-2" />
          Add Text Section
        </Button>
        <Button type="button" variant="outline" onClick={addImageBlock} className="flex-1 bg-transparent">
          <ImageIcon className="h-4 w-4 mr-2" />
          Add Image Section
        </Button>
      </div>

      {/* Preview */}
      {showPreview && (
        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg">
            <div dangerouslySetInnerHTML={{ __html: blocksToHTML(blocks) }} />
          </div>
        </Card>
      )}
    </div>
  )
}
