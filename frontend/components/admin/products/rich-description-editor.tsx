"use client"

import React, { useRef } from "react"
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
        <Label className="text-base font-medium">Product Description</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Show Preview
            </>
          )}
        </Button>
      </div>

      <Alert>
        <LinkIcon className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Format your description with headings, bold text, bullets and lists like Jumia does. Use the toolbar to add formatting.
        </AlertDescription>
      </Alert>

      {/* Formatting Toolbar */}
      <Card className="p-3 bg-gray-50 border border-gray-200">
        <div className="flex flex-wrap gap-2">
          {/* Headings */}
          <div className="flex items-center gap-1 border-r pr-2">
            <button
              type="button"
              onClick={() => insertHeading(2)}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors"
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertHeading(3)}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors"
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r pr-2">
            <button
              type="button"
              onClick={() => executeCommand("bold")}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors font-bold"
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("italic")}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors italic"
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r pr-2">
            <button
              type="button"
              onClick={insertBulletList}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors"
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={insertNumberedList}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors"
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>

          {/* Image */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={insertImage}
              className="p-2 hover:bg-gray-200 rounded-md transition-colors"
              title="Insert Image"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Editor */}
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleChange}
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: value || "" }}
          className="min-h-96 p-6 bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-orange-500 prose prose-sm max-w-none
            prose-h2:text-xl prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-strong:font-bold prose-strong:text-gray-900
            prose-em:italic prose-em:text-gray-600
            prose-ul:list-disc prose-ul:ml-6 prose-ul:my-3
            prose-ol:list-decimal prose-ol:ml-6 prose-ol:my-3
            prose-li:text-gray-700 prose-li:my-1
            prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:my-4
          "
        />
      </div>

      {/* Preview */}
      {showPreview && (
        <Card className="p-6 bg-gray-50 border-2 border-orange-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Preview</h3>
          <div className="bg-white p-6 rounded-lg prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        </Card>
      )}

      {/* Format Help */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm font-medium text-blue-900 mb-2">Formatting Tips:</p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Use <strong>Heading 2</strong> for main sections like "Key Benefits"</li>
          <li>Use <strong>Heading 3</strong> for subsections</li>
          <li>Use <strong>Bold</strong> to highlight important terms</li>
          <li>Use <strong>Bullet Lists</strong> for features and benefits</li>
          <li>Use <strong>Numbered Lists</strong> for step-by-step instructions</li>
          <li>Insert images between sections for visual appeal</li>
        </ul>
      </Card>
    </div>
  )
}
