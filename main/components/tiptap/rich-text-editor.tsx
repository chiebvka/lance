"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  const executeCommand = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value)
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
    },
    [onChange],
  )

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const formatButtons = [
    { command: "bold", icon: Bold, label: "Bold" },
    { command: "italic", icon: Italic, label: "Italic" },
    { command: "underline", icon: Underline, label: "Underline" },
    { command: "strikeThrough", icon: Strikethrough, label: "Strikethrough" },
  ]

  const listButtons = [
    { command: "insertUnorderedList", icon: List, label: "Bullet List" },
    { command: "insertOrderedList", icon: ListOrdered, label: "Numbered List" },
  ]

  const alignButtons = [
    { command: "justifyLeft", icon: AlignLeft, label: "Align Left" },
    { command: "justifyCenter", icon: AlignCenter, label: "Align Center" },
    { command: "justifyRight", icon: AlignRight, label: "Align Right" },
  ]

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2 flex items-center gap-1 flex-wrap">
        {/* Format Buttons */}
        {formatButtons.map(({ command, icon: Icon, label }) => (
          <Button key={command} variant="ghost" size="sm" onClick={() => executeCommand(command)} title={label}>
            <Icon className="h-4 w-4" />
          </Button>
        ))}

        <Separator orientation="vertical" className="h-6" />

        {/* List Buttons */}
        {listButtons.map(({ command, icon: Icon, label }) => (
          <Button key={command} variant="ghost" size="sm" onClick={() => executeCommand(command)} title={label}>
            <Icon className="h-4 w-4" />
          </Button>
        ))}

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment Buttons */}
        {alignButtons.map(({ command, icon: Icon, label }) => (
          <Button key={command} variant="ghost" size="sm" onClick={() => executeCommand(command)} title={label}>
            <Icon className="h-4 w-4" />
          </Button>
        ))}

        <Separator orientation="vertical" className="h-6" />

        {/* Additional Buttons */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt("Enter URL:")
            if (url) executeCommand("createLink", url)
          }}
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={() => executeCommand("formatBlock", "blockquote")} title="Quote">
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        dangerouslySetInnerHTML={{ __html: value }}
        className={`min-h-[400px] p-4 outline-none prose prose-sm max-w-none ${
          isFocused ? "ring-2 ring-ring ring-offset-2" : ""
        }`}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
        suppressContentEditableWarning
      />

      {!value && !isFocused && (
        <div className="absolute top-16 left-4 text-muted-foreground pointer-events-none">
          {placeholder || "Start typing your service agreement..."}
        </div>
      )}
    </div>
  )
}
