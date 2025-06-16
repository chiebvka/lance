"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  Save,
  User,
  FileText,
  Package,
  CreditCard,
  FileCheck,
  CheckCircle,
  DollarSign,
  Edit,
  Handshake,
  CalendarIcon,
} from "lucide-react"
import ComboBox from "@/components/combobox"
import { RichTextEditor } from "@/components/tiptap/rich-text-editor"
import { z } from "zod"
import projectCreateSchema from "@/validation/projects"
import deliverableSchema from "@/validation/deliverables"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { customers } from "@/data/customer"
import { currencies } from "@/data/currency"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
// import { CurrencySelector } from "./components/currency-selector"
// import { RichTextEditor } from "./components/rich-text-editor"

const projectFormSchema = z.object({
  customer: z.any().nullable(),
  currency: z.string(),
  currencyEnabled: z.boolean(),
  type: z.enum(["personal", "customer"]),
  budget: z.number(),
  name: z.string().min(1, "Project name is required."),
  description: z.string().min(1, "Project description is required."),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  deliverablesEnabled: z.boolean(),
  deliverables: z.array(deliverableSchema),
  paymentStructure: z.string(),
  paymentMilestones: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      percentage: z.number(),
      amount: z.number(),
      dueDate: z.string().optional().nullable(),
    }),
  ),
  hasServiceAgreement: z.boolean(),
  serviceAgreement: z.string(),
  agreementTemplate: z.string(),
  hasAgreedToTerms: z.boolean(),
  published: z.boolean(),
  status: z.enum(["pending", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  hasPaymentTerms: z.boolean(),
  signedStatus: z.enum(["signed", "not_signed"]),
  documents: z.string(),
  notes: z.string(),
  customFields: z.object({
    name: z.string(),
    value: z.string(),
  }),
  state: z.string(),
  paymentTerms: z.string().optional().nullable(),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>
type DeliverableFormValues = z.infer<typeof deliverableSchema>

interface Deliverable {
  id: string
  name: string
  description: string
  dueDate: string
  position: number
  isPublished: boolean
  lastSaved?: Date
}

interface PaymentMilestone {
  id: string
  name: string
  percentage: number
  amount: number
  dueDate: string
}

interface ProjectData {
  id?: string
  customer: any
  currency: string
  currencyEnabled: boolean
  projectType: "personal" | "customer"
  budget: number
  project: {
    projectName: string
    projectDescription: string
    startDate: string
    endDate: string
  }
  deliverables: Deliverable[]
  deliverablesEnabled: boolean
  payment: {
    structure: string
    milestones: PaymentMilestone[]
  }
  serviceAgreement: {
    enabled: boolean
    text: string
    template: string
    agreed: boolean
  }
  published: boolean
  lastSaved?: Date
}


export default function ProjectForm() {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      customer: null,
      currency: "USD",
      currencyEnabled: false,
      type: "personal",
      budget: 0,
      name: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      deliverablesEnabled: true,
      deliverables: [
        {
          id: "1",
          name: "",
          description: "",
          dueDate: undefined,
          position: 1,
          status: "pending",
          isPublished: false,
        },
      ],
      paymentStructure: "milestone",
      paymentMilestones: [
        { id: "1", name: "Initial Payment", percentage: 0, amount: 0, dueDate: "" },
        { id: "2", name: "Final Payment", percentage: 0, amount: 0, dueDate: "" },
      ],
      hasServiceAgreement: false,
      serviceAgreement: "<p>Standard service agreement terms...</p>",
      agreementTemplate: "standard",
      hasAgreedToTerms: false,
      published: false,
      status: "pending",
      priority: "low",
      hasPaymentTerms: true,
      signedStatus: "not_signed",
      documents: "",
      notes: "",
      customFields: {
        name: "",
        value: "",
      },
      state: "draft",
      paymentTerms: "",
    },
  })

  const {
    fields: deliverableFields,
    append: appendDeliverable,
    remove: removeDeliverableField,
    move: moveDeliverable,
  } = useFieldArray({
    control: form.control,
    name: "deliverables",
  })

  const { fields: milestoneFields, append: appendMilestone, remove: removeMilestoneField } = useFieldArray({
    control: form.control,
    name: "paymentMilestones",
  })

  const projectType = form.watch("type")
  const currencyEnabled = form.watch("currencyEnabled")
  const budget = form.watch("budget")
  const projectName = form.watch("name")
  const projectDescription = form.watch("description")
  const deliverablesEnabled = form.watch("deliverablesEnabled")
  const paymentStructure = form.watch("paymentStructure")
  const paymentMilestones = form.watch("paymentMilestones")
  const serviceAgreementEnabled = form.watch("hasServiceAgreement")
  const hasAgreedToTerms = form.watch("hasAgreedToTerms")
  const selectedCustomer = form.watch("customer")
  const selectedCurrency = form.watch("currency")
  const deliverables = form.watch("deliverables")
  const agreementTemplate = form.watch("agreementTemplate")

  useEffect(() => {
    if (projectType === "personal") {
      form.setValue("currencyEnabled", false)
    }
  }, [projectType, form])

  // UI State - Updated to open first 3 sections by default
  const [openSections, setOpenSections] = useState({
    customer: true,
    project: true,
    budget: true,
    deliverables: true,
    payment: false,
    agreement: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingAgreement, setIsEditingAgreement] = useState(false)

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  // Helper function to calculate percentage from amount
  const calculatePercentageFromAmount = (amount: number): number => {
    if (budget === 0) return 0
    return Math.round((amount / budget) * 100)
  }

  // Helper function to calculate amount from percentage
  const calculateAmountFromPercentage = (percentage: number): number => {
    return Math.round((percentage / 100) * (budget || 0))
  }

  // Helper function to get sorted deliverables by position
  const getSortedDeliverables = () => {
    const currentDeliverables = form.getValues("deliverables")
    if (!currentDeliverables || !Array.isArray(currentDeliverables)) {
      return []
    }
    return [...currentDeliverables].sort((a, b) => (a?.position || 0) - (b?.position || 0))
  }

  // Helper function to reassign positions after reordering
  const reassignPositions = (newDeliverables: DeliverableFormValues[]) => {
    return newDeliverables.map((deliverable, index) => ({
      ...deliverable,
      position: index + 1,
    }))
  }

  // Helper function to update payment milestones based on deliverables
  const updatePaymentMilestonesFromDeliverables = () => {
    const currentPaymentStructure = form.getValues("paymentStructure")
    const currentDeliverablesEnabled = form.getValues("deliverablesEnabled")

    if (currentPaymentStructure === "deliverable" && currentDeliverablesEnabled) {
      // Create a payment milestone for each deliverable (sorted by position)
      const sortedDeliverables = getSortedDeliverables()
      const newMilestones = sortedDeliverables.map((deliverable, index) => {
        // Calculate percentages to ensure they sum to 100%
        let percentage = Math.floor(100 / sortedDeliverables.length)

        // Distribute the remainder to the last few items
        if (index >= sortedDeliverables.length - (100 % sortedDeliverables.length)) {
          percentage += 1
        }

        const amount = calculateAmountFromPercentage(percentage)

        return {
          id: `del-${deliverable.id}`,
          name: deliverable.name || `Deliverable ${deliverable.position} Payment`,
          percentage,
          amount,
          dueDate: deliverable.dueDate ? format(deliverable.dueDate, "yyyy-MM-dd") : "",
        }
      })

      form.setValue("paymentMilestones", newMilestones as any)
    }
  }

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }))
  }

  // Enhanced deliverables handlers that update payment milestones
  const setDeliverablesEnabledWithUpdates = (value: boolean) => {
    form.setValue("deliverablesEnabled", value)

    // If disabling deliverables and payment structure is deliverable-based, change it
    if (!value && form.getValues("paymentStructure") === "deliverable") {
      form.setValue("paymentStructure", "milestone")
    }
  }

  const addDeliverable = () => {
    const currentDeliverables = form.getValues("deliverables")
    // Get the highest position and add 1
    const maxPosition = Math.max(...(currentDeliverables || []).map((d) => d.position || 0), 0)
    const newDeliverable: DeliverableFormValues = {
      id: Date.now().toString(),
      name: "",
      description: "",
      dueDate: undefined,
      position: maxPosition + 1,
      status: "pending",
      isPublished: false,
    }

    appendDeliverable(newDeliverable)

    // Update payment milestones if needed
    if (form.getValues("paymentStructure") === "deliverable") {
      updatePaymentMilestonesFromDeliverables()
    }
  }

  const removeDeliverable = (index: number) => {
    const currentDeliverables = form.getValues("deliverables")
    if (currentDeliverables.length > 1) {
      removeDeliverableField(index)
      // Reassign positions after removal
      const updatedDeliverables = form.getValues("deliverables").filter((_, i) => i !== index)
      const reorderedDeliverables = reassignPositions(updatedDeliverables)
      form.setValue("deliverables", reorderedDeliverables)

      // Update payment milestones if needed
      if (form.getValues("paymentStructure") === "deliverable") {
        updatePaymentMilestonesFromDeliverables()
      }
    }
  }

  // Enhanced payment structure handlers
  const setPaymentStructureWithUpdates = (value: string) => {
    form.setValue("paymentStructure", value)

    // If switching to deliverable-based payments, update milestones
    if (value === "deliverable" && form.getValues("deliverablesEnabled")) {
      updatePaymentMilestonesFromDeliverables()
    }
  }

  const addPaymentMilestone = () => {
    const newMilestone: PaymentMilestone = {
      id: Date.now().toString(),
      name: "",
      percentage: 0,
      amount: 0,
      dueDate: "",
    }
    appendMilestone(newMilestone)
  }

  const updatePaymentMilestone = (index: number, field: keyof PaymentMilestone, value: string | number) => {
    const currentMilestones = form.getValues("paymentMilestones")
    const updatedMilestone = { ...currentMilestones[index], [field]: value }

    // If updating percentage, calculate amount
    if (field === "percentage") {
      updatedMilestone.amount = calculateAmountFromPercentage(value as number)
    }

    // If updating amount, calculate percentage
    if (field === "amount") {
      updatedMilestone.percentage = calculatePercentageFromAmount(value as number)
    }

    form.setValue(`paymentMilestones.${index}`, updatedMilestone)
  }

  const removePaymentMilestone = (index: number) => {
    const currentMilestones = form.getValues("paymentMilestones")
    if (currentMilestones.length > 1) {
      removeMilestoneField(index)
    }
  }

  const getTotalPercentage = () => {
    return (paymentMilestones || []).reduce((sum, milestone) => sum + (milestone.percentage || 0), 0)
  }

  const getTotalAmount = () => {
    return (paymentMilestones || []).reduce((sum, milestone) => sum + (milestone.amount || 0), 0)
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)

    try {
      const values = form.getValues()

      const deliverablesData = (values.deliverablesEnabled ? getSortedDeliverables() : []).map((d) => ({
        ...d,
        id: d.id || "",
        name: d.name,
        description: d.description,
        dueDate: d.dueDate ? format(d.dueDate, "yyyy-MM-dd") : "",
        position: d.position || 0,
        isPublished: d.isPublished || false,
      }))

      const milestonesData = values.paymentMilestones.map((m) => ({
        ...m,
        dueDate: m.dueDate || "",
      }))

      // Prepare project data
      const projectData: ProjectData = {
        customer: values.customer,
        currency: values.currency,
        currencyEnabled: values.currencyEnabled,
        projectType: values.type,
        budget: values.budget,
        project: {
          projectName: values.name,
          projectDescription: values.description,
          startDate: values.startDate ? format(values.startDate, "yyyy-MM-dd") : "",
          endDate: values.endDate ? format(values.endDate, "yyyy-MM-dd") : "",
        },
        deliverables: deliverablesData,
        deliverablesEnabled: values.deliverablesEnabled,
        payment: {
          structure: values.paymentStructure,
          milestones: milestonesData,
        },
        serviceAgreement: {
          enabled: values.hasServiceAgreement,
          text: values.serviceAgreement,
          template: values.agreementTemplate,
          agreed: values.hasAgreedToTerms,
        },
        published: false,
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Saving draft:", projectData)

      // Show success message or handle response
    } catch (error) {
      console.error("Error saving draft:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishProject = async (emailToCustomer = false) => {
    setIsSaving(true)

    try {
      const values = form.getValues()

      const deliverablesData = (values.deliverablesEnabled ? getSortedDeliverables() : []).map((d) => ({
        ...d,
        id: d.id || "",
        name: d.name,
        description: d.description,
        dueDate: d.dueDate ? format(d.dueDate, "yyyy-MM-dd") : "",
        position: d.position || 0,
        isPublished: d.isPublished || false,
      }))

      const milestonesData = values.paymentMilestones.map((m) => ({
        ...m,
        dueDate: m.dueDate || "",
      }))

      // Prepare project data with sorted deliverables
      const projectData: ProjectData = {
        id: undefined,
        customer: values.customer,
        currency: values.currency,
        currencyEnabled: values.currencyEnabled,
        projectType: values.type,
        budget: values.budget,
        project: {
          projectName: values.name,
          projectDescription: values.description,
          startDate: values.startDate ? format(values.startDate, "yyyy-MM-dd") : "",
          endDate: values.endDate ? format(values.endDate, "yyyy-MM-dd") : "",
        },
        deliverables: deliverablesData,
        deliverablesEnabled: values.deliverablesEnabled,
        payment: {
          structure: values.paymentStructure,
          milestones: milestonesData,
        },
        serviceAgreement: {
          enabled: values.hasServiceAgreement,
          text: values.serviceAgreement,
          template: values.agreementTemplate,
          agreed: values.hasAgreedToTerms,
        },
        published: true,
      }

      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log("Publishing project:", projectData, "Email to customer:", emailToCustomer)

      // In a real app, you would handle the response and redirect
    } catch (error) {
      console.error("Error publishing project:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const isFormValid = () => {
    const hasBasicInfo = projectName && projectDescription
    const hasValidBudget = projectType === "personal" || (budget || 0) > 0
    const hasValidDeliverables = !deliverablesEnabled || (deliverables || []).every((d) => d.name)
    const hasValidPayment =
      paymentStructure === "none" ||
      ((paymentStructure === "milestone" || paymentStructure === "deliverable") && getTotalPercentage() === 100)
    const hasAgreement = !serviceAgreementEnabled || hasAgreedToTerms

    return hasBasicInfo && hasValidBudget && hasValidDeliverables && hasValidPayment && hasAgreement
  }

  const getSectionIcon = (section: string) => {
    switch (section) {
      case "customer":
        return <User className="h-4 w-4" />
      case "project":
        return <FileText className="h-4 w-4" />
      case "budget":
        return <DollarSign className="h-4 w-4" />
      case "deliverables":
        return <Package className="h-4 w-4" />
      case "payment":
        return <CreditCard className="h-4 w-4" />
      case "agreement":
        return <FileCheck className="h-4 w-4" />
      default:
        return null
    }
  }

  // Updated getSectionStatus function to make start/end dates optional and deliverables optional
  const getSectionStatus = (section: string) => {
    switch (section) {
      case "customer":
        return projectType === "personal" || selectedCustomer ? "complete" : "incomplete"
      case "project":
        return projectName && projectDescription ? "complete" : "incomplete"
      case "budget":
        return projectType === "personal" || (budget || 0) > 0 ? "complete" : "incomplete"
      case "deliverables":
        return !deliverablesEnabled || (deliverables || []).every((d) => d.name) ? "complete" : "incomplete"
      case "payment":
        return paymentStructure === "none" ||
          ((paymentStructure === "milestone" || paymentStructure === "deliverable") && getTotalPercentage() === 100)
          ? "complete"
          : "incomplete"
      case "agreement":
        return !serviceAgreementEnabled || hasAgreedToTerms ? "complete" : "incomplete"
      default:
        return "incomplete"
    }
  }

  // Drag and drop handlers - Updated to handle positions
  const handleDragStart = (e: React.DragEvent, deliverableId: string) => {
    setDraggedItem(deliverableId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", deliverableId)
  }

  const handleDragOver = (e: React.DragEvent, deliverableId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverItem(deliverableId)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()

    if (!draggedItem || draggedItem === targetId || !targetId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    try {
      const draggedIndex = deliverableFields.findIndex((d) => d.id === draggedItem)
      const targetIndex = deliverableFields.findIndex((d) => d.id === targetId)

      if (draggedIndex === -1 || targetIndex === -1) return

      moveDeliverable(draggedIndex, targetIndex)

      // Reassign positions based on new order
      const newDeliverablesOrder = form.getValues("deliverables")
      const reorderedDeliverables = reassignPositions(newDeliverablesOrder)
      form.setValue("deliverables", reorderedDeliverables, { shouldDirty: true })

      // Update payment milestones if needed
      if (form.getValues("paymentStructure") === "deliverable") {
        updatePaymentMilestonesFromDeliverables()
      }
    } catch (error) {
      console.error("Error during drag and drop:", error)
    } finally {
      setDraggedItem(null)
      setDragOverItem(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-gray-600 mt-2">
                Configure your project step by step using the accordion sections below
              </p>
            </div>
          </div>
        </div>

        {/* Progress Summary - Moved to top */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Project Creation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { key: "customer", label: "Customer" },
                { key: "project", label: "Project" },
                ...(projectType === "customer" ? [{ key: "budget", label: "Budget" }] : []),
                { key: "deliverables", label: "Deliverables" },
                { key: "payment", label: "Payment" },
                { key: "agreement", label: "Agreement" },
              ].map(({ key, label }) => (
                <div key={key} className="text-center">
                  <div
                    className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      getSectionStatus(key) === "complete" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {getSectionStatus(key) === "complete" ? <CheckCircle className="h-4 w-4" /> : getSectionIcon(key)}
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


          <Form {...form}>
            <form >
              {/* Accordion Sections */}
              <div className="space-y-4">
                {/* Customer Selection */}
                <Card>
                  <Collapsible open={openSections.customer} onOpenChange={() => toggleSection("customer")}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getSectionIcon("customer")}
                            <CardTitle
                              className={`text-lg ${getSectionStatus("customer") === "complete" ? "text-primary" : ""}`}
                            >
                              Customer Selection
                            </CardTitle>
                            {getSectionStatus("customer") === "complete" && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getSectionStatus("customer") === "complete" ? (
                              <span className="text-sm font-medium text-green-600">Completed</span>
                            ) : (
                              <span className="text-sm font-medium text-yellow-600">Incomplete</span>
                            )}
                            {projectType === "personal" && (
                              <Badge
                                variant="secondary"
                                className={getSectionStatus("customer") !== "complete" ? "bg-yellow-100 text-yellow-800" : ""}
                              >
                                Personal Project
                              </Badge>
                            )}
                            {projectType === "customer" && selectedCustomer && (
                              <Badge
                                variant="secondary"
                                className={getSectionStatus("customer") !== "complete" ? "bg-yellow-100 text-yellow-800" : ""}
                              >
                                {selectedCustomer.name}
                              </Badge>
                            )}
                            {openSections.customer ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-4 mb-4">
                                <FormLabel>Project Type</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex items-center space-x-4"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="personal" id="personal" />
                                      <Label htmlFor="personal" className="cursor-pointer">
                                        Personal Project
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="customer" id="customer" />
                                      <Label htmlFor="customer" className="cursor-pointer">
                                        Customer Project
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {projectType === "customer" && (
                            <FormField
                              control={form.control}
                              name="customer"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Select Customer</FormLabel>
                                  <FormControl>
                                    <ComboBox
                                      items={customers.map((c) => ({
                                        ...c,
                                        value: c.id,
                                        label: c.name,
                                        searchValue: `${c.name} ${c.company} ${c.email}`,
                                      }))}
                                      value={field.value?.id ?? null}
                                      onValueChange={(customerId) => {
                                        field.onChange(customers.find((c) => c.id === customerId) || null)
                                      }}
                                      placeholder="Select customer..."
                                      searchPlaceholder="Search by name, company, or email..."
                                      emptyMessage="No customer found."
                                      onCreate={{
                                        label: "Create customer",
                                        action: () => console.log("Create customer"),
                                      }}
                                      itemRenderer={(item) => (
                                        <div className="flex items-center justify-between w-full">
                                          <div>
                                            <div className="font-medium">{item.label}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {item.company} • {item.email}
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              console.log("Edit customer", item.id)
                                            }}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <div className="space-y-2">
                            <FormField
                              control={form.control}
                              name="currencyEnabled"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3">
                                  <Switch
                                    id="currencyEnabled"
                                    checked={field.value}
                                    onCheckedChange={(value) => {
                                      field.onChange(value)
                                    }}
                                    disabled={projectType === "personal"}
                                  />
                                  <Label
                                    htmlFor="currencyEnabled"
                                    className={`cursor-pointer transition-all duration-300 ease-in-out ${
                                      field.value && projectType !== "personal"
                                        ? "text-[#9948fb] font-medium scale-[1.1] transform"
                                        : "text-gray-700 scale-100 transform"
                                    } ${projectType === "personal" ? "cursor-not-allowed opacity-50" : ""}`}
                                  >
                                    Specify Currency
                                  </Label>
                                </FormItem>
                              )}
                            />

                            {currencyEnabled && (
                              <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Currency</FormLabel>
                                    <FormControl>
                                      <ComboBox
                                        items={currencies.map((c) => ({
                                          ...c,
                                          value: c.code,
                                          label: `${c.code} - ${c.name}`,
                                          searchValue: `${c.code} ${c.name}`,
                                        }))}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="Select currency..."
                                        searchPlaceholder="Search by code or name..."
                                        emptyMessage="No currency found."
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* Project Details */}
                <Card>
                  <Collapsible open={openSections.project} onOpenChange={() => toggleSection("project")}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getSectionIcon("project")}
                            <CardTitle
                              className={`text-lg ${getSectionStatus("project") === "complete" ? "text-primary" : ""}`}
                            >
                              Project Details
                            </CardTitle>
                            {getSectionStatus("project") === "complete" && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getSectionStatus("project") === "complete" ? (
                              <span className="text-sm font-medium text-green-600">Completed</span>
                            ) : (
                              <span className="text-sm font-medium text-yellow-600">Incomplete</span>
                            )}
                            {projectName && (
                              <Badge
                                variant="secondary"
                                className={getSectionStatus("project") !== "complete" ? "bg-yellow-100 text-yellow-800" : ""}
                              >
                                {projectName}
                              </Badge>
                            )}
                            {openSections.project ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Name *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Enter project name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Description *</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="Describe the project scope and objectives"
                                      rows={3}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Start Date (Optional)</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value && "text-muted-foreground",
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={field.value || undefined}
                                      onSelect={field.onChange}
                                      captionLayout="dropdown"
                                      fromYear={2015}
                                      toYear={2045}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>End Date (Optional)</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value && "text-muted-foreground",
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={field.value || undefined}
                                      onSelect={field.onChange}
                                      captionLayout="dropdown"
                                      fromYear={2015}
                                      toYear={2045}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* Budget Section - Only show for customer projects */}
                {projectType === "customer" && (
                  <Card>
                    <Collapsible open={openSections.budget} onOpenChange={() => toggleSection("budget")}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getSectionIcon("budget")}
                              <CardTitle
                                className={`text-lg ${getSectionStatus("budget") === "complete" ? "text-primary" : ""}`}
                              >
                                Project Budget
                              </CardTitle>
                              {getSectionStatus("budget") === "complete" && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getSectionStatus("budget") === "complete" ? (
                                <span className="text-sm font-medium text-green-600">Completed</span>
                              ) : (
                                <span className="text-sm font-medium text-yellow-600">Incomplete</span>
                              )}
                              {budget > 0 && (
                                <Badge
                                  variant="secondary"
                                  className={getSectionStatus("budget") !== "complete" ? "bg-yellow-100 text-yellow-800" : ""}
                                >
                                  {currencyEnabled ? selectedCurrency : "$"} {(budget || 0).toLocaleString()}
                                </Badge>
                              )}
                              {openSections.budget ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="budget"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Total Project Budget *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        {...field}
                                        value={field.value || ""}
                                        onChange={(e) => {
                                          const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value) || 0
                                          field.onChange(value)

                                          // Update all payment milestone amounts when budget changes
                                          const updatedMilestones = (form.getValues("paymentMilestones") || []).map((milestone) => ({
                                            ...milestone,
                                            amount: calculateAmountFromPercentage(milestone.percentage),
                                          }))
                                          form.setValue("paymentMilestones", updatedMilestones)
                                        }}
                                        placeholder="Enter total budget amount"
                                        className="pl-16"
                                      />
                                      <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                        {currencyEnabled ? selectedCurrency : "$"}
                                      </span>
                                    </div>
                                  </FormControl>
                                  <p className="text-sm text-gray-600 mt-1">
                                    This budget will be used to calculate payment amounts automatically based on percentages.
                                  </p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )}

                {/* Deliverables */}
                <Card>
                  <Collapsible open={openSections.deliverables} onOpenChange={() => toggleSection("deliverables")}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getSectionIcon("deliverables")}
                            <CardTitle
                              className={`text-lg ${getSectionStatus("deliverables") === "complete" ? "text-primary" : ""}`}
                            >
                              Deliverables
                            </CardTitle>
                            {getSectionStatus("deliverables") === "complete" && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getSectionStatus("deliverables") === "complete" ? (
                              <span className="text-sm font-medium text-green-600">Completed</span>
                            ) : (
                              <span className="text-sm font-medium text-yellow-600">Incomplete</span>
                            )}
                            {!deliverablesEnabled && (
                              <Badge
                                variant="secondary"
                                className={
                                  getSectionStatus("deliverables") !== "complete" ? "bg-yellow-100 text-yellow-800" : ""
                                }
                              >
                                Disabled
                              </Badge>
                            )}
                            {deliverablesEnabled && (
                              <Badge
                                variant="secondary"
                                className={
                                  getSectionStatus("deliverables") !== "complete" ? "bg-yellow-100 text-yellow-800" : ""
                                }
                              >
                                {deliverables.length} items
                              </Badge>
                            )}
                            {openSections.deliverables ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="deliverablesEnabled"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-3">
                                <FormControl>
                                  <Switch
                                    id="deliverablesEnabled"
                                    checked={field.value}
                                    onCheckedChange={(value) => {
                                      field.onChange(value)
                                      setDeliverablesEnabledWithUpdates(value)
                                    }}
                                  />
                                </FormControl>
                                <FormLabel
                                  htmlFor="deliverablesEnabled"
                                  className={`cursor-pointer transition-all duration-300 ease-in-out ${
                                    field.value
                                      ? "text-[#9948fb] font-medium scale-[1.1] transform"
                                      : "text-gray-700 scale-100 transform"
                                  }`}
                                >
                                  Enable Deliverables
                                </FormLabel>
                              </FormItem>
                            )}
                          />

                          {deliverablesEnabled && (
                            <>
                              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <p className="text-sm text-gray-600">
                                  💡 <strong>Tip:</strong> Drag and drop deliverables using the grip handle to reorder them.
                                  Positions are automatically saved.
                                </p>
                              </div>
                              {deliverableFields
                                .filter(Boolean)
                                .map((deliverable, index) => {
                                  if (!deliverable || !deliverable.id) return null

                                  return (
                                    <div
                                      key={deliverable.id}
                                      draggable={!!deliverablesEnabled}
                                      onDragStart={(e) => handleDragStart(e, deliverable.id!)}
                                      onDragOver={(e) => handleDragOver(e, deliverable.id!)}
                                      onDragLeave={handleDragLeave}
                                      onDrop={(e) => handleDrop(e, deliverable.id!)}
                                      onDragEnd={handleDragEnd}
                                      className={`border rounded-lg p-4 bg-white transition-all duration-200 ${
                                        draggedItem === deliverable.id ? "opacity-50 scale-95" : ""
                                      } ${dragOverItem === deliverable.id ? "border-blue-500 bg-blue-50" : ""} ${
                                        deliverablesEnabled ? "cursor-move" : ""
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-3">
                                        <GripVertical
                                          className={`h-4 w-4 ${
                                            deliverablesEnabled ? "text-gray-400 hover:text-gray-600" : "text-gray-300"
                                          }`}
                                        />
                                        <span className="font-medium">Deliverable {deliverable.position}</span>
                                        <Badge variant="outline" className="text-xs">
                                          Position: {deliverable.position}
                                        </Badge>
                                        {draggedItem === deliverable.id && (
                                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                            Dragging...
                                          </span>
                                        )}
                                        {deliverables.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              removeDeliverable(index)
                                            }}
                                            className="ml-auto"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <FormField
                                            control={form.control}
                                            name={`deliverables.${index}.name`}
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                  <Input {...field} placeholder="Deliverable name" />
                                                </FormControl>
                                              </FormItem>
                                            )}
                                          />
                                          <FormField
                                            control={form.control}
                                            name={`deliverables.${index}.dueDate`}
                                            render={({ field }) => (
                                              <FormItem className="flex flex-col">
                                                <FormLabel>Due Date</FormLabel>
                                                <Popover>
                                                  <PopoverTrigger asChild>
                                                    <FormControl>
                                                      <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                          "w-full justify-start text-left font-normal",
                                                          !field.value && "text-muted-foreground",
                                                        )}
                                                      >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                      </Button>
                                                    </FormControl>
                                                  </PopoverTrigger>
                                                  <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                      mode="single"
                                                      selected={field.value || undefined}
                                                      onSelect={field.onChange}
                                                      captionLayout="dropdown"
                                                      fromYear={2015}
                                                      toYear={2045}
                                                    />
                                                  </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                        <FormField
                                          control={form.control}
                                          name={`deliverables.${index}.description`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Description</FormLabel>
                                              <FormControl>
                                                <Textarea {...field} placeholder="Brief description" rows={2} />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    </div>
                                  )
                                })}
                              <Button type="button" variant="outline" onClick={addDeliverable} className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Deliverable
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* Payment Structure */}
                <Card>
                  <Collapsible open={openSections.payment} onOpenChange={() => toggleSection("payment")}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getSectionIcon("payment")}
                            <CardTitle
                              className={`text-lg ${getSectionStatus("payment") === "complete" ? "text-primary" : ""}`}
                            >
                              Payment Structure
                            </CardTitle>
                            {getSectionStatus("payment") === "complete" && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getSectionStatus("payment") === "complete" ? (
                              <span className="text-sm font-medium text-green-600">Completed</span>
                            ) : (
                              <span className="text-sm font-medium text-yellow-600">Incomplete</span>
                            )}
                            <Badge
                              variant="secondary"
                              className={getSectionStatus("payment") !== "complete" ? "bg-yellow-100 text-yellow-800" : ""}
                            >
                              {paymentStructure === "none" ? "No Payment" : `${getTotalPercentage()}%`}
                            </Badge>
                            {projectType === "customer" && budget > 0 && (
                              <Badge
                                variant="outline"
                                className={getSectionStatus("payment") !== "complete" ? "bg-yellow-100 text-yellow-800" : ""}
                              >
                                {currencyEnabled ? selectedCurrency : "$"} {getTotalAmount().toLocaleString()}
                              </Badge>
                            )}
                            {openSections.payment ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div>
                            <FormField
                              control={form.control}
                              name="paymentStructure"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Type</FormLabel>
                                  <FormControl>
                                    <Select
                                      onValueChange={(value) => {
                                        field.onChange(value)
                                        setPaymentStructureWithUpdates(value)
                                      }}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="none">No payment required</SelectItem>
                                        <SelectItem value="milestone">Milestone-based payments</SelectItem>
                                        {deliverablesEnabled && (
                                          <SelectItem value="deliverable">Deliverable-based payments</SelectItem>
                                        )}
                                        <SelectItem value="upfront">Full payment upfront</SelectItem>
                                        <SelectItem value="completion">Payment on completion</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          {paymentStructure === "milestone" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Payment Milestones</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getTotalPercentage() === 100 ? "default" : "destructive"}>
                                    Total: {getTotalPercentage()}%
                                  </Badge>
                                  {projectType === "customer" && budget > 0 && (
                                    <Badge variant="outline">
                                      {currencyEnabled ? selectedCurrency : "$"} {getTotalAmount().toLocaleString()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {milestoneFields.map((milestone, index) => (
                                <div key={milestone.id} className="border rounded-lg p-4 bg-white">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="font-medium">Milestone {index + 1}</span>
                                    {paymentMilestones.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePaymentMilestone(index)}
                                        className="ml-auto"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <div
                                    className={`grid grid-cols-1 ${
                                      projectType === "customer" && budget > 0 ? "md:grid-cols-4" : "md:grid-cols-3"
                                    } gap-3 items-end`}
                                  >
                                    <FormField
                                      control={form.control}
                                      name={`paymentMilestones.${index}.name`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Name</FormLabel>
                                          <FormControl>
                                            <Input {...field} placeholder="Milestone name" />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`paymentMilestones.${index}.percentage`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Percentage</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="0"
                                              max="100"
                                              {...field}
                                              value={field.value || ""}
                                              onChange={(e) => {
                                                const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value) || 0
                                                updatePaymentMilestone(index, "percentage", value)
                                              }}
                                              placeholder="Enter percentage"
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    {projectType === "customer" && budget > 0 && (
                                      <FormField
                                        control={form.control}
                                        name={`paymentMilestones.${index}.amount`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Amount ({currencyEnabled ? selectedCurrency : "$"})</FormLabel>
                                            <FormControl>
                                              <div className="relative">
                                                <Input
                                                  type="number"
                                                  min="0"
                                                  step="0.01"
                                                  {...field}
                                                  value={field.value || ""}
                                                  onChange={(e) => {
                                                    const value =
                                                      e.target.value === "" ? 0 : Number.parseFloat(e.target.value) || 0
                                                    updatePaymentMilestone(index, "amount", value)
                                                  }}
                                                  placeholder="Enter amount"
                                                  className="pl-16"
                                                />
                                                <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                                  {currencyEnabled ? selectedCurrency : "$"}
                                                </span>
                                              </div>
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                    )}
                                    <FormField
                                      control={form.control}
                                      name={`paymentMilestones.${index}.dueDate`}
                                      render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                          <FormLabel>Due Date</FormLabel>
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <FormControl>
                                                <Button
                                                  variant={"outline"}
                                                  className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !field.value && "text-muted-foreground",
                                                  )}
                                                >
                                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                                  {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                                </Button>
                                              </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                              <Calendar
                                                mode="single"
                                                selected={field.value ? new Date(field.value) : undefined}
                                                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                                                captionLayout="dropdown"
                                                fromYear={2015}
                                                toYear={2045}
                                              />
                                            </PopoverContent>
                                          </Popover>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>
                              ))}
                              <Button type="button" variant="outline" onClick={addPaymentMilestone} className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Milestone
                              </Button>
                            </div>
                          )}

                          {paymentStructure === "deliverable" && deliverablesEnabled && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Deliverable-Based Payments</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getTotalPercentage() === 100 ? "default" : "destructive"}>
                                    Total: {getTotalPercentage()}%
                                  </Badge>
                                  {projectType === "customer" && budget > 0 && (
                                    <Badge variant="outline">
                                      {currencyEnabled ? selectedCurrency : "$"} {getTotalAmount().toLocaleString()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                <p className="text-sm text-blue-700">
                                  Payments are tied to your deliverables in order. Ensure percentages total 100%.
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => {
                                    // Redistribute percentages evenly
                                    const currentMilestones = form.getValues("paymentMilestones")
                                    const basePercentage = Math.floor(100 / currentMilestones.length)
                                    const remainder = 100 % currentMilestones.length

                                    const newMilestones = currentMilestones.map((milestone, i) => {
                                      const percentage = basePercentage + (i < remainder ? 1 : 0)
                                      return {
                                        ...milestone,
                                        percentage,
                                        amount: calculateAmountFromPercentage(percentage),
                                      }
                                    })
                                    form.setValue("paymentMilestones", newMilestones as any)
                                  }}
                                >
                                  Redistribute Evenly
                                </Button>
                              </div>
                              {milestoneFields.filter(Boolean).map((milestone, index) => {
                                if (!milestone || !milestone.id) return null

                                const sortedDeliverables = getSortedDeliverables()
                                const correspondingDeliverable = sortedDeliverables[index]

                                return (
                                  <div key={milestone.id} className="border rounded-lg p-4 bg-white">
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="font-medium">
                                        Payment for:{" "}
                                        {correspondingDeliverable?.name ||
                                          `Deliverable ${correspondingDeliverable?.position || index + 1}`}
                                      </span>
                                      {correspondingDeliverable && (
                                        <Badge variant="outline" className="text-xs">
                                          Position: {correspondingDeliverable.position}
                                        </Badge>
                                      )}
                                    </div>
                                    <div
                                      className={`grid grid-cols-1 ${
                                        projectType === "customer" && budget > 0 ? "md:grid-cols-3" : "md:grid-cols-2"
                                      } gap-3 items-end`}
                                    >
                                      <FormField
                                        control={form.control}
                                        name={`paymentMilestones.${index}.percentage`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Percentage</FormLabel>
                                            <FormControl>
                                              <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                {...field}
                                                value={field.value || ""}
                                                onChange={(e) => {
                                                  const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value) || 0
                                                  updatePaymentMilestone(index, "percentage", value)
                                                }}
                                                className={getTotalPercentage() !== 100 ? "border-red-300" : ""}
                                                placeholder="Enter percentage"
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                      {projectType === "customer" && budget > 0 && (
                                        <FormField
                                          control={form.control}
                                          name={`paymentMilestones.${index}.amount`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Amount ({currencyEnabled ? selectedCurrency : "$"})</FormLabel>
                                              <FormControl>
                                                <div className="relative">
                                                  <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) => {
                                                      const value =
                                                        e.target.value === "" ? 0 : Number.parseFloat(e.target.value) || 0
                                                      updatePaymentMilestone(index, "amount", value)
                                                    }}
                                                    placeholder="Enter amount"
                                                    className="pl-16"
                                                  />
                                                  <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                                    {currencyEnabled ? selectedCurrency : "$"}
                                                  </span>
                                                </div>
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      )}
                                      <FormField
                                        control={form.control}
                                        name={`paymentMilestones.${index}.dueDate`}
                                        render={({ field }) => (
                                          <FormItem className="flex flex-col">
                                            <FormLabel>Due Date</FormLabel>
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <FormControl>
                                                  <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                      "w-full justify-start text-left font-normal",
                                                      !field.value && "text-muted-foreground",
                                                    )}
                                                  >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                                  </Button>
                                                </FormControl>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                  mode="single"
                                                  selected={field.value ? new Date(field.value) : undefined}
                                                  onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)}
                                                  captionLayout="dropdown"
                                                  fromYear={2015}
                                                  toYear={2045}
                                                />
                                              </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

                {/* Service Agreement */}
                <Card>
                  <Collapsible open={openSections.agreement} onOpenChange={() => toggleSection("agreement")}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getSectionIcon("agreement")}
                            <CardTitle
                              className={`text-lg ${getSectionStatus("agreement") === "complete" ? "text-primary" : ""}`}
                            >
                              Service Agreement
                            </CardTitle>
                            {getSectionStatus("agreement") === "complete" && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getSectionStatus("agreement") === "complete" ? (
                              <span className="text-sm font-medium text-green-600">Completed</span>
                            ) : (
                              <span className="text-sm font-medium text-yellow-600">Incomplete</span>
                            )}
                            <Badge
                              variant={serviceAgreementEnabled ? "default" : "secondary"}
                              className={
                                getSectionStatus("agreement") !== "complete" ? "bg-yellow-100 text-yellow-800" : ""
                              }
                            >
                              {serviceAgreementEnabled ? "Enabled" : "Disabled"}
                            </Badge>
                            {openSections.agreement ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="hasServiceAgreement"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-3">
                                <FormControl>
                                  <Switch
                                    id="serviceAgreement"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel
                                  htmlFor="serviceAgreement"
                                  className={`cursor-pointer transition-all duration-300 ease-in-out ${
                                    field.value
                                      ? "text-[#9948fb] font-medium scale-[1.1] transform"
                                      : "text-gray-700 scale-100 transform"
                                  }`}
                                >
                                  Enable Service Agreement
                                </FormLabel>
                              </FormItem>
                            )}
                          />

                          {serviceAgreementEnabled && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <FormField
                                  control={form.control}
                                  name="agreementTemplate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Agreement Template</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="w-48">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="standard">Standard Agreement</SelectItem>
                                          <SelectItem value="consulting">Consulting Agreement</SelectItem>
                                          <SelectItem value="development">Development Agreement</SelectItem>
                                          <SelectItem value="custom">Custom Agreement</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                                <Button type="button" variant="outline" onClick={() => setIsEditingAgreement(!isEditingAgreement)}>
                                  {isEditingAgreement ? "Preview" : "Edit Agreement"}
                                </Button>
                              </div>

                              {isEditingAgreement ? (
                                <FormField
                                  control={form.control}
                                  name="serviceAgreement"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Agreement Content</FormLabel>
                                      <FormControl>
                                        {typeof RichTextEditor !== "undefined" ? (
                                          <RichTextEditor value={field.value || ""} onChange={field.onChange} />
                                        ) : (
                                          <Textarea
                                            {...field}
                                            value={field.value || ""}
                                            rows={10}
                                            placeholder="Enter agreement content..."
                                          />
                                        )}
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ) : (
                                <div>
                                  <Label>Agreement Content</Label>
                                  <div dangerouslySetInnerHTML={{ __html: form.getValues("serviceAgreement") || "" }} />
                                </div>
                              )}

                              <FormField
                                control={form.control}
                                name="hasAgreedToTerms"
                                render={({ field }) => (
                                  <FormItem className="rounded-lg bg-purple-50 p-4">
                                    <div className="flex items-center space-x-2">
                                      <FormControl>
                                        <Checkbox
                                          id="agreeTerms"
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          variant="agreement"
                                        />
                                      </FormControl>
                                      <Label htmlFor="agreeTerms" className="text-sm">
                                        I agree to the service agreement terms and conditions
                                      </Label>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </div>
            </form>
          </Form>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving} className="w-full max-w-xs">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={!isFormValid() || isSaving} className="w-full max-w-xs">
                {isSaving ? "Publishing..." : "Publish Project"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handlePublishProject(false)}>Publish Project</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePublishProject(true)}
                disabled={projectType !== "customer" || !selectedCustomer}
              >
                Publish & Email to Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
