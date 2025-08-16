"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface WallVideoUploadProps {
  label?: string
  value?: string | null
  disabled?: boolean
  onUploaded: (url: string) => void
}

const MAX_VIDEO_MB = 100
const ACCEPTED_VIDEO_TYPES = [
  "video/x-msvideo", // avi
  "video/mp4",
  "video/x-matroska", // mkv
  "video/quicktime", // mov
]

export default function WallVideoUpload({ label = "Video", value, disabled, onUploaded }: WallVideoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const validate = (f: File) => {
    if (!ACCEPTED_VIDEO_TYPES.includes(f.type)) {
      return "Only AVI, MP4, MKV, or MOV videos are allowed."
    }
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) {
      return `Video must be under ${MAX_VIDEO_MB}MB.`
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
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const upload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("type", "walls/videos")
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
          <video controls className="w-full max-h-48">
            <source src={preview} />
          </video>
        ) : (
          <p className="text-sm text-muted-foreground">Choose a video to preview</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          onChange={onSelect}
          className="hidden"
          disabled={disabled || loading}
        />
        <div className="flex gap-2 justify-center mt-3">
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={disabled || loading}>
            Choose Video
          </Button>
          <Button type="button" size="sm" onClick={upload} disabled={!file || disabled || loading}>
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Max size: {MAX_VIDEO_MB}MB. Allowed: AVI, MP4, MKV, MOV.
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  )
}