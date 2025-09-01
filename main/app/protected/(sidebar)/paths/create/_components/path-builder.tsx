"use client"

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Copy, Eye, GripVertical, LinkIcon, Save, Trash2, Bubbles, ExternalLink, Mail, Phone, Globe } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import ComboBox from "@/components/combobox";
import { Reorder } from "framer-motion";
import { z } from "zod";
import { useCustomers } from "@/hooks/customers/use-customers";
import { useProjects } from "@/hooks/projects/use-projects";
import { useOrganization } from "@/hooks/organizations/use-organization";
import { PathEntry, PathType } from "@/hooks/paths/use-paths";
import { ColorPicker } from "@/components/color-picker";

// Validation schema for the form
const pathFormSchema = z.object({
  title: z.string().min(1, "Page title is required"),
  description: z.string().min(1, "Page description is required"),
})

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

interface Option { value: string; label: string; searchValue: string }

export default function PathBuilder() {
  const [pageTitle, setPageTitle] = useState("My Business Paths")
  const [pageDescription, setPageDescription] = useState("Find all my important links and contact information in one place")
  const [entries, setEntries] = useState<PathEntry[]>([])
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

  const [sendEmail, setSendEmail] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [customEmail, setCustomEmail] = useState("")
  const [customName, setCustomName] = useState("")
  const [protect, setProtect] = useState(false)
  const [attachToProject, setAttachToProject] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string; email?: string }>({})

  const { data: customers = [], isLoading: isLoadingCustomers, error: customersError } = useCustomers()
  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useProjects()
  const { data: organization, isLoading: isLoadingOrganization } = useOrganization()

  // Map customers and projects data
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
      setSelectedCustomer(null)
    }
  }

  // Smart token protection logic
  useEffect(() => {
    if (sendEmail && selectedCustomer) {
      setProtect(true)
    } else if (attachToProject && selectedProject) {
      setProtect(true)
    } else if (customEmail && customEmail.trim() !== "") {
      setProtect(true)
    }
  }, [sendEmail, selectedCustomer, attachToProject, selectedProject, customEmail])

  // Validate form fields
  const validateForm = () => {
    try {
      pathFormSchema.parse({ title: pageTitle, description: pageDescription })
      
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

  const addEntry = (type: PathType) => {
    const newEntry: PathEntry = {
      id: crypto.randomUUID(),
      position: entries.length * 10 + 10,
      title: type === "email" ? "Contact Us" : type === "phone" ? "Call Us" : type === "website" ? "Website" : "New Link",
      url: type === "email" ? "mailto:hello@example.com" : type === "phone" ? "tel:+1234567890" : "https://example.com",
      description: type === "email" ? "Send us an email" : type === "phone" ? "Call us directly" : type === "website" ? "Visit our website" : "Link description",
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      vibrancy: 70,
      clickable: true,
      type,
    }
    setEntries(prev => [...prev, newEntry])
    setSelectedEntryId(newEntry.id)
  }

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    if (selectedEntryId === id) setSelectedEntryId(null)
  }

  const updateEntry = (id: string, updates: Partial<PathEntry>) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)))
  }

  const selectedEntry = useMemo(() => entries.find(e => e.id === selectedEntryId), [entries, selectedEntryId])

  const getIcon = (iconType: PathType) => {
    switch (iconType) {
      case "email":
        return <Mail className="h-5 w-5" />
      case "phone":
        return <Phone className="h-5 w-5" />
      case "website":
        return <Globe className="h-5 w-5" />
      default:
        return <ExternalLink className="h-5 w-5" />
    }
  }

  const renderEntryPreview = (entry: PathEntry) => {
    return (
      <div
        className={`w-full h-auto p-4 text-white border-0 rounded-none ${
          entry.clickable ? "cursor-pointer hover:opacity-90" : "cursor-default"
        }`}
        style={{ backgroundColor: entry.color || "hsl(220, 70%, 50%)" }}
      >
        <div className="flex items-center gap-3 w-full">
          {getIcon(entry.type)}
          <div className="text-left flex-1">
            <div className="font-medium text-sm md:text-base">{entry.title}</div>
            {entry.description && <div className="text-xs md:text-sm opacity-90">{entry.description}</div>}
          </div>
          {entry.clickable && <ExternalLink className="h-4 w-4 opacity-75" />}
        </div>
      </div>
    )
  }

  const toServerContent = (entriesToUse = entries) => {
    const content = {
      version: 1,
      entries: entriesToUse.map((entry, idx) => ({
        ...entry,
        position: idx * 10 + 10, // Resequence positions
      })),
    }
    
    console.log("toServerContent input entries:", entriesToUse)
    console.log("toServerContent output:", content)
    
    return content
  }

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }
    
    setSaving(true)
    
    try {
      console.log("Starting save draft process...")
      console.log("Current entries:", entries)
      
      const content = toServerContent()
      console.log("Generated server content:", content)

      const payload: any = {
        action: "save_draft",
        name: pageTitle.trim(),
        description: pageDescription || null,
        content: content,
        customerId: selectedCustomer || null,
        protect,
      }
      
      console.log("Sending save draft payload:", payload)
      
      const res = await axios.post("/api/paths/create", payload)
      console.log("Save draft response:", res.data)
      
      if (res.data?.success) toast.success("Draft saved")
    } catch (e: any) {
      console.error("Save draft error:", e)
      console.error("Error response:", e.response?.data)
      
      const errorMessage = e.response?.data?.error || e.response?.data?.details || e.message || "Failed to save draft"
      toast.error(`Save failed: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async (sendEmailNow: boolean) => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }
    
    setSaving(true)
    
    try {
      console.log("Starting publish process...")
      
      // Determine if we should send email
      const shouldSendEmail = (sendEmail && selectedCustomer) || (!sendEmail && customEmail && customEmail.trim() !== "")
      
      const payload: any = {
        action: shouldSendEmail ? "send_path" : "publish",
        name: pageTitle.trim(),
        description: pageDescription || null,
        content: toServerContent(),
        customerId: selectedCustomer || null,
        protect,
      }
      
      if (shouldSendEmail) {
        payload.recipientEmail = selectedCustomer ? undefined : customEmail
        payload.recepientName = selectedCustomer ? undefined : customName
      }
      
      console.log("Sending publish payload:", payload)
      
      const res = await axios.post("/api/paths/create", payload)
      console.log("Publish response:", res.data)
      
      if (res.data?.success) toast.success(shouldSendEmail ? "Path created and email sent" : "Path published")
    } catch (e: any) {
      console.error("Publish error:", e)
      console.error("Error response:", e.response?.data)
      
      const errorMessage = e.response?.data?.error || e.response?.data?.details || e.message || "Failed to publish"
      toast.error(`Publish failed: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setPageTitle("My Business Links")
    setPageDescription("Find all my important links and contact information in one place")
    setEntries([])
    setSelectedEntryId(null)
    setSendEmail(false)
    setSelectedCustomer(null)
    setSelectedProject(null)
    setCustomEmail("")
    setCustomName("")
    setProtect(false)
    setAttachToProject(false)
    setFormErrors({})
  }

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-primary" />
            <h1 className="text-base font-bold">Path Builder</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost"  onClick={handleSaveDraft} disabled={saving || isLoadingCustomers || isLoadingProjects}>
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost"  onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button  onClick={() => setSendOpen(true)} disabled={isLoadingCustomers || isLoadingProjects}>
              <Copy className="h-4 w-4 mr-2" />
              Publish Path
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
                  <LinkIcon className="h-6 w-6 text-primary" />
                  <h1 className="text-lg font-bold">Path Builder</h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={resetForm} className="">
                  Reset
                </Button>
                <Button variant="ghost" onClick={handleSaveDraft} disabled={saving || isLoadingCustomers || isLoadingProjects} className="">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button variant="ghost" onClick={() => setPreviewOpen(true)} className="">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button onClick={() => setSendOpen(true)} disabled={saving || isLoadingCustomers || isLoadingProjects} className="bg-primary hover:bg-primary/80">
                  <Copy className="h-4 w-4 mr-2" />
                  Publish Path
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
              {/* {(isLoadingCustomers || isLoadingProjects) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bubbles className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">Loading customer and project data...</span>
                  </div>
                </div>
              )} */}

              {/* Page Title and Description */}
              <div className="space-y-2">
                <Label htmlFor="pageTitle">Page Title *</Label>
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
                <Label htmlFor="pageDescription">Page Description *</Label>
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


              {/* Link Entry Types */}
              <div className="space-y-4">
                <Label>Link Types</Label>
                <div className="flex gap-2 flex-wrap">
                  {/* <Button variant="outline" onClick={() => addEntry("link")} className="text-primary">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Link
                  </Button> */}
                  <Button variant="outline" onClick={() => addEntry("website")} className="text-primary">
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </Button>
                  <Button variant="outline" onClick={() => addEntry("email")} className="text-primary">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                  <Button variant="outline" onClick={() => addEntry("phone")} className="text-primary">
                    <Phone className="h-4 w-4 mr-1" />
                    Phone
                  </Button>
                </div>
              </div>

              {/* Selected Entry Properties */}
              {selectedEntry && (
                <div className="space-y-4 pt-4 border-t">
                  <Label>Link Properties</Label>
                  <div className="space-y-3">
                    <Input
                      placeholder="Link title"
                      value={selectedEntry.title}
                      onChange={(e) => updateEntry(selectedEntry.id, { title: e.target.value })}
                    />
                    <Input
                      placeholder="URL"
                      value={selectedEntry.url}
                      onChange={(e) => updateEntry(selectedEntry.id, { url: e.target.value })}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={selectedEntry.description || ""}
                      onChange={(e) => updateEntry(selectedEntry.id, { description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={selectedEntry.type}
                        onValueChange={(value: PathType) => updateEntry(selectedEntry.id, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {/* <SelectItem value="link">Link</SelectItem> */}
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedEntry.clickable}
                          onCheckedChange={(checked) => updateEntry(selectedEntry.id, { clickable: checked })}
                        />
                        <Label className="text-xs">Clickable</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Color & Vibrancy</Label>
                      <ColorPicker 
                        value={selectedEntry.color || "#3b82f6"}
                        onChange={(color) => updateEntry(selectedEntry.id, { color })}
                      />
                    </div>
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
                {entries.length > 1 ? (
                  <Reorder.Group 
                    axis="y" 
                    values={entries} 
                    onReorder={(newEntries) => {
                      const updatedEntries = newEntries.map((entry, index) => ({
                        ...entry,
                        position: index * 10 + 10
                      }))
                      setEntries(updatedEntries)
                    }}
                    className="space-y-4"
                  >
                    {entries.map((entry, index) => (
                      <Reorder.Item
                        key={entry.id}
                        value={entry}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <Card 
                          className={`p-4 transition-all duration-200 ${
                            selectedEntryId === entry.id 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={(e) => {
                            const target = e.target as HTMLElement
                            if (!target.closest('.drag-handle') && !target.closest('.action-buttons')) {
                              setSelectedEntryId(entry.id)
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
                                {entry.type}
                              </Badge>
                            </div>
                            <div className="flex gap-2 ml-auto action-buttons">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setSelectedEntryId(entry.id) 
                                }}
                                className={selectedEntryId === entry.id ? 'bg-primary/10 text-primary' : ''}
                              >
                                <Eye className="h-3 w-3"/>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-500" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  removeEntry(entry.id) 
                                }}
                              >
                                <Trash2 className="h-3 w-3"/>
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="font-medium">{entry.title}</p>
                            {renderEntryPreview(entry)}
                          </div>
                        </Card>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                ) : (
                  entries.map((entry, index) => (
                    <Card 
                      key={entry.id} 
                      className={`p-4 transition-all duration-200 ${
                        selectedEntryId === entry.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedEntryId(entry.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm">#{index + 1}</span>
                          <Badge variant="secondary" className="bg-primary/20 text-purple-300 text-xs">
                            {entry.type}
                          </Badge>
                        </div>
                        <div className="flex gap-2 ml-auto action-buttons">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedEntryId(entry.id) 
                            }}
                            className={selectedEntryId === entry.id ? 'bg-primary/10 text-primary' : ''}
                          >
                            <Eye className="h-3 w-3"/>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-500" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              removeEntry(entry.id) 
                            }}
                          >
                            <Trash2 className="h-3 w-3"/>
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="font-medium">{entry.title}</p>
                        {renderEntryPreview(entry)}
                      </div>
                    </Card>
                  ))
                )}
                {entries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Start building your path</p>
                    <p className="text-sm">Add link entries to get started</p>
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
              <DialogTitle>Preview</DialogTitle>
              <DialogDescription>How your links page will look to visitors</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border rounded-none max-h-[600px] overflow-y-auto">
              <div className="text-center space-y-4">
                <img
                  src={organization?.logoUrl || "/placeholder.svg"}
                  alt="Organization Logo"
                  className="w-20 h-20 rounded-none mx-auto border-2 border-dashed border-primary shadow-lg"
                />
                <div>
                  <h1 className="text-lg md:text-2xl font-bold">{pageTitle}</h1>
                  <p className="text-sm md:text-base text-muted-foreground">{pageDescription}</p>
                </div>
              </div>

              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id}>
                    {renderEntryPreview(entry)}
                  </div>
                ))}
                {entries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No link entries yet.</div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Publish Path Dialog */}
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogContent className="md:mx-4 mx-auto max-w-lg">
            <DialogHeader>
              <DialogTitle>Publish Path</DialogTitle>
              <DialogDescription>Selecting a customer will email them a secure link to this path.</DialogDescription>
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
                              You need to create customers first before you can send paths to them.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ComboBox items={customerItems} value={selectedCustomer} onValueChange={setSelectedCustomer} placeholder="Choose a customer" searchPlaceholder="Search customers..." emptyMessage="No customers found." />
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
                              You need to create projects first before you can attach paths to them.
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
                
                {protect ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="text-sm">
                        <p className="font-medium text-green-800">Private Path</p>
                        <p className="text-green-700 mt-1">
                          This path will be private and only accessible via the created secure link.
                          Recipients will need the secure link to view it.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">Public Path</p>
                        <p className="text-amber-700 mt-1">
                          This path will be publicly accessible. Anyone with the link can view it.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setSendOpen(false)}>Cancel</Button>
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
                      Publishing...
                    </>
                  ) : 'Publish Path'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
