"use client"

import React, { useRef, useEffect } from "react"
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
  const [showPreview, setShowPreview] = React.useState(false)
  const [isInitialized, setIsInitialized] = React.useState(false)

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

  const insertImage = () => {
    const url = prompt("Enter image URL:")
    if (url) {
      document.execCommand("insertImage", false, url)
      editorRef.current?.focus()
    }
  }

  const handleChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="space-y-4">
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
          Format your description with headings, bold text, bullets and lists like Jumia. Use the toolbar to add formatting.
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
              onClick={insertImage}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-700 hover:text-gray-900"
              title="Insert Image - Add images between sections"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Editor */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleChange}
          suppressContentEditableWarning
          className="min-h-96 p-6 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-0
            text-gray-800 leading-relaxed
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-900
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-gray-800
            [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-3
            [&_strong]:font-bold [&_strong]:text-gray-900
            [&_em]:italic [&_em]:text-gray-600
            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-3 [&_ul]:text-gray-700
            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-3 [&_ol]:text-gray-700
            [&_li]:text-gray-700 [&_li]:my-1 [&_li]:mb-2
            [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4
          "
        />
      </div>

      {/* Preview */}
      {showPreview && (
        <Card className="p-6 bg-gray-50 border-2 border-orange-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Preview - How customers will see it:</h3>
          <div className="bg-white p-6 rounded-lg border border-gray-200
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-900
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-gray-800
            [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-3
            [&_strong]:font-bold [&_strong]:text-gray-900
            [&_em]:italic [&_em]:text-gray-600
            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-3 [&_ul]:text-gray-700
            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-3 [&_ol]:text-gray-700
            [&_li]:text-gray-700 [&_li]:my-1 [&_li]:mb-2
            [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4
          ">
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
          <li><strong>Images</strong> between sections to showcase product features</li>
        </ul>
      </Card>
    </div>
  )
}
