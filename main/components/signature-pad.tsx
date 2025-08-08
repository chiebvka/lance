"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface SignaturePadProps {
  onSignature: (signature: string) => void
  onClear: () => void
}

export function SignaturePad({ onSignature, onClear }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDark, setIsDark] = useState<boolean>(false)

  useEffect(() => {
    // Detect initial theme and subscribe to html class changes (tailwind dark mode)
    if (typeof document !== 'undefined') {
      const html = document.documentElement
      const compute = () => setIsDark(html.classList.contains('dark'))
      compute()
      const observer = new MutationObserver(compute)
      observer.observe(html, { attributes: true, attributeFilter: ['class'] })
      return () => observer.disconnect()
    }
  }, [])

  const getStrokeColor = () => (isDark ? '#ffffff' : '#000000')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Use contrasting color per theme
    ctx.strokeStyle = getStrokeColor()
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [isDark])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Ensure stroke color stays in sync when theme toggles while drawing
    ctx.strokeStyle = getStrokeColor()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return

    const dataURL = canvas.toDataURL()
    onSignature(dataURL)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onClear()
  }

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="border-2 border-dashed rounded-none cursor-crosshair bg-white dark:bg-zinc-900 border-purple-300 dark:border-purple-700"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <Button onClick={clearCanvas} variant="outline">
        Clear Signature
      </Button>
    </div>
  )
}
