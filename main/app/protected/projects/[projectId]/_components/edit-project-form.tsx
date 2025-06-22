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
            {/* Make sure to copy all the <Card> sections into this form. */}
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