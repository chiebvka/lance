"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Shuffle } from "lucide-react"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [hue, setHue] = useState(220)
  const [saturation, setSaturation] = useState(70)
  const [lightness, setLightness] = useState(50)
  const [vibrancy, setVibrancy] = useState(50)

  const generateColor = (h: number, s: number, l: number) => {
    return `hsl(${h}, ${s}%, ${l}%)`
  }

  const colorShades = [
    { name: "50", lightness: 95 },
    { name: "100", lightness: 90 },
    { name: "200", lightness: 80 },
    { name: "300", lightness: 70 },
    { name: "400", lightness: 60 },
    { name: "500", lightness: 50 },
    { name: "600", lightness: 40 },
    { name: "700", lightness: 30 },
    { name: "800", lightness: 20 },
    { name: "900", lightness: 10 },
  ]

  const randomizeColor = () => {
    const newHue = Math.floor(Math.random() * 360)
    const newSaturation = Math.floor(Math.random() * 50) + 50
    const newLightness = Math.floor(Math.random() * 40) + 30
    setHue(newHue)
    setSaturation(newSaturation)
    setLightness(newLightness)
    onChange(generateColor(newHue, newSaturation, newLightness))
  }

  const selectShade = (shade: (typeof colorShades)[0]) => {
    const color = generateColor(hue, saturation, shade.lightness)
    onChange(color)
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Base Color</Label>
          <Button size="sm" variant="outline" onClick={randomizeColor}>
            <Shuffle className="h-4 w-4 mr-1" />
            Randomize
          </Button>
        </div>

        {/* Color Picker Area */}
        <div className="relative">
          <div
            className="w-full h-32 rounded-lg cursor-crosshair"
            style={{
              background: `linear-gradient(to right, 
                hsl(${hue}, 0%, 100%), 
                hsl(${hue}, 100%, 50%)), 
                linear-gradient(to bottom, 
                transparent, 
                hsl(${hue}, 0%, 0%))`,
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              const newSaturation = (x / rect.width) * 100
              const newLightness = 100 - (y / rect.height) * 100
              setSaturation(newSaturation)
              setLightness(newLightness)
              onChange(generateColor(hue, newSaturation, newLightness))
            }}
          >
            <div
              className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg transform -translate-x-2 -translate-y-2"
              style={{
                left: `${saturation}%`,
                top: `${100 - lightness}%`,
              }}
            />
          </div>
        </div>

        {/* Hue Slider */}
        <div className="space-y-2">
          <div
            className="w-full h-4 rounded-lg cursor-pointer"
            style={{
              background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const newHue = (x / rect.width) * 360
              setHue(newHue)
              onChange(generateColor(newHue, saturation, lightness))
            }}
          >
            <div
              className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg transform -translate-x-2 -translate-y-0"
              style={{ left: `${(hue / 360) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Color Display */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded border"
            style={{ backgroundColor: generateColor(hue, saturation, lightness) }}
          />
          <span className="text-sm font-mono">{generateColor(hue, saturation, lightness)}</span>
        </div>

        {/* Vibrancy Slider */}
        <div className="space-y-2">
          <Label>Vibrancy: {vibrancy}%</Label>
          <Slider
            value={[vibrancy]}
            onValueChange={(value) => setVibrancy(value[0])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Color Shades */}
        
      </div>
    </Card>
  )
}
