"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  Bubbles,
} from "lucide-react"
import ComboBox from "@/components/combobox"
import { TipTapEditor } from "@/components/tiptap/tip-tap-editor"
import { z } from "zod"

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
import { currencies } from "@/data/currency"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn, safeParseJsonArray } from "@/lib/utils"
import type { z as zod } from "zod"
import type paymentTermSchema from "@/validation/payment"
import axios from "axios"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { projectCustomerFetch } from "@/actions/customer/fetch"
import CustomerForm from "../../../customers/_components/customer-form"
import { Tables } from "@/types/supabase"
import { projectCreateSchema } from "@/validation/projects"

type ProjectFormValues = z.infer<typeof projectCreateSchema>
type DeliverableFormValues = z.infer<typeof deliverableSchema>
type PaymentTermFormValues = zod.infer<typeof paymentTermSchema>

// Payload-specific interfaces
interface PayloadPaymentMilestone {
  id?: string
  name: string | null
  percentage: number | null
  amount: number | null
  dueDate: string
  description?: string | null
  status?: string | null
  type?: "milestone" | "deliverable" | null
}

interface PayloadDeliverable {
  id: string
  name: string
  description: string
  dueDate: string
  position: number
  isPublished: boolean
  status: "pending" | "in_progress" | "completed"
}

interface Customer {
  id: string
  name: string
  email: string | null
}

export default function EditProjectForm({ project }: { project: Tables<"projects"> }) {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isCreateCustomerSheetOpen, setCreateCustomerSheetOpen] = useState(false)
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false)

  const parseDate = (date: string | null | undefined): Date | undefined => {
    return date ? new Date(date) : undefined
  }

  useEffect(() => {
    async function fetchCustomers() {
      const result = await projectCustomerFetch()
      if (result.customers) {
        setCustomers(result.customers as Customer[])
      } else if (result.error) {
        toast.error("Failed to load customers", { description: result.error })
      }
    }
    fetchCustomers()
  }, [])

  const handleCustomerCreated = async () => {
    setCreateCustomerSheetOpen(false)
    const result = await projectCustomerFetch()
    if (result.customers) {
      setCustomers(result.customers as Customer[])
      toast.success("Customer created and list updated!")
    }
  }

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: {
      customerId: project.customerId,
      type: (project.type as "personal" | "customer") || "personal",
      name: project.name || "",
      description: project.description || "",
      startDate: parseDate(project.startDate),
      endDate: parseDate(project.endDate),
      budget: project.budget ?? 0,
      currency: project.currency || "USD",
      currencyEnabled: project.currencyEnabled ?? false,
      deliverablesEnabled: project.deliverablesEnabled ?? true,
      deliverables: safeParseJsonArray(project.deliverables).map((d: any) => ({
        ...d,
        dueDate: parseDate(d.dueDate),
      })),
      paymentStructure: project.paymentStructure || "noPayment",
      paymentMilestones: safeParseJsonArray(project.paymentMilestones).map((m: any) => ({
        ...m,
        dueDate: parseDate(m.dueDate),
      })),
      hasServiceAgreement: project.hasServiceAgreement ?? false,
      serviceAgreement: typeof project.serviceAgreement === "string" ? project.serviceAgreement : "",
      agreementTemplate: "standard", 
      hasAgreedToTerms: project.hasAgreedToTerms ?? false,
      isPublished: project.isPublished ?? false,
      status: project.status || "pending",
      signedStatus: project.signedStatus || "not_signed",
      documents: typeof project.documents === "string" ? project.documents : "",
      notes: project.notes || "",
      customFields:
        project.customFields && typeof project.customFields === "object" && !Array.isArray(project.customFields)
          ? (project.customFields as { name: string; value: string })
          : { name: "", value: "" },
      state: (project.state as "draft" | "published" | undefined) || "draft",
      emailToCustomer: project.emailToCustomer ?? false,
      hasPaymentTerms: project.hasPaymentTerms ?? false,
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
  const selectedCustomerId = form.watch("customerId")
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const selectedCurrency = form.watch("currency")
  const deliverables = form.watch("deliverables")

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

  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  const calculatePercentageFromAmount = (amount: number): number => {
    if (!budget) return 0
    return Math.round((amount / budget) * 100)
  }

  const calculateAmountFromPercentage = (percentage: number): number => {
    return Math.round((percentage / 100) * (budget || 0))
  }

  const getSortedDeliverables = () => {
    const currentDeliverables = form.getValues("deliverables") || []
    if (!currentDeliverables || !Array.isArray(currentDeliverables)) {
      return []
    }
    return [...currentDeliverables].sort((a, b) => (a?.position || 0) - (b?.position || 0))
  }

  const reassignPositions = (newDeliverables: DeliverableFormValues[]) => {
    return newDeliverables.map((deliverable, index) => ({
      ...deliverable,
      position: index + 1,
    }))
  }

  const updatePaymentMilestonesFromDeliverables = () => {
    const currentPaymentStructure = form.getValues("paymentStructure")
    const currentDeliverablesEnabled = form.getValues("deliverablesEnabled")

    if (currentPaymentStructure === "deliverablePayment" && currentDeliverablesEnabled) {
      const sortedDeliverables = getSortedDeliverables()
      const newMilestones = sortedDeliverables.map((deliverable, index) => {
        let percentage = Math.floor(100 / sortedDeliverables.length)
        if (index >= sortedDeliverables.length - (100 % sortedDeliverables.length)) {
          percentage += 1
        }
        const amount = calculateAmountFromPercentage(percentage)
        return {
          id: uuidv4(),
          name: deliverable.name || `Deliverable ${deliverable.position} Payment`,
          percentage,
          amount,
          dueDate: deliverable.dueDate,
          description: null,
          status: "pending",
          type: "deliverable",
          hasPaymentTerms: false,
          deliverableId: deliverable.id,
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

  const setDeliverablesEnabledWithUpdates = (value: boolean) => {
    form.setValue("deliverablesEnabled", value)
    if (!value && form.getValues("paymentStructure") === "deliverablePayment") {
      form.setValue("paymentStructure", "milestonePayment")
    }
  }

  const addDeliverable = () => {
    const currentDeliverables = form.getValues("deliverables") || []
    const maxPosition = Math.max(...currentDeliverables.map((d) => d.position || 0), 0)
    const newDeliverable: DeliverableFormValues = {
      id: uuidv4(),
      name: "",
      description: "",
      dueDate: undefined,
      position: maxPosition + 1,
      status: "pending",
      isPublished: false,
    }
    appendDeliverable(newDeliverable)
    if (form.getValues("paymentStructure") === "deliverablePayment") {
      updatePaymentMilestonesFromDeliverables()
    }
  }

  const removeDeliverable = (index: number) => {
    const currentDeliverables = form.getValues("deliverables")
    if (currentDeliverables && currentDeliverables.length > 1) {
      removeDeliverableField(index)
      const updatedDeliverables = (form.getValues("deliverables") || []).filter((_, i) => i !== index)
      const reorderedDeliverables = reassignPositions(updatedDeliverables)
      form.setValue("deliverables", reorderedDeliverables)
      if (form.getValues("paymentStructure") === "deliverablePayment") {
        updatePaymentMilestonesFromDeliverables()
      }
    }
  }

  const setPaymentStructureWithUpdates = (value: string) => {
    form.setValue("paymentStructure", value as any)
    if (value === "deliverablePayment" && form.getValues("deliverablesEnabled")) {
      updatePaymentMilestonesFromDeliverables()
    }
  }

  const addPaymentMilestone = () => {
    const newMilestone: PaymentTermFormValues = {
      id: uuidv4(),
      name: "",
      description: null,
      amount: 0,
      percentage: 0,
      dueDate: null,
      status: null,
      type: "milestone",
      hasPaymentTerms: false,
      deliverableId: null,
    }
    appendMilestone(newMilestone)
  }

  const updatePaymentMilestone = (
    index: number,
    field: keyof PayloadPaymentMilestone,
    value: string | number | Date | null,
  ) => {
    const currentMilestones = form.getValues("paymentMilestones")
    if (!currentMilestones) return
    const updatedMilestone = { ...currentMilestones[index], [field]: value }
    if (field === "percentage") {
      updatedMilestone.amount = calculateAmountFromPercentage(value as number)
    }
    if (field === "amount") {
      updatedMilestone.percentage = calculatePercentageFromAmount(value as number)
    }
    form.setValue(`paymentMilestones.${index}`, updatedMilestone)
  }

  const removePaymentMilestone = (index: number) => {
    const currentMilestones = form.getValues("paymentMilestones")
    if (currentMilestones && currentMilestones.length > 1) {
      removeMilestoneField(index)
    }
  }

  const getTotalPercentage = () => {
    return (paymentMilestones || []).reduce((sum, milestone) => sum + (milestone.percentage || 0), 0)
  }

  const getTotalAmount = () => {
    return (paymentMilestones || []).reduce((sum, milestone) => sum + (milestone.amount || 0), 0)
  }

  const handleUpdate = async (emailToCustomer = false) => {
    setIsSaving(true)
    const values = form.getValues()
    console.log("Form values to update:", values)
    setTimeout(() => {
      toast.info("Update functionality is not yet implemented.", {
        description: "Check the console for the data that would be sent.",
      })
      setIsSaving(false)
    }, 1000)
  }

  const isFormValid = () => {
    const hasBasicInfo = projectName && projectDescription
    const hasValidBudget = projectType === "personal" || (budget || 0) > 0
    const hasValidDeliverables = !deliverablesEnabled || (deliverables || []).every((d) => d.name)
    const hasValidPayment =
      paymentStructure === "noPayment" ||
      ((paymentStructure === "milestonePayment" || paymentStructure === "deliverablePayment") &&
        getTotalPercentage() === 100) ||
      paymentStructure === "fullDownPayment" ||
      paymentStructure === "paymentOnCompletion"
    const hasAgreement = !serviceAgreementEnabled || hasAgreedToTerms
    return hasBasicInfo && hasValidBudget && hasValidDeliverables && hasValidPayment && hasAgreement
  }

  const getSectionIcon = (section: string) => {
    switch (section) {
      case "customer":
        return <User className="h-4 w-4 text-primary" />
      case "project":
        return <FileText className="h-4 w-4 text-primary" />
      case "budget":
        return <DollarSign className="h-4 w-4 text-primary" />
      case "deliverables":
        return <Package className="h-4 w-4 text-primary" />
      case "payment":
        return <CreditCard className="h-4 w-4 text-primary" />
      case "agreement":
        return <FileCheck className="h-4 w-4 text-primary" />
      default:
        return null
    }
  }

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
        return paymentStructure === "noPayment" ||
          ((paymentStructure === "milestonePayment" || paymentStructure === "deliverablePayment") &&
            getTotalPercentage() === 100) ||
          paymentStructure === "fullDownPayment" ||
          paymentStructure === "paymentOnCompletion"
          ? "complete"
          : "incomplete"
      case "agreement":
        return !serviceAgreementEnabled || hasAgreedToTerms ? "complete" : "incomplete"
      default:
        return "incomplete"
    }
  }

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
      const newDeliverablesOrder = form.getValues("deliverables") || []
      const reorderedDeliverables = reassignPositions(newDeliverablesOrder)
      form.setValue("deliverables", reorderedDeliverables, { shouldDirty: true })
      if (form.getValues("paymentStructure") === "deliverablePayment") {
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
    <div className="min-h-screen">
      <div className=" mx-auto">
        <Form {...form}>
          <form>
            {/* The full form JSX from project-form.tsx should be here. It is omitted for brevity. */}
         {/* Accordion Sections */}
            <div className="space-y-4">
                {/* Customer Selection */}
                <Card>
                  <Collapsible open={openSections.customer} onOpenChange={() => toggleSection("customer")}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex items-center gap-3">
                              {getSectionIcon("customer")}
                              <CardTitle
                                className={`text-sm md:text-lg ${getSectionStatus("customer") === "complete" ? "text-primary" : ""}`}
                              >
                                Customer Selection
                              </CardTitle>
                              {getSectionStatus("customer") === "complete" && (
                                <CheckCircle className="h-5 w-5 text-green-500 hidden md:block" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 md:hidden">
                              {getSectionStatus("customer") === "complete" && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {getSectionStatus("customer") === "complete" ? (
                                <span className="text-xs font-medium text-green-600">Completed</span>
                              ) : (
                                <span className="text-xs font-medium text-yellow-600">Incomplete</span>
                              )}
                              {projectType === "personal" && (
                                <Badge
                                  variant="secondary"
                                  className={getSectionStatus("customer") === "complete" 
                                    ? "bg-purple-600 text-white" 
                                    : "bg-purple-100 text-purple-800"
                                  }
                                >
                                  Personal Project
                                </Badge>
                              )}
                              {projectType === "customer" && selectedCustomer && (
                                <Badge
                                  variant="secondary"
                                  className={getSectionStatus("customer") === "complete" 
                                    ? "bg-purple-600 text-white" 
                                    : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {selectedCustomer.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSectionStatus("customer") === "complete" ? (
                              <span className="text-sm font-medium text-green-600 hidden md:block">Completed</span>
                            ) : (
                              <span className="text-sm font-medium text-yellow-600 hidden md:block">Incomplete</span>
                            )}
                            {projectType === "personal" && (
                              <Badge
                                variant="secondary"
                                className={`hidden md:block ${getSectionStatus("customer") === "complete" 
                                  ? "bg-purple-600 text-white" 
                                  : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                Personal Project
                              </Badge>
                            )}
                            {projectType === "customer" && selectedCustomer && (
                              <Badge
                                variant="secondary"
                                className={`hidden md:block ${getSectionStatus("customer") === "complete" 
                                  ? "bg-purple-600 text-white" 
                                  : "bg-yellow-100 text-yellow-800"
                                }`}
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
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={(value) => {
                                      field.onChange(value)
                                      if (value === "personal") {
                                        form.setValue("currencyEnabled", false)
                                        form.setValue("paymentStructure", "noPayment")
                                        form.setValue("hasServiceAgreement", false)
                                      } else {
                                        // Revert to a sensible default for customer projects
                                        form.setValue("paymentStructure", "milestonePayment")
                                      }
                                    }}
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
                              name="customerId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Select Customer</FormLabel>
                                  <FormControl>
                                    <Sheet
                                      open={isCreateCustomerSheetOpen}
                                      onOpenChange={setCreateCustomerSheetOpen}
                                    >
                                      <ComboBox
                                        items={customers.map((c) => ({
                                          ...c,
                                          value: c.id,
                                          label: c.name,
                                          searchValue: `${c.name} ${c.email || ""}`,
                                        }))}
                                        value={field.value ?? null}
                                        onValueChange={(customerId) => {
                                          field.onChange(customerId || null)
                                        }}
                                        placeholder="Select customer..."
                                        searchPlaceholder="Search by name, company, or email..."
                                        emptyMessage="No customer found."
                                        onCreate={{
                                          label: "Create customer",
                                          action: () => setCreateCustomerSheetOpen(true),
                                        }}
                                        itemRenderer={(item) => (
                                          <div className="flex items-center justify-between w-full">
                                            <div>
                                              <div className="font-medium">{item.label}</div>
                                              <div className="text-sm text-muted-foreground">
                                                {item.email}
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
                                      <SheetContent withGap={true} bounce="right" className="flex flex-col w-full sm:w-3/4 md:w-1/2 lg:w-[40%]">
                                        <SheetHeader>
                                          <SheetTitle>New Customer</SheetTitle>
                                          <SheetDescription>
                                            Fill in the details below to create a new customer. This customer will be
                                            available for future projects.
                                          </SheetDescription>
                                        </SheetHeader>
                                        <div className="flex-grow overflow-y-auto py-4 pr-4">
                                          <CustomerForm
                                            onSuccess={handleCustomerCreated}
                                            onLoadingChange={setIsSubmittingCustomer}
                                          />
                                        </div>
                                        <SheetFooter>
                                          <Button
                                            variant="ghost"
                                            onClick={() => setCreateCustomerSheetOpen(false)}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            type="submit"
                                            form="customer-form"
                                            disabled={isSubmittingCustomer}
                                          >
                                            {isSubmittingCustomer ? (
                                              <>
                                                <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.8s]" />
                                                Creating customer...
                                              </>
                                            ) : (
                                              "Create Customer"
                                            )}
                                          </Button>
                                        </SheetFooter>
                                      </SheetContent>
                                    </Sheet>
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
                                        value={field.value ?? null}
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
                      <CardHeader className="cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex items-center gap-3">
                              {getSectionIcon("project")}
                              <CardTitle
                                className={`text-sm md:text-lg ${getSectionStatus("project") === "complete" ? "text-primary" : ""}`}
                              >
                                Project Details
                              </CardTitle>
                              {getSectionStatus("project") === "complete" && (
                                <CheckCircle className="h-5 w-5 text-green-500 hidden md:block" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 md:hidden">
                              {getSectionStatus("project") === "complete" && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {getSectionStatus("project") === "complete" ? (
                                <span className="text-xs font-medium text-green-600">Completed</span>
                              ) : (
                                <span className="text-xs font-medium text-yellow-600">Incomplete</span>
                              )}
                              {projectName && (
                                <Badge
                                  variant="secondary"
                                  className={getSectionStatus("project") === "complete" 
                                    ? "bg-purple-600 text-white" 
                                    : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {projectName}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSectionStatus("project") === "complete" ? (
                              <span className="text-sm font-medium text-green-600 hidden md:block">Completed</span>
                            ) : (
                              <span className="text-sm font-medium text-yellow-600 hidden md:block">Incomplete</span>
                            )}
                            {projectName && (
                              <Badge
                                variant="secondary"
                                className={`hidden md:block ${getSectionStatus("project") === "complete" 
                                  ? "bg-purple-600 text-white" 
                                  : "bg-yellow-100 text-yellow-800"
                                }`}
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
                        <CardHeader className="cursor-pointer transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                              <div className="flex items-center gap-3">
                                {getSectionIcon("budget")}
                                <CardTitle
                                  className={`text-sm md:text-lg ${getSectionStatus("budget") === "complete" ? "text-primary" : ""}`}
                                >
                                  Project Budget
                                </CardTitle>
                                {getSectionStatus("budget") === "complete" && (
                                  <CheckCircle className="h-5 w-5 text-green-500 hidden md:block" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 md:hidden">
                                {getSectionStatus("budget") === "complete" && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                                {getSectionStatus("budget") === "complete" ? (
                                  <span className="text-xs font-medium text-green-600">Completed</span>
                                ) : (
                                  <span className="text-xs font-medium text-yellow-600">Incomplete</span>
                                )}
                                {(budget || 0) > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className={getSectionStatus("budget") === "complete" 
                                      ? "bg-purple-600 text-white" 
                                      : "bg-yellow-100 text-yellow-800"
                                    }
                                  >
                                    {currencyEnabled ? selectedCurrency : "$"} {(budget || 0).toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getSectionStatus("budget") === "complete" ? (
                                <span className="text-sm font-medium text-green-600 hidden md:block">Completed</span>
                              ) : (
                                <span className="text-sm font-medium text-yellow-600 hidden md:block">Incomplete</span>
                              )}
                              {(budget || 0) > 0 && (
                                <Badge
                                  variant="secondary"
                                  className={`hidden md:block ${getSectionStatus("budget") === "complete" 
                                    ? "bg-purple-600 text-white" 
                                    : "bg-yellow-100 text-yellow-800"
                                  }`}
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
                                            amount: calculateAmountFromPercentage(milestone.percentage || 0),
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
                                  <p className="text-sm  mt-1">
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
                      <CardHeader className="cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex items-center gap-3">
                              {getSectionIcon("deliverables")}
                              <CardTitle
                                className={`text-sm md:text-lg ${getSectionStatus("deliverables") === "complete" ? "text-primary" : ""}`}
                              >
                                Deliverables
                              </CardTitle>
                              {getSectionStatus("deliverables") === "complete" && (
                                <CheckCircle className="h-5 w-5 text-green-500 hidden md:block" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 md:hidden">
                              {getSectionStatus("deliverables") === "complete" && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {getSectionStatus("deliverables") === "complete" ? (
                                <span className="text-xs font-medium text-green-600">Completed</span>
                              ) : (
                                <span className="text-xs font-medium text-yellow-600">Incomplete</span>
                              )}
                              {!deliverablesEnabled && (
                                <Badge
                                  variant="secondary"
                                  className="bg-gray-100 text-gray-800"
                                >
                                  Disabled
                                </Badge>
                              )}
                              {deliverablesEnabled && (
                                <Badge
                                  variant="secondary"
                                  className={getSectionStatus("deliverables") === "complete" 
                                    ? "bg-purple-600 text-white" 
                                    : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {(deliverables || []).length} items
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSectionStatus("deliverables") === "complete" ? (
                              <span className="text-sm font-medium text-green-600 hidden md:block">Completed</span>
                            ) : (
                              <span className="text-sm font-medium text-yellow-600 hidden md:block">Incomplete</span>
                            )}
                            {!deliverablesEnabled && (
                              <Badge
                                variant="secondary"
                                className="hidden md:block bg-gray-100 text-gray-800"
                              >
                                Disabled
                              </Badge>
                            )}
                            {deliverablesEnabled && (
                              <Badge
                                variant="secondary"
                                className={`hidden md:block ${getSectionStatus("deliverables") === "complete" 
                                  ? "bg-purple-600 text-white" 
                                  : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {(deliverables || []).length} items
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
                                      : " scale-100 transform"
                                  }`}
                                >
                                  Enable Deliverables
                                </FormLabel>
                              </FormItem>
                            )}
                          />

                          {deliverablesEnabled && (
                            <>
                              <div className="bg-bexoni/10 dark:bg-bexoni/20 p-3 mb-4">
                                <p className="text-sm text-primary">
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
                                      className={`border p-4 transition-all duration-200 ${
                                        draggedItem === deliverable.id ? "opacity-50 scale-95" : ""
                                      } ${dragOverItem === deliverable.id ? "border-blue-500 bg-blue-50" : ""} ${
                                        deliverablesEnabled ? "cursor-move" : ""
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-3">
                                        <GripVertical
                                          className={`h-4 w-4 ${
                                            deliverablesEnabled ? "text-primary hover:text-gray-600" : "text-bexoni/60"
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
                                        {(deliverables || []).length > 1 && (
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
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        )}
                                      </div>
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
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
                              <Button type="button" onClick={addDeliverable} className="w-full">
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
                      <CardHeader className="cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex items-center gap-3">
                              {getSectionIcon("payment")}
                              <CardTitle
                                className={`text-sm md:text-lg ${getSectionStatus("payment") === "complete" ? "text-primary" : ""}`}
                              >
                                Payment Structure
                              </CardTitle>
                              {getSectionStatus("payment") === "complete" && (
                                <CheckCircle className="h-5 w-5 text-green-500 hidden md:block" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 md:hidden">
                              {getSectionStatus("payment") === "complete" && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {getSectionStatus("payment") === "complete" ? (
                                <span className="text-xs font-medium text-green-600">Completed</span>
                              ) : (
                                <span className="text-xs font-medium text-yellow-600">Incomplete</span>
                              )}
                              <Badge
                                variant="secondary"
                                className={getSectionStatus("payment") === "complete" 
                                  ? "bg-purple-600 text-white" 
                                  : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {paymentStructure === "noPayment" ? "No Payment" : `${getTotalPercentage()}%`}
                              </Badge>
                              {projectType === "customer" && (budget || 0) > 0 && (
                                <Badge
                                  variant="outline"
                                  className={getSectionStatus("payment") === "complete" 
                                    ? "border-purple-600 text-purple-600" 
                                    : "border-yellow-600 text-yellow-600"
                                  }
                                >
                                  {currencyEnabled ? selectedCurrency : "$"} {getTotalAmount().toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSectionStatus("payment") === "complete" ? (
                              <span className="text-sm font-medium text-green-600 hidden md:block">Completed</span>
                            ) : (
                              <span className="text-sm font-medium text-yellow-600 hidden md:block">Incomplete</span>
                            )}
                            <Badge
                              variant="secondary"
                              className={`hidden md:block ${getSectionStatus("payment") === "complete" 
                                ? "bg-purple-600 text-white" 
                                : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {paymentStructure === "noPayment" ? "No Payment" : `${getTotalPercentage()}%`}
                            </Badge>
                            {projectType === "customer" && (budget || 0) > 0 && (
                              <Badge
                                variant="outline"
                                className={`hidden md:block ${getSectionStatus("payment") === "complete" 
                                  ? "border-purple-600 text-purple-600" 
                                  : "border-yellow-600 text-yellow-600"
                                }`}
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
                                      disabled={projectType === "personal"}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="noPayment">No payment required</SelectItem>
                                        <SelectItem value="milestonePayment">Milestone-based payments</SelectItem>
                                        {deliverablesEnabled && (
                                          <SelectItem value="deliverablePayment">Deliverable-based payments</SelectItem>
                                        )}
                                        <SelectItem value="fullDownPayment">Full payment upfront</SelectItem>
                                        <SelectItem value="paymentOnCompletion">Payment on completion</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          {paymentStructure === "milestonePayment" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Payment Milestones</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getTotalPercentage() === 100 ? "default" : "destructive"}>
                                    Total: {getTotalPercentage()}%
                                  </Badge>
                                  {projectType === "customer" && (budget || 0) > 0 && (
                                    <Badge variant="outline">
                                      {currencyEnabled ? selectedCurrency : "$"} {getTotalAmount().toLocaleString()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {milestoneFields.map((milestone, index) => (
                                <div key={milestone.id} className="border p-4 ">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="font-medium">Milestone {index + 1}</span>
                                    {(paymentMilestones || []).length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePaymentMilestone(index)}
                                        className="ml-auto"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    )}
                                  </div>
                                  <div
                                    className={`grid grid-cols-1 ${
                                      projectType === "customer" && (budget || 0) > 0 ? "md:grid-cols-4" : "md:grid-cols-3"
                                    } gap-3 items-end`}
                                  >
                                    <FormField
                                      control={form.control}
                                      name={`paymentMilestones.${index}.name`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Name</FormLabel>
                                          <FormControl>
                                            <Input {...field} value={field.value || ""} placeholder="Milestone name" />
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
                                    {projectType === "customer" && (budget || 0) > 0 && (
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
                                                onSelect={(date) => field.onChange(date)}
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
                              <Button type="button"  onClick={addPaymentMilestone} className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Milestone
                              </Button>
                            </div>
                          )}

                          {paymentStructure === "deliverablePayment" && deliverablesEnabled && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Deliverable-Based Payments</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getTotalPercentage() === 100 ? "default" : "destructive"}>
                                    Total: {getTotalPercentage()}%
                                  </Badge>
                                  {projectType === "customer" && (budget || 0) > 0 && (
                                    <Badge variant="outline">
                                      {currencyEnabled ? selectedCurrency : "$"} {getTotalAmount().toLocaleString()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="bg-bexoni/10 dark:bg-bexoni/20 p-4 mb-4">
                                <p className="text-sm text-primary">
                                  Payments are tied to your deliverables in order. Ensure percentages total 100%.
                                </p>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="mt-2 rounded-none"
                                  onClick={() => {
                                    // Redistribute percentages evenly
                                    const currentMilestones = form.getValues("paymentMilestones") || []
                                    if(currentMilestones.length === 0) return
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
                                    form.setValue("paymentMilestones", newMilestones)
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
                                  <div key={milestone.id} className="border p-4">
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
                                        projectType === "customer" && (budget || 0) > 0 ? "md:grid-cols-3" : "md:grid-cols-2"
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
                                      {projectType === "customer" && (budget || 0) > 0 && (
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
                                                  onSelect={(date) => field.onChange(date)}
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
                      <CardHeader className="cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex items-center gap-3">
                              {getSectionIcon("agreement")}
                              <CardTitle
                                className={`text-sm md:text-lg ${getSectionStatus("agreement") === "complete" ? "text-primary" : ""}`}
                              >
                                Service Agreement
                              </CardTitle>
                              {getSectionStatus("agreement") === "complete" && (
                                <CheckCircle className="h-5 w-5 text-green-500 hidden md:block" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 md:hidden">
                              {getSectionStatus("agreement") === "complete" && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {getSectionStatus("agreement") === "complete" ? (
                                <span className="text-xs font-medium text-green-600">Completed</span>
                              ) : (
                                <span className="text-xs font-medium text-yellow-600">Incomplete</span>
                              )}
                              <Badge
                                variant={serviceAgreementEnabled ? "default" : "secondary"}
                                className={
                                  serviceAgreementEnabled 
                                    ? getSectionStatus("agreement") === "complete" 
                                      ? "bg-purple-600 text-white" 
                                      : "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {serviceAgreementEnabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSectionStatus("agreement") === "complete" ? (
                              <span className="text-sm font-medium text-green-600 hidden md:block">Completed</span>
                            ) : (
                              <span className="text-sm font-medium text-yellow-600 hidden md:block">Incomplete</span>
                            )}
                            <Badge
                              variant={serviceAgreementEnabled ? "default" : "secondary"}
                              className={`hidden md:block ${
                                serviceAgreementEnabled 
                                  ? getSectionStatus("agreement") === "complete" 
                                    ? "bg-purple-600 text-white" 
                                    : "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
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
                                    disabled={projectType === "personal"}
                                  />
                                </FormControl>
                                <FormLabel
                                  htmlFor="serviceAgreement"
                                  className={`cursor-pointer transition-all duration-300 ease-in-out ${
                                    field.value
                                      ? "text-[#9948fb] font-medium scale-[1.1] transform"
                                      : "text-gray-700 scale-100 transform"
                                  } ${projectType === "personal" ? "cursor-not-allowed opacity-50" : ""}`}
                                >
                                  Enable Service Agreement
                                </FormLabel>
                              </FormItem>
                            )}
                          />

                          {serviceAgreementEnabled && projectType === "customer" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <FormField
                                  control={form.control}
                                  name="agreementTemplate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Agreement Template</FormLabel>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(value)

                                          const currentDate = format(new Date(), "PPP 'at' p z");
                                          const customerName = selectedCustomer?.name || "[Client Name]";
                                          const projectName = form.watch("name") || "[Project Name]";
                                          const projectDescription = form.watch("description") || "[Project Description]";
                                          const startDate = form.watch("startDate");
                                          const endDate = form.watch("endDate");
                                          const deliverables = form.watch("deliverables") || [];
                                          const deliverablesEnabled = form.watch("deliverablesEnabled");
                                          const paymentStructure = form.watch("paymentStructure");
                                          const paymentMilestones = form.watch("paymentMilestones") || [];
                                          const budget = form.watch("budget") || 0;
                                          const currency = form.watch("currencyEnabled") ? form.watch("currency") : "$";
                                          let newContent = "";
                                          
                                          const deliverablesList = deliverablesEnabled && deliverables.length > 0
                                            ? deliverables.map(d => `<li><strong>${d.name || 'Untitled Deliverable'}:</strong> ${d.description || 'No description.'} (Due: ${d.dueDate ? format(new Date(d.dueDate), 'PPP') : 'Not set'})</li>`).join('')
                                            : '<li>No deliverables have been specified for this project.</li>';
                                            
                                          let paymentTermsSection = '';
                                          switch (paymentStructure) {
                                            case 'fullDownPayment':
                                              paymentTermsSection = `<p>Full payment of ${currency}${budget.toLocaleString()} is due upon the signing of this Agreement.</p>`;
                                              break;
                                            case 'paymentOnCompletion':
                                              paymentTermsSection = `<p>Full payment of ${currency}${budget.toLocaleString()} is due upon successful completion and delivery of all project deliverables.</p>`;
                                              break;
                                            case 'milestonePayment':
                                            case 'deliverablePayment':
                                              const milestonesList = paymentMilestones.length > 0
                                                ? paymentMilestones.map(m => `<li><strong>${m.name || 'Untitled Milestone'}:</strong> ${m.percentage}% of the total budget (${currency}${m.amount?.toLocaleString() || 'N/A'}) is due on or before ${m.dueDate ? format(new Date(m.dueDate), 'PPP') : 'Not set'}.</li>`).join('')
                                                : '<li>No payment milestones have been specified.</li>';
                                              paymentTermsSection = `
                                                <p>Payment will be made according to the following milestones, based on a total project budget of ${currency}${budget.toLocaleString()}:</p>
                                                <ul>${milestonesList}</ul>`;
                                              break;
                                            default: // 'noPayment' or other cases
                                              paymentTermsSection = '<p>No payment is required for this project.</p>';
                                              break;
                                          }

                                          const signatureBlock = `
                                            <h3>10. Signatures</h3>
                                            <p>IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.</p>
                                            <table style="width: 100%; border-collapse: collapse; margin-top: 2rem;">
                                              <tbody>
                                                <tr>
                                                  <td style="width: 50%; vertical-align: top; padding-right: 1rem;">
                                                    <p><strong>The Client:</strong> ${customerName}</p>
                                                    <p style="margin-top: 2rem;"><strong>Date:</strong> ____________________</p>
                                                    <p style="margin-top: 2rem;"><strong>Signature:</strong> ____________________</p>
                                                  </td>
                                                  <td style="width: 50%; vertical-align: top; padding-left: 1rem;">
                                                    <p><strong>The Provider:</strong> [Your Company Name]</p>
                                                    <p style="margin-top: 2rem;"><strong>Date:</strong> ${currentDate}</p>
                                                    <p style="margin-top: 2rem;"><strong>Signature:</strong> ____________________</p>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>`;

                                          switch (value) {
                                            case "standard":
                                              newContent = `
                                                <h2>Standard Service Agreement</h2>
                                                <p>This Service Agreement ("Agreement") is made and entered into as of ${currentDate} ("Effective Date"), by and between <strong>[Your Company Name]</strong> ("Provider") and <strong>${customerName}</strong> ("Client").</p>
                                                <h3>1. Services</h3><p>Provider agrees to perform services ("Services") for the project known as <strong>${projectName}</strong>, described as: ${projectDescription}.</p>
                                                <h3>2. Project Deliverables</h3><p>The Provider will deliver the following items:</p><ul>${deliverablesList}</ul>
                                                <h3>3. Term of Agreement</h3><p>This Agreement will begin on ${startDate ? format(new Date(startDate), "PPP") : 'the Effective Date'} and will continue until ${endDate ? format(new Date(endDate), "PPP") : 'the completion of the Services'}, unless terminated earlier.</p>
                                                <h3>4. Payment Terms</h3>${paymentTermsSection}
                                                <h3>5. Confidentiality</h3><p>Each party agrees to keep confidential all non-public information obtained from the other party.</p>
                                                <h3>6. Ownership of Work Product</h3><p>Upon full payment, the Client will own all rights to the final deliverables. The Provider retains the right to use the work for portfolio purposes.</p>
                                                <h3>7. Independent Contractor</h3><p>The Provider is an independent contractor, not an employee of the Client.</p>
                                                <h3>8. Termination</h3><p>Either party may terminate this Agreement with 30 days written notice. The Client agrees to pay for all Services performed up to the date of termination.</p>
                                                <h3>9. Governing Law</h3><p>This Agreement shall be governed by the laws of [Your State/Jurisdiction].</p>
                                                ${signatureBlock}`;
                                              break;
                                            case "consulting":
                                              newContent = `
                                                <h2>Consulting Agreement</h2>
                                                <p>This Consulting Agreement ("Agreement") is effective ${currentDate} ("Effective Date"), between <strong>[Your Company Name]</strong> ("Consultant") and <strong>${customerName}</strong> ("Client").</p>
                                                <h3>1. Consulting Services</h3><p>Consultant will provide strategic advice and expertise for the project: <strong>${projectName}</strong>. The objective is: ${projectDescription}.</p>
                                                <h3>2. Key Activities & Reports</h3><p>Consulting activities will include:</p><ul>${deliverablesList}</ul>
                                                <h3>3. Term</h3><p>The consulting period shall commence on ${startDate ? format(new Date(startDate), "PPP") : 'the Effective Date'} ${endDate ? `and conclude on ${format(new Date(endDate), "PPP")}` : 'and continue until terminated'}.</p>
                                                <h3>4. Fees and Payment</h3>${paymentTermsSection}
                                                <h3>5. Client Responsibilities</h3><p>The Client agrees to provide timely access to necessary personnel and documentation required for the Consultant to perform the services.</p>
                                                <h3>6. Confidential Information</h3><p>Both parties agree to protect and not disclose any confidential information received during the term of this engagement.</p>
                                                <h3>7. Status of Consultant</h3><p>The Consultant is an independent contractor. Nothing in this Agreement shall be construed as creating an employer-employee relationship.</p>
                                                <h3>8. Limitation of Liability</h3><p>The Consultant's liability shall be limited to the total fees paid under this Agreement.</p>
                                                <h3>9. Termination</h3><p>This Agreement may be terminated by either party upon 14 days written notice.</p>
                                                ${signatureBlock}`;
                                              break;
                                            case "development":
                                              newContent = `
                                                <h2>Software Development Agreement</h2>
                                                <p>This Software Development Agreement ("Agreement") is entered into on ${currentDate} ("Effective Date") by <strong>[Your Company Name]</strong> ("Developer") and <strong>${customerName}</strong> ("Client").</p>
                                                <h3>1. Development Services</h3><p>Developer will design, develop, and test the software for the project <strong>${projectName}</strong>, with the goal of: ${projectDescription}.</p>
                                                <h3>2. Technical Specifications & Deliverables</h3><p>The software will be developed according to the following specifications:</p><ul>${deliverablesList}</ul>
                                                <h3>3. Project Timeline</h3><p>The project will commence on ${startDate ? format(new Date(startDate), "PPP") : 'the Effective Date'}. ${endDate ? `The target completion date is ${format(new Date(endDate), "PPP")}.` : 'A completion date has not been set.'}</p>
                                                <h3>4. Compensation</h3>${paymentTermsSection}
                                                <h3>5. Acceptance Testing</h3><p>The Client shall have 14 days following delivery to test the software. The software will be deemed accepted if no material defects are reported within this period.</p>
                                                <h3>6. Intellectual Property Rights</h3><p>Upon full and final payment, the Developer grants the Client a perpetual, worldwide license to use the developed software. The Developer retains ownership of all pre-existing code and tools used in the project.</p>
                                                <h3>7. Confidentiality</h3><p>Both parties agree to hold each other's proprietary information in strict confidence.</p>
                                                <h3>8. Warranties</h3><p>The Developer warrants that the software will be free from material defects for a period of 90 days following acceptance.</p>
                                                <h3>9. General Provisions</h3><p>This agreement constitutes the entire understanding between the parties and is governed by the laws of [Your State/Jurisdiction].</p>
                                                ${signatureBlock}`;
                                              break;
                                            case "custom":
                                              newContent = `
                                                <h2>Custom Agreement</h2>
                                                <p>This Agreement is made on ${currentDate} between <strong>[Your Company Name]</strong> and <strong>${customerName}</strong>.</p>
                                                <p><em>Please use this space to create a custom agreement tailored to your project's unique needs.</em></p>
                                                ${signatureBlock}`;
                                              break;
                                          }
                                          form.setValue("serviceAgreement", newContent)
                                        }}
                                        defaultValue={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Select a template" />
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
                                <Button type="button" variant="outlinebrimary" onClick={() => setIsEditingAgreement(!isEditingAgreement)}>
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
                                        <TipTapEditor content={field.value || ""} onChange={field.onChange} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ) 
                              : (
                                <div>
                                  <Label>Agreement Content</Label>
                                  <div
                                    className="prose prose-sm max-w-none  border border-primary p-4 line-clamp-5"
                                    dangerouslySetInnerHTML={{ __html: form.getValues("serviceAgreement") || "" }}
                                  />
                                </div>
                              )}

                              <FormField
                                control={form.control}
                                name="hasAgreedToTerms"
                                render={({ field }) => (
                                  <FormItem className=" bg-bexoni/10 dark:bg-bexoni/20 p-4">
                                    <div className="flex items-center space-x-2">
                                      <FormControl>
                                        <Checkbox
                                          id="agreeTerms"
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          variant="agreement"
                                        />
                                      </FormControl>
                                      <Label htmlFor="agreeTerms" className="text-sm text-primary">
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

        <div className="mt-8 flex justify-center gap-2 sm:gap-4">
          <Button variant="outlinebrimary" onClick={() => handleUpdate(false)} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>

          <div className="inline-flex rounded-md shadow-sm">
            <Button
              onClick={() => handleUpdate(false)}
              disabled={!isFormValid() || isSaving}
              className="rounded-r-none px-3 sm:px-4"
            >
              {isSaving ? "Updating..." : "Update Project"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={!isFormValid() || isSaving}
                  className="rounded-l-none border-l border-purple-700 px-3"
                >
                  <span className="sr-only">Open options</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleUpdate(false)}>Update Project</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleUpdate(true)}
                  disabled={projectType !== "customer" || !selectedCustomer}
                >
                  Update & Resend to Customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}