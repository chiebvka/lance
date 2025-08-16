"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface WallGenericFileUploadProps {
  label?: string
  value?: string | null
  disabled?: boolean
  onUploaded: (url: string) => void
}

const MAX_FILE_MB = 5
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel", // xls
  "text/csv",
  "text/plain",
]

export default function WallFileUpload({ label = "File", value, disabled, onUploaded }: WallGenericFileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreviewUrl(value || null)
  }, [value])

  const validate = (f: File) => {
    if (!ACCEPTED_MIME_TYPES.includes(f.type)) {
      return "Allowed types: pdf, docx, xls/xlsx, csv, txt."
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      return `File must be under ${MAX_FILE_MB}MB.`
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
    setFileName(f.name)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
  }

  const upload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("type", "walls/files")
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
        <p className="text-sm text-muted-foreground">
          {fileName ? `Selected: ${fileName}` : "Choose a file to preview"}
        </p>
        {previewUrl && (
          <div className="mt-2 text-xs text-muted-foreground break-all">{previewUrl}</div>
        )}
        <input
          ref={fileRef}
          type="file"
          onChange={onSelect}
          className="hidden"
          disabled={disabled || loading}
          accept={ACCEPTED_MIME_TYPES.join(",")}
        />
        <div className="flex gap-2 justify-center mt-3">
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={disabled || loading}>
            Choose File
          </Button>
          <Button type="button" size="sm" onClick={upload} disabled={!file || disabled || loading}>
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Max size: {MAX_FILE_MB}MB. Allowed: PDF, DOCX, XLS/XLSX, CSV, TXT.
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  )
}