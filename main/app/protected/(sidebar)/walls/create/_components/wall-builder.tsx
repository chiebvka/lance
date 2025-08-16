"use client"

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Copy, Eye, FileText, GripVertical, ImageIcon, LinkIcon, Plus, Save, Trash2, Type, VideoIcon, X, Grid3X3, Menu, Bubbles } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import ComboBox from "@/components/combobox";
import WallImageUpload from "@/components/uploads/wall-image-upload";
import WallVideoUpload from "@/components/uploads/wall-video-upload";
import WallFileUpload from "@/components/uploads/wall-file-upload";
import { Reorder, useDragControls } from "framer-motion";
import { z } from "zod";
import { useCustomers } from "@/hooks/customers/use-customers";
import { useProjects } from "@/hooks/projects/use-projects";

// Validation schema for the form
const wallFormSchema = z.object({
  title: z.string().min(1, "Wall title is required"),
  description: z.string().min(1, "Wall description is required"),
})

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

type BlockType = "heading" | "paragraph" | "link" | "video" | "image" | "file"

interface ContentBlock {
  id: string
  type: BlockType
  content: string
  url?: string
  title?: string
  uploadType?: "url" | "upload"
  fileData?: string
  fileName?: string
  file?: File // Store the actual file for delayed upload
  position: number
}

interface Option { value: string; label: string; searchValue: string }

export default function WallBuilder() {
  const [pageTitle, setPageTitle] = useState("New Wall")
  const [pageDescription, setPageDescription] = useState("")
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  const [sendEmail, setSendEmail] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [customEmail, setCustomEmail] = useState("")
  const [customName, setCustomName] = useState("")
  const [protect, setProtect] = useState(false)
  const [notes, setNotes] = useState("")
  const [attachToProject, setAttachToProject] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string; email?: string }>({})

  const { data: customers = [], isLoading: isLoadingCustomers, error: customersError } = useCustomers()
  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useProjects()

  // Map customers and projects data directly like the receipt form
  const customerItems = customers.map(customer => ({
    value: customer.id,
    label: `${customer.name || "Unnamed"} (${customer.email || "-"})`,
    searchValue: `${customer.name || ""} ${customer.email || ""}`.trim()
  }))

  const projectItems = projects.map(project => ({
    value: project.id,
    label: project.customerName ? `${project.name || "Unnamed"} - ${project.customerName}` : (project.name || "Unnamed"),
    searchValue: `${project.name || ""} ${project.customerName || ""}`.trim()
  }))

  // Handle sendEmail switch changes
  const handleSendEmailChange = (checked: boolean) => {
    setSendEmail(checked)
    if (!checked) {
      // Clear customer selection when turning off the switch
      setSelectedCustomer(null)
    }
  }

  // Smart token protection logic
  useEffect(() => {
    // Auto-enable protect when:
    // 1. Sending to existing customer
    // 2. Attaching to project  
    // 3. Manual email is provided
    if (sendEmail && selectedCustomer) {
      setProtect(true)
    } else if (attachToProject && selectedProject) {
      setProtect(true)
    } else if (customEmail && customEmail.trim() !== "") {
      setProtect(true)
    }
    // Note: We don't auto-enable for customName only - user can choose
  }, [sendEmail, selectedCustomer, attachToProject, selectedProject, customEmail])

  // Validate form fields
  const validateForm = () => {
    try {
      wallFormSchema.parse({ title: pageTitle, description: pageDescription })
      
      // Additional email validation if custom email is provided
      const errors: { title?: string; description?: string; email?: string } = {}
      
      if (customEmail && customEmail.trim() !== "" && !isValidEmail(customEmail)) {
        errors.email = "Please enter a valid email address"
      }
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return false
      }
      
      setFormErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { title?: string; description?: string; email?: string } = {}
        error.errors.forEach(err => {
          if (err.path[0] === 'title') errors.title = err.message
          if (err.path[0] === 'description') errors.description = err.message
        })
        setFormErrors(errors)
      }
      return false
    }
  }

  const addBlock = (type: BlockType) => {
    // Check media limits
    if (type === "image") {
      const imageCount = blocks.filter(b => b.type === "image").length
      if (imageCount >= 5) {
        toast.error("Maximum 5 images allowed per wall")
        return
      }
    }
    if (type === "video") {
      const videoCount = blocks.filter(b => b.type === "video").length
      if (videoCount >= 5) {
        toast.error("Maximum 5 videos allowed per wall")
        return
      }
    }

    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: type === "heading" ? "New Heading" : type === "link" ? "Click here" : "New content",
      url: type === "link" ? "https://" : ["video", "file", "image"].includes(type) ? "https://example.com" : undefined,
      title: type === "link" ? "Link description (optional)" : type === "file" ? "File title" : undefined,
      uploadType: "url",
      position: blocks.length,
    }
    setBlocks(prev => [...prev, newBlock])
    setSelectedBlockId(newBlock.id)
  }

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)))
  }

  const selectedBlock = useMemo(() => blocks.find(b => b.id === selectedBlockId), [blocks, selectedBlockId])

  // Handle file selection for local preview
  const handleFileSelect = (blockId: string, file: File, type: "image" | "video" | "file") => {
    if (file) {
      // Validate file immediately
      let validationError = ""
      
      // Check file size
      if (type === "image" && file.size > 10 * 1024 * 1024) {
        validationError = `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum: 10MB`
      } else if (type === "video" && file.size > 100 * 1024 * 1024) {
        validationError = `Video is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum: 100MB`
      } else if (type === "file" && file.size > 5 * 1024 * 1024) {
        validationError = `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum: 5MB`
      }

      // Check file type
      if (!validationError) {
        if (type === "image") {
          const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml", "image/webp"]
          if (!allowedTypes.includes(file.type)) {
            validationError = `Unsupported image format: ${file.type}. Allowed: JPEG, PNG, JPG, SVG, WEBP`
          }
        } else if (type === "video") {
          const allowedTypes = ["video/avi", "video/mp4", "video/x-matroska", "video/quicktime"]
          if (!allowedTypes.includes(file.type)) {
            validationError = `Unsupported video format: ${file.type}. Allowed: AVI, MP4, MKV, MOV`
          }
        } else if (type === "file") {
          const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "text/plain"
          ]
          if (!allowedTypes.includes(file.type)) {
            validationError = `Unsupported file format: ${file.type}. Allowed: PDF, DOCX, XLS/XLSX, CSV, TXT`
          }
        }
      }

      if (validationError) {
        toast.error(`File validation failed: ${validationError}`)
        return // Don't process invalid files
      }

      // File is valid, proceed with preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        updateBlock(blockId, {
          fileData: result,
          fileName: file.name,
          file: file,
          url: result, // For local preview
        })
        toast.success(`File "${file.name}" selected successfully`)
      }
      reader.readAsDataURL(file)
    }
  }

  const renderBlockPreview = (block: ContentBlock) => {
    switch (block.type) {
      case "heading":
        return <h3 className="text-lg font-semibold">{block.content}</h3>
      case "paragraph":
        return <p className="text-sm leading-relaxed">{block.content}</p>
      case "link":
        return (
          <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
            <a 
              href={block.url || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              {block.content}
            </a>
            {block.title && (
              <p className="text-xs text-muted-foreground mt-1">{block.title}</p>
            )}
          </div>
        )
      case "video":
        if (block.uploadType === "upload" && block.fileData) {
          return (
            <div className="space-y-2">
              <div className="w-full h-48 bg-gray-100 rounded border overflow-hidden">
                <video 
                  controls 
                  className="w-full h-full object-cover"
                  src={block.fileData}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <p className="text-sm text-muted-foreground">{block.content}</p>
            </div>
          )
        } else if (block.url && block.url !== "https://example.com") {
          return (
            <div className="space-y-2">
              <div className="w-full h-48 bg-gray-100 rounded border flex items-center justify-center">
                <VideoIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-xs text-muted-foreground">Video URL: {block.url}</p>
            </div>
          )
        } else {
          return (
            <div className="space-y-2">
              <div className="w-full h-48 bg-gray-100 rounded border flex items-center justify-center">
                <VideoIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium">{block.content}</p>
            </div>
          )
        }
      case "image":
        if (block.uploadType === "upload" && block.fileData) {
          return (
            <div className="space-y-2">
              <div className="w-full h-48 bg-gray-100 rounded border overflow-hidden">
                <img
                  src={block.fileData}
                  alt={block.content}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">{block.content}</p>
            </div>
          )
        } else if (block.url && block.url !== "https://example.com") {
          return (
            <div className="space-y-2">
              <div className="w-full h-48 bg-gray-100 rounded border overflow-hidden">
                <img
                  src={block.url}
                  alt={block.content}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">{block.content}</p>
            </div>
          )
        } else {
          return (
            <div className="space-y-2">
              <div className="w-full h-48 bg-gray-100 rounded border flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-xs text-muted-foreground">{block.content}</p>
            </div>
          )
        }
      case "file":
        return (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
            <FileText className="h-4 w-4 text-green-600" />
            <div className="text-sm font-medium">{block.fileName || block.content}</div>
          </div>
        )
      default:
        return null
    }
  }

  const toServerContent = (blocksToUse = blocks) => {
    const content = {
      version: 1,
      blocks: blocksToUse.map((b, idx) => {
        const base: any = { id: crypto.randomUUID(), position: b.position, visible: true }
        if (b.type === "heading") return { ...base, type: "heading", props: { text: b.content, level: 2 } }
        if (b.type === "paragraph") return { ...base, type: "text", props: { markdown: b.content } }
        if (b.type === "link") return { ...base, type: "link", props: { title: b.content, url: b.url || "", description: b.title || undefined } }
        if (b.type === "image") return { ...base, type: "image", props: { fileId: b.url || b.fileData || "" } }
        if (b.type === "video") {
          const provider = b.uploadType === "upload" ? "file" : "url"
          return { ...base, type: "video", props: { provider, url: b.url, fileId: provider === "file" ? (b.url || b.fileData || "") : undefined } }
        }
        if (b.type === "file") return { ...base, type: "file", props: { fileId: b.url || b.fileData || "", label: b.title || b.content } }
        return base
      }),
    }
    
    console.log("toServerContent input blocks:", blocksToUse)
    console.log("toServerContent output:", content)
    
    return content
  }

  // Validate files before upload to prevent resource waste
  const validateFilesBeforeUpload = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    const filesToValidate = blocks.filter(block => block.uploadType === "upload" && block.file && !["link"].includes(block.type))
    
    if (filesToValidate.length === 0) {
      return { isValid: true, errors: [] }
    }

    filesToValidate.forEach(block => {
      const file = block.file!
      
      // Check file size
      if (block.type === "image" && file.size > 10 * 1024 * 1024) {
        errors.push(`Image "${block.fileName || 'unnamed'}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum: 10MB`)
      } else if (block.type === "video" && file.size > 100 * 1024 * 1024) {
        errors.push(`Video "${block.fileName || 'unnamed'}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum: 100MB`)
      } else if (block.type === "file" && file.size > 5 * 1024 * 1024) {
        errors.push(`File "${block.fileName || 'unnamed'}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum: 5MB`)
      }

      // Check file type
      if (block.type === "image") {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml", "image/webp"]
        if (!allowedTypes.includes(file.type)) {
          errors.push(`Image "${block.fileName || 'unnamed'}" has unsupported format: ${file.type}. Allowed: JPEG, PNG, JPG, SVG, WEBP`)
        }
      } else if (block.type === "video") {
        const allowedTypes = ["video/avi", "video/mp4", "video/x-matroska", "video/quicktime"]
        if (!allowedTypes.includes(file.type)) {
          errors.push(`Video "${block.fileName || 'unnamed'}" has unsupported format: ${file.type}. Allowed: AVI, MP4, MKV, MOV`)
        }
      } else if (block.type === "file") {
        const allowedTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/csv",
          "text/plain"
        ]
        if (!allowedTypes.includes(file.type)) {
          errors.push(`File "${block.fileName || 'unnamed'}" has unsupported format: ${file.type}. Allowed: PDF, DOCX, XLS/XLSX, CSV, TXT`)
        }
      }
    })

    return { isValid: errors.length === 0, errors }
  }

  // Upload files and get URLs
  const uploadFiles = async (): Promise<{ [blockId: string]: string }> => {
    const filesToUpload = blocks.filter(block => block.uploadType === "upload" && block.file && !["link"].includes(block.type))
    
    if (filesToUpload.length === 0) return {}

    // Validate all files before starting uploads
    const validation = validateFilesBeforeUpload()
    if (!validation.isValid) {
      const errorMessage = validation.errors.join('\n')
      toast.error(`Cannot save/publish wall due to file validation errors:\n\n${errorMessage}`)
      throw new Error(`File validation failed:\n${errorMessage}`)
    }

    // Show initial upload progress toast
    const uploadToast = toast.loading(
      <div className="flex flex-col gap-3 py-2">
        <div className="flex flex-col gap-1">
          <div className="font-medium text-base">Preparing uploads...</div>
          <div className="text-sm text-muted-foreground">
            {filesToUpload.length} file{filesToUpload.length > 1 ? 's' : ''} to upload
          </div>
        </div>
      </div>,
      { duration: Infinity }
    )

    let completedUploads = 0
    
    const uploadPromises = filesToUpload.map(block => {
      const formData = new FormData()
      formData.append("file", block.file!)
      formData.append("type", `walls/${block.type === "image" ? "images" : block.type === "video" ? "videos" : "files"}`)
      
      return axios.post("/api/upload", formData)
        .then(res => {
          completedUploads++
          
          // Update progress toast
          const progress = Math.round((completedUploads / filesToUpload.length) * 100)
          toast.loading(
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1">
                <div className="font-medium text-base">
                  Uploading file {completedUploads} of {filesToUpload.length}...
                </div>
                <div className="text-sm text-muted-foreground">
                  Working on: {block.fileName || block.content}
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>,
            { id: uploadToast, duration: Infinity }
          )
          
          return { blockId: block.id, url: res.data.url }
        })
        .catch(err => {
          console.error(`Failed to upload ${block.type}:`, err)
          const errorMessage = err.response?.data?.error || err.message || `Failed to upload ${block.type}`
          toast.error(`Upload failed: ${errorMessage}`)
          throw new Error(`Failed to upload ${block.type}: ${errorMessage}`)
        })
    })

    try {
      const results = await Promise.all(uploadPromises)
      const urlMap: { [blockId: string]: string } = {}
      results.forEach(result => {
        urlMap[result.blockId] = result.url
      })
      
      // Show completion toast
      toast.success(
        <div className="flex flex-col gap-3 py-1">
          <div className="flex flex-col gap-1">
            <div className="font-medium text-base">Upload completed!</div>
            <div className="text-sm text-muted-foreground">
              {filesToUpload.length} file{filesToUpload.length > 1 ? 's' : ''} uploaded successfully
            </div>
          </div>
        </div>,
        { id: uploadToast, duration: 3000 }
      )
      
      return urlMap
    } catch (error) {
      // Error toast already shown above, just dismiss the loading toast
      toast.dismiss(uploadToast)
      throw error
    }
  }

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }
    
    setSaving(true)
    setUploading(true)
    
    try {
      console.log("Starting save draft process...")
      console.log("Current blocks:", blocks)
      
      // Upload files first
      const uploadedUrls = await uploadFiles()
      console.log("Files uploaded successfully:", uploadedUrls)
      
      // Update blocks with uploaded URLs
      const updatedBlocks = blocks.map(block => {
        if (uploadedUrls[block.id]) {
          return { ...block, url: uploadedUrls[block.id] }
        }
        return block
      })
      console.log("Updated blocks with URLs:", updatedBlocks)

      // Update the blocks state with uploaded URLs
      setBlocks(updatedBlocks)

      const content = toServerContent(updatedBlocks)
      console.log("Generated server content:", content)

      const payload: any = {
        action: "save_draft",
        name: pageTitle.trim(),
        description: pageDescription || null,
        content: content,
        customerId: selectedCustomer || null,
        projectId: selectedProject || null,
        protect,
        notes: notes || null,
      }
      
      console.log("Sending save draft payload:", payload)
      console.log("Payload JSON stringified:", JSON.stringify(payload, null, 2))
      
      const res = await axios.post("/api/walls/create", payload)
      console.log("Save draft response:", res.data)
      
      if (res.data?.success) toast.success("Draft saved")
    } catch (e: any) {
      console.error("Save draft error:", e)
      console.error("Error response:", e.response?.data)
      console.error("Error status:", e.response?.status)
      console.error("Error message:", e.message)
      console.error("Full error object:", e)
      
      const errorMessage = e.response?.data?.error || e.response?.data?.details || e.message || "Failed to save draft"
      toast.error(`Save failed: ${errorMessage}`)
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handlePublish = async (sendEmailNow: boolean) => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }
    
    setSaving(true)
    setUploading(true)
    
    try {
      console.log("Starting publish process...")
      
      // Upload files first
      const uploadedUrls = await uploadFiles()
      console.log("Files uploaded successfully:", uploadedUrls)
      
      // Update blocks with uploaded URLs
      const updatedBlocks = blocks.map(block => {
        if (uploadedUrls[block.id]) {
          return { ...block, url: uploadedUrls[block.id] }
        }
        return block
      })

      // Update the blocks state with uploaded URLs
      setBlocks(updatedBlocks)

      // Determine if we should send email
      const shouldSendEmail = (sendEmail && selectedCustomer) || (!sendEmail && customEmail && customEmail.trim() !== "")
      
      const payload: any = {
        action: shouldSendEmail ? "send_wall" : "publish",
        name: pageTitle.trim(),
        description: pageDescription || null,
        content: toServerContent(updatedBlocks),
        customerId: selectedCustomer || null,
        projectId: selectedProject || null,
        protect,
        notes: notes || null,
      }
      
      if (shouldSendEmail) {
        payload.recipientEmail = selectedCustomer ? undefined : customEmail
        payload.recepientName = selectedCustomer ? undefined : customName
      }
      
      console.log("Sending publish payload:", payload)
      
      const res = await axios.post("/api/walls/create", payload)
      console.log("Publish response:", res.data)
      
      if (res.data?.success) toast.success(shouldSendEmail ? "Wall created and email sent" : "Wall published")
    } catch (e: any) {
      console.error("Publish error:", e)
      console.error("Error response:", e.response?.data)
      console.error("Error status:", e.response?.status)
      console.error("Error message:", e.message)
      
      const errorMessage = e.response?.data?.error || e.response?.data?.details || e.message || "Failed to publish"
      toast.error(`Publish failed: ${errorMessage}`)
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const resetForm = () => {
    setPageTitle("New Wall")
    setPageDescription("")
    setBlocks([])
    setSelectedBlockId(null)
    setSendEmail(false)
    setSelectedCustomer(null)
    setSelectedProject(null)
    setCustomEmail("")
    setCustomName("")
    setProtect(false)
    setNotes("")
    setAttachToProject(false)
    setFormErrors({})
  }

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-primary" />
            <h1 className="text-base font-bold">Wall Builder</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSaveDraft} disabled={saving || isLoadingCustomers || isLoadingProjects}>
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setSendOpen(true)} disabled={isLoadingCustomers || isLoadingProjects}>
              <Copy className="h-4 w-4 mr-2" />
              Publish Wall
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Desktop Header */}
        <Card className="hidden lg:block">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-6 w-6 text-primary" />
                  <h1 className="text-lg font-bold">Wall Builder</h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={resetForm} className="">
                  Reset
                </Button>
                <Button variant="ghost" onClick={handleSaveDraft} disabled={saving || isLoadingCustomers || isLoadingProjects} className="">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? (uploading ? 'Uploading...' : 'Saving...') : 'Save Draft'}
                </Button>
                <Button variant="ghost" onClick={() => setPreviewOpen(true)} className="">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button onClick={() => setSendOpen(true)} disabled={saving || isLoadingCustomers || isLoadingProjects} className="bg-primary hover:bg-primary/80">
                  <Copy className="h-4 w-4 mr-2" />
                  Publish Wall
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 2-Column Layout: Properties + Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Properties */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Loading State */}
              {(isLoadingCustomers || isLoadingProjects) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bubbles className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">Loading customer and project data...</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    This data is needed to send walls to existing customers or attach them to projects.
                  </p>
                </div>
              )}

              {/* Wall Name and Description */}
              <div className="space-y-2">
                <Label htmlFor="pageTitle">Wall Title *</Label>
                <Input 
                  id="pageTitle" 
                  value={pageTitle} 
                  onChange={(e) => setPageTitle(e.target.value)}
                  className={formErrors.title ? "border-red-500" : ""}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pageDescription">Wall Description *</Label>
                <Textarea 
                  id="pageDescription" 
                  value={pageDescription} 
                  onChange={(e) => setPageDescription(e.target.value)}
                  className={formErrors.description ? "border-red-500" : ""}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>

              {/* Content Block Types */}
              <div className="space-y-4">
                <Label>Content Blocks</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => addBlock("heading")} className="text-primary">
                    <Type className="h-4 w-4 mr-1" />
                    Heading
                  </Button>
                  <Button variant="outline" onClick={() => addBlock("paragraph")} className="text-primary">
                    <FileText className="h-4 w-4 mr-1" />
                    Text
                  </Button>
                  <Button variant="outline" onClick={() => addBlock("link")} className="text-primary">
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Link
                  </Button>
                  <Button variant="outline" onClick={() => addBlock("image")} className="text-primary">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Image
                  </Button>
                  <Button variant="outline" onClick={() => addBlock("video")} className="text-primary">
                    <VideoIcon className="h-4 w-4 mr-1" />
                    Video
                  </Button>
                  <Button variant="outline" onClick={() => addBlock("file")} className="text-primary">
                    <FileText className="h-4 w-4 mr-1" />
                    File
                  </Button>
                </div>
              </div>

              {/* Selected Block Properties */}
              {selectedBlock && (
                <div className="space-y-4 pt-4 border-t">
                  <Label>Block Properties</Label>
                  <div className="space-y-3">
                    {selectedBlock.type === "heading" && (
                      <Input
                        placeholder="Heading text"
                        value={selectedBlock.content}
                        onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                      />
                    )}
                    {selectedBlock.type === "paragraph" && (
                      <Textarea
                        placeholder="Paragraph content"
                        value={selectedBlock.content}
                        onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                      />
                    )}
                    {selectedBlock.type === "link" && (
                      <>
                        <Input
                          placeholder="Link text (what users will see)"
                          value={selectedBlock.content}
                          onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                        />
                        <Input
                          placeholder="URL (https://example.com)"
                          value={selectedBlock.url || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                        />
                        <Input
                          placeholder="Description (optional)"
                          value={selectedBlock.title || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { title: e.target.value })}
                        />
                      </>
                    )}
                    {["video", "file", "image"].includes(selectedBlock.type) && (
                      <>
                        <Input
                          placeholder="Display text/title"
                          value={selectedBlock.content}
                          onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                        />
                        <div className="space-y-2">
                          <Select
                            value={selectedBlock.uploadType || "url"}
                            onValueChange={(value: "url" | "upload") => updateBlock(selectedBlock.id, { uploadType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="url">URL/Link</SelectItem>
                              <SelectItem value="upload">Upload File</SelectItem>
                            </SelectContent>
                          </Select>

                          {selectedBlock.uploadType === "url" ? (
                            <Input
                              placeholder="URL"
                              value={selectedBlock.url || ""}
                              onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                            />
                          ) : (
                            <div className="space-y-2">
                              {selectedBlock.type === "image" && (
                                <div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleFileSelect(selectedBlock.id, file, "image")
                                    }}
                                    className="hidden"
                                    id={`image-${selectedBlock.id}`}
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => document.getElementById(`image-${selectedBlock.id}`)?.click()}
                                    className="w-full"
                                  >
                                    Choose Image
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Max size: 10MB. Allowed: JPEG, PNG, JPG, SVG, WEBP
                                  </p>
                                  {selectedBlock.fileData && (
                                    <div className="mt-2">
                                      <div className="w-full h-32 bg-gray-100 rounded border overflow-hidden">
                                        <img
                                          src={selectedBlock.fileData}
                                          alt="Preview"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {selectedBlock.fileName} (will upload on save/publish)
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                              {selectedBlock.type === "video" && (
                                <div>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleFileSelect(selectedBlock.id, file, "video")
                                    }}
                                    className="hidden"
                                    id={`video-${selectedBlock.id}`}
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => document.getElementById(`video-${selectedBlock.id}`)?.click()}
                                    className="w-full"
                                  >
                                    Choose Video
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Max size: 100MB. Allowed: AVI, MP4, MKV, MOV
                                  </p>
                                  {selectedBlock.fileData && (
                                    <div className="mt-2">
                                      <div className="w-full h-32 bg-gray-100 rounded border overflow-hidden">
                                        <video
                                          src={selectedBlock.fileData}
                                          controls
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {selectedBlock.fileName} (will upload on save/publish)
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                              {selectedBlock.type === "file" && (
                                <div>
                                  <input
                                    type="file"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleFileSelect(selectedBlock.id, file, "file")
                                    }}
                                    className="hidden"
                                    id={`file-${selectedBlock.id}`}
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => document.getElementById(`file-${selectedBlock.id}`)?.click()}
                                    className="w-full"
                                  >
                                    Choose File
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Max size: 5MB. Allowed: PDF, DOCX, XLS/XLSX, CSV, TXT
                                  </p>
                                  {selectedBlock.fileName && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {selectedBlock.fileName} (will upload on save/publish)
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {selectedBlock.type === "file" && (
                          <Input
                            placeholder="Description (optional)"
                            value={selectedBlock.title || ""}
                            onChange={(e) => updateBlock(selectedBlock.id, { title: e.target.value })}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Canvas */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blocks.length > 1 ? (
                  <Reorder.Group 
                    axis="y" 
                    values={blocks} 
                    onReorder={(newBlocks) => {
                      const updatedBlocks = newBlocks.map((block, index) => ({
                        ...block,
                        position: index
                      }))
                      setBlocks(updatedBlocks)
                    }}
                    className="space-y-4"
                  >
                    {blocks.map((block, index) => (
                      <Reorder.Item
                        key={block.id}
                        value={block}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <Card 
                          className={`p-4 transition-all duration-200 ${
                            selectedBlockId === block.id 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={(e) => {
                            // Only select if not clicking on drag handle or action buttons
                            const target = e.target as HTMLElement
                            if (!target.closest('.drag-handle') && !target.closest('.action-buttons')) {
                              setSelectedBlockId(block.id)
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                              <span className="text-sm">#{index + 1}</span>
                              <Badge variant="secondary" className="bg-primary/20 text-purple-300 text-xs">
                                {block.type}
                              </Badge>
                            </div>
                            <div className="flex gap-2 ml-auto action-buttons">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setSelectedBlockId(block.id) 
                                }}
                                className={selectedBlockId === block.id ? 'bg-primary/10 text-primary' : ''}
                              >
                                <Eye className="h-3 w-3"/>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-500" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  removeBlock(block.id) 
                                }}
                              >
                                <Trash2 className="h-3 w-3"/>
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="font-medium">{block.content}</p>
                            {renderBlockPreview(block)}
                          </div>
                        </Card>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                ) : (
                  blocks.map((block, index) => (
                    <Card 
                      key={block.id} 
                      className={`p-4 transition-all duration-200 ${
                        selectedBlockId === block.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm">#{index + 1}</span>
                          <Badge variant="secondary" className="bg-primary/20 text-purple-300 text-xs">
                            {block.type}
                          </Badge>
                        </div>
                        <div className="flex gap-2 ml-auto action-buttons">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedBlockId(block.id) 
                            }}
                            className={selectedBlockId === block.id ? 'bg-primary/10 text-primary' : ''}
                          >
                            <Eye className="h-3 w-3"/>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-500" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              removeBlock(block.id) 
                            }}
                          >
                            <Trash2 className="h-3 w-3"/>
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="font-medium">{block.content}</p>
                        {renderBlockPreview(block)}
                      </div>
                    </Card>
                  ))
                )}
                {blocks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Start building your wall</p>
                    <p className="text-sm">Add content blocks to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Wall Preview</DialogTitle>
              <DialogDescription>How your wall will look</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 p-6 bg-white border rounded-lg">
              <div className="text-center space-y-2 border-b pb-4">
                <h1 className="text-3xl font-bold">{pageTitle}</h1>
                <p className="text-muted-foreground">{pageDescription}</p>
              </div>
              <div className="space-y-4">
                {blocks.map(block => (
                  <div key={block.id}>{renderBlockPreview(block)}</div>
                ))}
                {blocks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No content blocks yet.</div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Publish Wall Dialog */}
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogContent className="mx-4 max-w-lg">
            <DialogHeader>
              <DialogTitle>Publish Wall</DialogTitle>
              <DialogDescription>Selecting a customer will email them a secure link to this wall.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Switch checked={sendEmail} onCheckedChange={handleSendEmailChange} />
                  <Label>Send to existing customer</Label>
                </div>
                {sendEmail ? (
                  <div className="space-y-2">
                    {isLoadingCustomers ? (
                      <div className="p-3 bg-gray-50 border rounded-lg text-sm text-muted-foreground">
                        Loading customers...
                      </div>
                    ) : customersError ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-sm">
                            <p className="font-medium text-red-800">Error loading customers</p>
                            <p className="text-red-700 mt-1">
                              Failed to load customers. Please refresh the page or try again later.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : customerItems.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-sm">
                            <p className="font-medium text-amber-800">No customers found</p>
                            <p className="text-amber-700 mt-1">
                              You need to create customers first before you can send walls to them.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ComboBox items={customerItems} value={selectedCustomer} onValueChange={setSelectedCustomer} placeholder="Choose a customer" searchPlaceholder="Search customers..." emptyMessage="No customers found." />
                    )}
                    {selectedCustomer && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-sm">
                            <p className="font-medium text-blue-800">Email Notification</p>
                            <p className="text-blue-700 mt-1">
                              The selected customer will receive an email with a secure link to access this wall.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input 
                      type="email" 
                      value={customEmail} 
                      onChange={(e) => setCustomEmail(e.target.value)} 
                      placeholder="recipient@example.com"
                      className={formErrors.email ? "border-red-500" : ""}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-500">{formErrors.email}</p>
                    )}
                    <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Recipient name (optional)" />
                    {(customEmail && customEmail.trim() !== "" && isValidEmail(customEmail)) && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-sm">
                            <p className="font-medium text-blue-800">Email Notification</p>
                            <p className="text-blue-700 mt-1">
                              {customEmail} will receive an email with a secure link to access this wall.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Switch checked={attachToProject} onCheckedChange={setAttachToProject} />
                  <Label>Attach to project</Label>
                </div>
                {attachToProject && (
                  <>
                    {isLoadingProjects ? (
                      <div className="p-3 bg-gray-50 border rounded-lg text-sm text-muted-foreground">
                        Loading projects...
                      </div>
                    ) : projectsError ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-sm">
                            <p className="font-medium text-red-800">Error loading projects</p>
                            <p className="text-red-700 mt-1">
                              Failed to load projects. Please refresh the page or try again later.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : projectItems.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="text-sm">
                            <p className="font-medium text-amber-800">No projects found</p>
                            <p className="text-amber-700 mt-1">
                              You need to create projects first before you can attach walls to them.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ComboBox items={projectItems} value={selectedProject} onValueChange={setSelectedProject} placeholder="Choose a project" searchPlaceholder="Search projects..." emptyMessage="No projects found." />
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch checked={protect} onCheckedChange={setProtect} />
                  <Label>Protect (token required)</Label>
                </div>
                
                {/* Privacy Banner */}
                {protect ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="text-sm">
                        <p className="font-medium text-green-800">Private Wall</p>
                        <p className="text-green-700 mt-1">
                          This wall will be private and only accessible via a secure token link. 
                          Recipients will need the special link to view it.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">Public Wall</p>
                        <p className="text-amber-700 mt-1">
                          This wall will be publicly accessible. Anyone with the link can view it.
                          Consider enabling protection for sensitive content.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Notes (optional)</Label>
                <Textarea rows={3} placeholder="Notes for the wall (included in email)." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setSendOpen(false)}>Cancel</Button>
                <div className="space-y-2">
                  <Button 
                    onClick={async () => { 
                      if (validateForm()) {
                        await handlePublish(true); 
                        setSendOpen(false); 
                      }
                    }} 
                    disabled={saving || (sendEmail && !selectedCustomer) || (!sendEmail && customEmail.trim() !== "" && !isValidEmail(customEmail)) || isLoadingCustomers || isLoadingProjects}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.5s]" />
                        {uploading ? 'Uploading...' : 'Publishing...'}
                      </>
                    ) : 'Publish Wall'}
                  </Button>
                  
                  {/* Email Validation Notification */}
                  {!sendEmail && customEmail.trim() !== "" && !isValidEmail(customEmail) && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 text-center">
                        Please enter a valid email address to continue
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}


