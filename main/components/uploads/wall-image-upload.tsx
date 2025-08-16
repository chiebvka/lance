"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Image from "next/image"

interface WallImageUploadProps {
  label?: string
  value?: string | null
  disabled?: boolean
  onUploaded: (url: string) => void
}

// Client-side validation config
const MAX_IMAGE_MB = 10
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml", "image/webp"]

export default function WallImageUpload({ label = "Image", value, disabled, onUploaded }: WallImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const validate = (f: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
      return "Only JPEG, PNG, JPG, SVG, or WEBP images are allowed."
    }
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
      return `Image must be under ${MAX_IMAGE_MB}MB.`
    }
    return null
  }

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const v = validate(f)
    if (v) {
      setError(v)
      return
    }
    setError(null)
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview((ev.target?.result as string) || null)
    reader.readAsDataURL(f)
  }

  const upload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("type", "walls/images")
      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Upload failed")
      onUploaded(data.url)
    } catch (e: any) {
      setError(e.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <div className="border-2 border-dashed rounded p-4 text-center">
        {preview ? (
          <div className="relative w-full h-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-40 object-contain" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Choose an image to preview</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onSelect}
          className="hidden"
          disabled={disabled || loading}
        />
        <div className="flex gap-2 justify-center mt-3">
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={disabled || loading}>
            Choose Image
          </Button>
          <Button type="button" size="sm" onClick={upload} disabled={!file || disabled || loading}>
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Max size: {MAX_IMAGE_MB}MB. Allowed: JPEG, PNG, JPG, SVG, WEBP.
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  )
}