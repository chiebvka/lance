"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TypedSignatureProps {
  onSignature: (name: string, font: string) => void
}

const fonts = [
  { name: "Elegant Script", value: "Dancing Script", class: "font-dancing-script" },
  { name: "Professional", value: "Playfair Display", class: "font-playfair" },
  { name: "Modern", value: "Inter", class: "font-inter" },
  { name: "Classic", value: "Times New Roman", class: "font-serif" },
]

export function TypedSignature({ onSignature }: TypedSignatureProps) {
  const [name, setName] = useState("")
  const [selectedFont, setSelectedFont] = useState(fonts[0].value)

  const handleNameChange = (value: string) => {
    setName(value)
    onSignature(value, selectedFont)
  }

  const handleFontChange = (font: string) => {
    setSelectedFont(font)
    onSignature(name, font)
  }

  const selectedFontClass = fonts.find((f) => f.value === selectedFont)?.class || "font-serif"

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="signature-name">Full Name</Label>
        <Input
          id="signature-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <Label htmlFor="signature-font">Signature Style</Label>
        <Select value={selectedFont} onValueChange={handleFontChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span className={font.class}>{font.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {name && (
        <div className="p-4 border-2 border-dashed border-purple-300 rounded-none">
          <p className="text-sm  mb-2">Preview:</p>
          <div className={`text-2xl ${selectedFontClass}`}>{name}</div>
        </div>
      )}
    </div>
  )
}
