"use client"

import React, { useState, useEffect }  from 'react';
import axios from 'axios';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addDays, isBefore, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import ComboBox from "@/components/combobox";
import ConfirmModal from "@/components/modal/confirm-modal";
import SuccessConfirmModal from "@/components/modal/success-confirm-modal";
import {
  Plus,
  Eye,
  Send,
  Trash2,
  GripVertical,
  MessageSquare,
  CheckSquare,
  Type,
  Star,
  ChevronDown,
  Hash,
  LayoutTemplateIcon as Template,
  Settings,
  Layers,
  Grid3X3,
  Edit3,
  Save,
  Menu,
  CheckCircle,
  Clock,
  Bell,
  Bubbles,
} from "lucide-react";

// Interfaces for editing existing feedback
interface FeedbackQuestion {
    id: string
    type: "yes_no" | "multiple_choice" | "text" | "rating" | "dropdown" | "number"
    text: string
    options?: string[]
    required: boolean
    answer?: string | null // This is the key difference - existing feedback can have answers
}

interface FeedbackAnswer {
    questionId: string
    answer: string
}

interface ExistingFeedback {
    id: string
    name: string
    questions: any[] // Raw from DB
    answers?: FeedbackAnswer[]
    state: string
    recepientEmail?: string
    recepientName?: string
    customerId?: string
    projectId?: string
    dueDate?: string
    message?: string
    token?: string
    created_at: string
    customer?: {
        id: string
        name: string
        email: string
    }
}

// Interfaces for templates (no answers)
interface TemplateQuestion {
    id: string
    type: "yes_no" | "multiple_choice" | "text" | "rating" | "dropdown" | "number"
    text: string
    options?: string[]
    required: boolean
}
  
interface FormTemplate {
    id: string
    name: string
    questions: TemplateQuestion[]
    isDefault?: boolean
    questionCount?: number
    isOwner?: boolean
}

interface Customer {
    id: string
    name: string
    email: string
}

interface Project {
    id: string
    name: string
    customerName?: string
}
  
const questionTypes = [
  { id: "yes_no", label: "Yes/No", icon: CheckSquare, color: "bg-green-600" },
  { id: "multiple_choice", label: "Multiple Choice", icon: MessageSquare, color: "bg-blue-600" },
  { id: "text", label: "Text", icon: Type, color: "bg-yellow-600" },
  { id: "rating", label: "Rating (1-5)", icon: Star, color: "bg-orange-600" },
  { id: "dropdown", label: "Dropdown", icon: ChevronDown, color: "bg-indigo-600" },
  { id: "number", label: "Number", icon: Hash, color: "bg-red-600" },
]

interface Props {
  feedbackId: string
}

export default function EditFeedbackBuilder({ feedbackId }: Props) {
      // Form state - using FeedbackQuestion which can have answers
      const [currentForm, setCurrentForm] = useState<FeedbackQuestion[]>([])
      const [formName, setFormName] = useState("")
      const [editingQuestion, setEditingQuestion] = useState<string>("")
      
      // Data from API
      const [templates, setTemplates] = useState<FormTemplate[]>([])
      const [customers, setCustomers] = useState<Customer[]>([])
      const [projects, setProjects] = useState<Project[]>([])
      const [loading, setLoading] = useState(true)
      const [feedbackData, setFeedbackData] = useState<ExistingFeedback | null>(null)
      
      // Dialog states
      const [showPreview, setShowPreview] = useState(false)
      const [showSendDialog, setShowSendDialog] = useState(false)
      const [showReminderModal, setShowReminderModal] = useState(false)
      
      // Send form state
      const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
      const [selectedProject, setSelectedProject] = useState<string | null>(null)
      const [customEmail, setCustomEmail] = useState("")
      const [customName, setCustomName] = useState("")
      const [sendToCustomer, setSendToCustomer] = useState(false)
      const [attachToProject, setAttachToProject] = useState(false)
      const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
      const [message, setMessage] = useState("")
      const [showPastDueAlert, setShowPastDueAlert] = useState(false)
      
      // Loading states
      const [sendingFeedback, setSendingFeedback] = useState(false)
      const [updatingFeedback, setUpdatingFeedback] = useState(false)
  
      // Load data on component mount
      useEffect(() => {
          loadInitialData()
      }, [feedbackId])

      // Helper to check if form can be edited
      const canEditForm = () => {
          return feedbackData?.state !== 'completed' && feedbackData?.state !== 'cancelled'
      }

      // Helper to check if can send reminder
      const canSendReminder = () => {
          return feedbackData?.state === 'overdue'
      }

      // Helper to get update button text
      const getUpdateButtonText = () => {
          if (updatingFeedback) return 'Updating...'
          return 'Update'
      }

      // Helper to get status color matching the table
      const getStatusColor = (status: string) => {
          switch (status.toLowerCase()) {
              case "draft":
                  return "bg-blue-100 text-blue-800";
              case "sent":
                  return "bg-yellow-100 text-yellow-800";
              case "completed":
                  return "bg-green-100 text-green-800";
              case "overdue":
                  return "bg-red-100 text-red-800";
              default:
                  return "bg-gray-100 text-gray-800";
          }
      }

      // Helper to format answer display
      const formatAnswerDisplay = (question: FeedbackQuestion): string => {
          if (question.answer === null || question.answer === undefined) return '';
          
          switch (question.type) {
              case 'yes_no':
                  if (question.answer.toLowerCase() === 'true') return 'Yes';
                  if (question.answer.toLowerCase() === 'false') return 'No';
                  return question.answer;
              
              case 'multiple_choice':
                  try {
                      const answers = JSON.parse(question.answer);
                      if (Array.isArray(answers)) {
                          return answers.join(', ');
                      }
                      return question.answer;
                  } catch {
                      return question.answer;
                  }
              
              default:
                  return question.answer;
          }
      }

      // Helper to get state display text
      const getStateDisplayText = (state?: string): string => {
          if (!state) return 'Unknown';
          return state.charAt(0).toUpperCase() + state.slice(1);
      }
  
      const loadInitialData = async () => {
          try {
              setLoading(true)
              const [feedbackResponse, templatesResponse, customersResponse, projectsResponse] = await Promise.all([
                  axios.get(`/api/feedback/${feedbackId}`),
                  axios.get('/api/feedback'),
                  axios.get('/api/customers'),
                  axios.get('/api/projects')
              ])
  
              if (feedbackResponse.data.success) {
                  const feedback: ExistingFeedback = feedbackResponse.data.project
                  setFeedbackData(feedback)
                  setFormName(feedback.name || '')
                  
                  // Transform questions and add answers
                  const transformedQuestions: FeedbackQuestion[] = feedback.questions.map((q: any) => {
                      const baseQuestion = transformQuestionFromDB(q)
                      const answerObj = feedback.answers?.find((a: FeedbackAnswer) => a.questionId === q.id)
                      const answerValue = answerObj?.answer
                      return {
                          ...baseQuestion,
                          answer: (answerValue !== undefined && answerValue !== null) ? String(answerValue) : null
                      }
                  })
                  setCurrentForm(transformedQuestions)

                  // Set form fields from existing feedback
                  if (feedback.customerId) {
                      setSendToCustomer(true)
                      setSelectedCustomer(feedback.customerId)
                      setCustomEmail("")
                  } else if (feedback.recepientEmail) {
                      setSendToCustomer(false)
                      setCustomEmail(feedback.recepientEmail)
                      setSelectedCustomer(null)
                  }
                  
                  if (feedback.projectId) {
                      setAttachToProject(true)
                      setSelectedProject(feedback.projectId)
                  }

                  // Handle due date logic for editing
                  if (feedback.dueDate) {
                      const date = new Date(feedback.dueDate);
                      
                      // Check if the date is in the past and not today
                      if (isBefore(date, new Date()) && !isToday(date)) {
                          // Set to 3 days from current date and show alert
                          const newDueDate = addDays(new Date(), 3);
                          setDueDate(newDueDate);
                          setShowPastDueAlert(true);
                          
                          // Auto-hide alert after 5 seconds
                          setTimeout(() => setShowPastDueAlert(false), 5000);
                      } else {
                          setDueDate(date);
                          setShowPastDueAlert(false);
                      }
                  } else {
                      // No due date, set to 3 days from current date
                      const defaultDueDate = addDays(new Date(), 3);
                      setDueDate(defaultDueDate);
                      setShowPastDueAlert(false);
                  }

                  if (feedback.message) {
                      setMessage(feedback.message)
                  }

                  if (feedback.recepientName) {
                      setCustomName(feedback.recepientName)
                  }
              }
              
              if (templatesResponse.data.success) {
                  setTemplates(templatesResponse.data.templates)
              }
              
              if (customersResponse.data.success) {
                  setCustomers(customersResponse.data.customers.map((c: any) => ({
                      id: c.id,
                      name: c.name || 'Unnamed Customer',
                      email: c.email || ''
                  })))
              }
              
              if (projectsResponse.data.success) {
                  setProjects(projectsResponse.data.projects.map((p: any) => ({
                      id: p.id,
                      name: p.name || 'Unnamed Project',
                      customerName: p.customerName
                  })))
              }
          } catch (error) {
              console.error('Error loading initial data:', error)
              toast.error('Failed to load feedback data')
          } finally {
              setLoading(false)
          }
      }
  
      const addQuestion = (type: FeedbackQuestion["type"]) => {
          if (!canEditForm()) {
              toast.error('Cannot add questions to completed or cancelled feedback')
              return
          }
          const newQuestion: FeedbackQuestion = {
            id: Date.now().toString(),
            type,
            text: `New ${type.replace('_', ' ')} question`,
            options: type === "multiple_choice" || type === "dropdown" ? ["Option 1", "Option 2"] : undefined,
            required: false,
            answer: null
          }
          setCurrentForm([...currentForm, newQuestion])
          setEditingQuestion(newQuestion.id)
        }
      
        const updateQuestion = (id: string, updates: Partial<FeedbackQuestion>) => {
          if (!canEditForm()) {
              toast.error('Cannot edit questions in completed or cancelled feedback')
              return
          }
          setCurrentForm(currentForm.map((q) => (q.id === id ? { ...q, ...updates } : q)))
        }
      
        const deleteQuestion = (id: string) => {
          if (!canEditForm()) {
              toast.error('Cannot delete questions from completed or cancelled feedback')
              return
          }
          setCurrentForm(currentForm.filter((q) => q.id !== id))
          if (editingQuestion === id) {
            setEditingQuestion("")
          }
        }
  
      // Helper function to transform question data structure from DB
      const transformQuestionFromDB = (dbQuestion: any): Omit<FeedbackQuestion, 'answer'> => {
          return {
              id: dbQuestion.id,
              type: dbQuestion.type,
              text: dbQuestion.text,
              required: dbQuestion.required || false,
              options: dbQuestion.options?.choices || dbQuestion.options || undefined
          }
      }

      const handleSendFeedback = async () => {
          if (currentForm.length === 0) return
          
          const recipientEmail = sendToCustomer 
              ? customers.find(c => c.id === selectedCustomer)?.email 
              : customEmail
              
          if (!recipientEmail) {
              toast.error('No recipient email provided')
              return
          }
          
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(recipientEmail)) {
              toast.error('Invalid email address. Please provide a valid email format.')
              return
          }
          
          try {
              setSendingFeedback(true)
              
              const feedbackDataPayload = {
                  action: 'send_feedback', // Action to trigger send logic on backend
                  name: formName,
                  customerId: sendToCustomer ? selectedCustomer : null,
                  projectId: attachToProject ? selectedProject : null,
                  recipientEmail,
                  recepientName: sendToCustomer ? null : customName || null,
                  questions: currentForm.map(q => ({
                      id: q.id,
                      text: q.text,
                      type: q.type,
                      required: q.required,
                      ...(q.options && q.options.length > 0 && { 
                          options: { choices: q.options } 
                      })
                  })),
                  dueDate: dueDate || null,
                  message: message || undefined,
              }
              
              const response = await axios.patch(`/api/feedback/${feedbackId}`, feedbackDataPayload)
  
              if (response.data.success) {
                  toast.success('Feedback sent successfully!')
                  setShowSendDialog(false)
                  loadInitialData() // Reload to get new state and info
              }
          } catch (error) {
              console.error('Error sending feedback:', error)
              if (axios.isAxiosError(error)) {
                  const errorMessage = error.response?.data?.error || 'Failed to send feedback'
                  toast.error(errorMessage)
              } else {
                  toast.error('An unexpected error occurred.')
              }
          } finally {
              setSendingFeedback(false)
          }
      }

      // Update feedback function
      const handleUpdateFeedback = async () => {
          if (!canEditForm()) {
              toast.error('Cannot update completed or cancelled feedback')
              return
          }

          if (currentForm.length === 0) {
              toast.error('Cannot update feedback with no questions')
                  return
          }

          try {
              setUpdatingFeedback(true)
              
              const updateData = {
                name: formName,
                  customerId: sendToCustomer ? selectedCustomer : null,
                  projectId: attachToProject ? selectedProject : null,
                  recipientEmail: sendToCustomer ? 
                      customers.find(c => c.id === selectedCustomer)?.email || "" : 
                      customEmail || "",
                  recepientName: sendToCustomer ? null : customName || null,
                  questions: currentForm.map(q => ({
                      id: q.id,
                      text: q.text,
                      type: q.type,
                      required: q.required,
                      ...(q.options && q.options.length > 0 && { 
                          options: { choices: q.options } 
                      })
                  })),
                  dueDate: dueDate || null,
                  message: message || null,
              }
              
              const response = await axios.patch(`/api/feedback/${feedbackId}`, updateData)
  
              if (response.data.success) {
                  toast.success('Feedback updated successfully!')
                  // Reload the feedback data
                  loadInitialData()
              }
          } catch (error) {
              console.error('Error updating feedback:', error)
              
              if (axios.isAxiosError(error)) {
                  const errorMessage = error.response?.data?.error || 'Failed to update feedback'
                  toast.error(errorMessage)
              } else {
                  toast.error('An unexpected error occurred. Please try again.')
              }
          } finally {
              setUpdatingFeedback(false)
          }
        }
      
        const editingQuestionData = currentForm.find((q) => q.id === editingQuestion)
  
      // Prepare dropdown data
      const customerOptions = customers.map(customer => ({
          value: customer.id,
          label: `${customer.name} (${customer.email})`,
          searchValue: `${customer.name} ${customer.email}`
      }))
  
      const projectOptions = projects.map(project => ({
          value: project.id,
          label: project.customerName ? 
              `${project.name} - ${project.customerName}` : 
              project.name,
          searchValue: `${project.name} ${project.customerName || ''}`
      }))
      
        const renderPreviewQuestion = (question: FeedbackQuestion, index: number) => {
          return (
            <div key={question.id} className="space-y-3">
              <div className="flex items-start gap-2">
                <Label className="text-lg font-medium flex-1">
                  {index + 1}. {question.text}
                </Label>
                {question.required && (
                  <div className="flex items-center gap-1">
                    <span className="text-red-400 text-lg font-bold">*</span>
                    <span className="text-xs text-red-300 px-2 py-1 rounded">Required</span>
                  </div>
                )}
              </div>
      
              {/* Show answer if it exists, otherwise show input fields */}
              {question.answer ? (
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Answer:</span>
                  </div>
                  <p className="text-sm text-green-800">{formatAnswerDisplay(question)}</p>
                </div>
              ) : (
                <>
              {question.type === "yes_no" && (
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                        <input type="radio" name={`question-${question.id}`} className="text-primary" disabled />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-2">
                        <input type="radio" name={`question-${question.id}`} className="text-primary" disabled />
                    <span>No</span>
                  </label>
                </div>
              )}
      
              {question.type === "multiple_choice" && (
                <div className="space-y-3">
                  {question.options?.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`question-${question.id}-option-${optIndex}`}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            disabled
                      />
                      <Label 
                        htmlFor={`question-${question.id}-option-${optIndex}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
      
              {question.type === "text" && (
                    <Textarea placeholder="Your answer..." className="" disabled />
              )}
      
              {question.type === "rating" && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                        <button key={rating} className="p-2 rounded" disabled>
                          <Star className="h-6 w-6 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
      
              {question.type === "dropdown" && (
                    <Select disabled>
                      <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {question.options?.map((option, optIndex) => (
                      <SelectItem key={optIndex} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
      
              {question.type === "number" && (
                    <Input type="number" placeholder="Enter a number" disabled />
                  )}
                </>
              )}
            </div>
          )
        }
      
      if (loading) {
          return (
              <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                      <Bubbles className="h-12 w-12 text-primary mx-auto animate-spin [animation-duration:0.5s]" />
                      <p>Loading feedback builder...</p>
                  </div>
              </div>
          )
      }

  return (
    <div className="min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden p-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-primary" />
            <h1 className="text-base font-bold">Edit Form</h1>
            </div>
            <div className="flex gap-2">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="">
                    <Menu className="h-4 w-4" />
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                <SheetHeader>
                    <SheetTitle className="">Current Form & Question Types</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                    {/* Current Form Section */}
                    <div>
                    <h3 className="text-sm font-medium mb-3">Current Form</h3>
                    <Card className="border-purple-500">
                            <CardContent className="p-3">
                            <h5 className="font-medium text-sm">{formName}</h5>
                            <p className="text-xs">{currentForm.length} questions</p>
                            <Badge className={getStatusColor(feedbackData?.state || '')}>
                                {getStateDisplayText(feedbackData?.state)}
                            </Badge>
                                                        </CardContent>
                                                    </Card>
                                        </div>

                    {/* Question Types Section - only show if can edit */}
                    {canEditForm() && (
                    <div>
                    <h3 className="text-sm font-medium mb-3">Question Types</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {questionTypes.map((type) => {
                        const Icon = type.icon
                        return (
                            <Button
                            key={type.id}
                            variant="ghost"
                                onClick={() => addQuestion(type.id as FeedbackQuestion["type"])}
                            className="flex items-center justify-start p-3 h-auto transition-colors"
                            >
                            <div className={`p-1 rounded mr-3 ${type.color}`}>
                                                                <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm">{type.label}</span>
                            </Button>
                        )
                        })}
                    </div>
                    </div>
                    )}
                </div>
                </SheetContent>
            </Sheet>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(true)}
                className=""
            >
                <Eye className="h-4 w-4" />
            </Button>
            {canEditForm() && (
                <>
                <Button
                    size="sm"
                    onClick={handleUpdateFeedback}
                    disabled={updatingFeedback || currentForm.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {updatingFeedback ? (
                      <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s]" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                </Button>
                {canSendReminder() && (
                    <Button
                        size="sm"
                        onClick={() => setShowReminderModal(true)}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        <Bell className="h-4 w-4" />
                    </Button>
                )}
            <Button
                size="sm"
                onClick={() => setShowSendDialog(true)}
                    disabled={sendingFeedback || currentForm.length === 0}
                                className="bg-primary hover:bg-primary/80"
            >
                {sendingFeedback ? (
                  <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s]" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
            </Button>
                </>
            )}
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
                    <h1 className="text-lg font-bold">Edit Form</h1>
                </div>
                <Badge className={getStatusColor(feedbackData?.state || '')}>
                    {getStateDisplayText(feedbackData?.state)}
                    </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                {canEditForm() && (
                                    <Button 
                    onClick={handleUpdateFeedback}
                    disabled={updatingFeedback || currentForm.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                    >
                    {updatingFeedback ? (
                      <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {getUpdateButtonText()}
                </Button>
                )}
                {canSendReminder() && (
                <Button
                        onClick={() => setShowReminderModal(true)}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        <Bell className="h-4 w-4 mr-2" />
                        Remind
                </Button>
                )}
                <Button variant="ghost" onClick={() => setShowPreview(true)} className="">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                </Button>
                {canEditForm() && (
                <Button
                    onClick={() => setShowSendDialog(true)}
                                        disabled={sendingFeedback || currentForm.length === 0}
                                        className="bg-primary hover:bg-primary/80"
                >
                    {sendingFeedback ? (
                      <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                                        {sendingFeedback ? 'Sending...' : 'Send Form'}
                </Button>
                )}
                </div>
            </div>
            </CardHeader>
        </Card>

        {/* Mobile Form Name */}
        <div className="lg:hidden">
            <div className="flex items-center gap-2">
            <Input
                placeholder="Form Name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="flex-1"
                disabled={!canEditForm()}
            />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Current Form & Question Types (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-3 space-y-4">
                {/* Current Form Section */}
                <Card className="">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Current Form
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Card className="border-purple-500 bg-purple-50/10">
                        <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h5 className="font-medium text-sm text-left">{formName}</h5>
                                <p className="text-xs text-muted-foreground">{currentForm.length} questions</p>
                                <Badge className={getStatusColor(feedbackData?.state || '')}>
                                    {getStateDisplayText(feedbackData?.state)}
                                </Badge>
                            </div>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
                </Card>

                {/* Question Types Section - only show if can edit */}
                {canEditForm() && (
            <Card className="">
                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Question Types
                </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-1 gap-2">
                    {questionTypes.map((type) => {
                    const Icon = type.icon
                    return (
                        <Button
                        key={type.id}
                        variant="ghost"
                            onClick={() => addQuestion(type.id as FeedbackQuestion["type"])}
                                                    className="flex items-center justify-start p-3 h-auto hover:bg-primary/10 "
                        >
                        <div className={`p-1 rounded mr-3 ${type.color}`}>
                                <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm">{type.label}</span>
                        </Button>
                    )
                    })}
                </div>
                </CardContent>
            </Card>
                )}
            </div>

            {/* Center Column - Form Canvas */}
            <div className="lg:col-span-6">
                            <Card className="min-h-[400px] lg:min-h-[600px]">
                <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <CardTitle className="">Form Canvas</CardTitle>
                    <Input
                      placeholder="Form Name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="border-gray-600 w-full sm:w-64"
                      disabled={!canEditForm()}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(feedbackData?.state || '')}>
                      {getStateDisplayText(feedbackData?.state)}
                    </Badge>
                  </div>
                </div>
                </CardHeader>
                <CardContent>
                {currentForm.length === 0 ? (
                    <div className="flex items-center justify-center h-64 lg:h-96">
                    <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-lg mb-2">No questions in this form</p>
                        <p className="text-sm mb-4">Add questions to get started</p>
                    </div>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] lg:h-[500px]">
                    <div className="space-y-4 pr-4">
                        {currentForm.map((question, index) => {
                        const questionType = questionTypes.find((t) => t.id === question.type)
                        const Icon = questionType?.icon || MessageSquare
                        return (
                            <Card
                            key={question.id}
                            className={`cursor-pointer transition-all hover:border-purple-500 ${
                                editingQuestion === question.id ? "border-purple-500 shadow-lg shadow-purple-500/20" : ""
                            }`}
                            onClick={() => canEditForm() && setEditingQuestion(question.id)}
                            >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                                                            <span className="text-sm">#{index + 1}</span>
                                                                            <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div className={`p-1 rounded ${questionType?.color || ""}`}>
                                                                            <Icon className="h-4 w-4" />
                                    </div>
                                    <Badge variant="secondary" className="bg-primary/20 text-purple-300 text-xs">
                                    {questionType?.label}
                                    </Badge>
                                </div>
                                {canEditForm() && (
                                <div className="flex items-center gap-2">
                                    <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingQuestion(question.id)
                                    }}
                                    className=""
                                    >
                                    <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteQuestion(question.id)
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                    >
                                    <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                                                <p className="font-medium">{question.text}</p>
                                <div className="flex items-center gap-2 mt-2">
                                {question.required && (
                                    <Badge className="bg-orange-600/20 text-orange-300 text-xs">Required</Badge>
                                )}
                                {question.options && (
                                                                        <Badge variant="outline" className="text-xs">
                                    {question.options.length} options
                                  </Badge>
                                )}
                                </div>
                                {/* Show answer if available */}
                                <div className="mt-3">
                                  {question.answer ? (
                                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span className="text-sm text-green-800 font-medium">{formatAnswerDisplay(question)}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                      <Clock className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-600 italic">Awaiting response</span>
                                    </div>
                                  )}
                                </div>
                            </CardContent>
                            </Card>
                        )
                        })}
                    </div>
                    </ScrollArea>
                )}
                </CardContent>
            </Card>
            </div>

            {/* Right Column - Properties */}
            <div className="lg:col-span-3">
                            <Card className="lg:sticky lg:top-6">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Properties
                </CardTitle>
                </CardHeader>
                <CardContent>
                {editingQuestionData && canEditForm() ? (
                    <div className="space-y-4">
                    <div>
                                                <Label className="text-sm">Question</Label>
                        <Textarea
                                                    value={editingQuestionData.text}
                                                    onChange={(e) => updateQuestion(editingQuestionData.id, { text: e.target.value })}
                                                    className="mt-1"
                        rows={3}
                        />
                    </div>

                                            {(editingQuestionData.type === "multiple_choice" || editingQuestionData.type === "dropdown") && (
                        <div>
                                                    <Label className="text-sm">Options</Label>
                        <div className="space-y-2 mt-1">
                            {editingQuestionData.options?.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                value={option}
                                onChange={(e) => {
                                    const newOptions = [...(editingQuestionData.options || [])]
                                    newOptions[index] = e.target.value
                                    updateQuestion(editingQuestionData.id, { options: newOptions })
                                }}
                                                                    className="text-sm"
                                />
                                <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const newOptions = editingQuestionData.options?.filter((_, i) => i !== index)
                                    updateQuestion(editingQuestionData.id, { options: newOptions })
                                }}
                                className="text-red-400 hover:text-red-300"
                                >
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            ))}
                            <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const newOptions = [
                                ...(editingQuestionData.options || []),
                                `Option ${(editingQuestionData.options?.length || 0) + 1}`,
                                ]
                                updateQuestion(editingQuestionData.id, { options: newOptions })
                            }}
                            className="text-primary w-full text-sm"
                            >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Option
                            </Button>
                        </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <Switch
                        checked={editingQuestionData.required}
                        onCheckedChange={(checked) => updateQuestion(editingQuestionData.id, { required: checked })}
                        />
                                                <Label className="text-sm">Required</Label>
                    </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                    <Settings className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">
                        {!canEditForm() 
                            ? 'Form cannot be edited (completed or cancelled)'
                            : 'Select a question to edit its properties'
                        }
                    </p>
                    </div>
                )}
                </CardContent>
            </Card>
            </div>
        </div>

        {/* Mobile Action Buttons - only show if can edit */}
        {canEditForm() && (
        <div className="lg:hidden fixed bottom-4 right-4 flex flex-col gap-2">
            <Button
            variant="ghost"
                onClick={handleUpdateFeedback}
                disabled={updatingFeedback || currentForm.length === 0}
                className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
            {updatingFeedback ? (
              <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s]" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            </Button>
                {canSendReminder() && (
                    <Button
                        onClick={() => setShowReminderModal(true)}
                        className="shadow-lg bg-orange-600 hover:bg-orange-700"
                    >
                        <Bell className="h-4 w-4" />
                    </Button>
                )}
            <Sheet>
            <SheetTrigger asChild>
                <Button className="bg-primary shadow-lg">
                <Plus className="h-4 w-4" />
                </Button>
            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                <SheetTitle className="">Add Questions</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-full mt-6">
                <div className="grid grid-cols-2 gap-3 pb-20">
                    {questionTypes.map((type) => {
                    const Icon = type.icon
                    return (
                        <Card
                        key={type.id}
                        className="cursor-pointer transition-colors"
                            onClick={() => addQuestion(type.id as FeedbackQuestion["type"])}
                        >
                        <CardContent className="p-4 text-center">
                            <div className={`p-2 rounded mx-auto mb-2 w-fit ${type.color}`}>
                            <Icon className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium">{type.label}</span>
                        </CardContent>
                        </Card>
                    )
                    })}
                </div>
                </ScrollArea>
            </SheetContent>
            </Sheet>
        </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="">Form Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
                <div className="text-center">
                                    <h2 className="text-2xl font-bold mb-2">{formName || "Untitled Form"}</h2>
                <p className="">Please fill out the form below</p>
                </div>
                <div className="space-y-6">{currentForm.map(renderPreviewQuestion)}</div>
            </div>
            </DialogContent>
        </Dialog>

        {/* Reminder Modal */}
        <SuccessConfirmModal
            isOpen={showReminderModal}
            onClose={() => setShowReminderModal(false)}
            feedbackId={feedbackId}
            feedbackState={feedbackData?.state || ''}
            recipientEmail={feedbackData?.recepientEmail || ''}
        />

        {/* Send Form Dialog - only show if can edit */}
        {canEditForm() && (
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                        <DialogContent className="mx-4 max-w-lg">
            <DialogHeader>
                <DialogTitle className="">Send Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                {/* Customer Selection */}
                <div>
                <div className="flex items-center space-x-2 mb-2">
                    <Switch checked={sendToCustomer} onCheckedChange={setSendToCustomer} />
                                        <Label className="">Send to existing customer</Label>
                </div>
                {sendToCustomer ? (
                                        <ComboBox
                                            items={customerOptions}
                                            value={selectedCustomer}
                                            onValueChange={setSelectedCustomer}
                                            placeholder="Choose a customer"
                                            searchPlaceholder="Search customers..."
                                            emptyMessage="No customers found."
                                        />
                ) : (
                    <div className="space-y-2">
                    <Input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="recipient@example.com"
                        className=""
                    />
                    <Input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Recipient name (optional)"
                        className=""
                    />
                    </div>
                )}
                </div>

                {/* Project Selection */}
                <div>
                <div className="flex items-center space-x-2 mb-2">
                    <Switch checked={attachToProject} onCheckedChange={setAttachToProject} />
                                        <Label className="">Attach to project</Label>
                </div>
                {attachToProject && (
                                        <ComboBox
                                            items={projectOptions}
                                            value={selectedProject}
                                            onValueChange={setSelectedProject}
                                            placeholder="Choose a project"
                                            searchPlaceholder="Search projects..."
                                            emptyMessage="No projects found."
                                        />
                )}
                </div>

                                {/* Due Date */}
                                <div>
                                    <Label className="text-sm mb-2 block">Due Date (optional)</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dueDate && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <Calendar
                                          mode="single"
                                          selected={dueDate}
                                          onSelect={(date) => setDueDate(date || undefined)}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Leave blank to automatically set 3 days from send date
                                    </p>
                                    
                                    {/* Past due date alert */}
                                    {showPastDueAlert && (
                                        <Alert className="mt-2 border-orange-200 bg-orange-50">
                                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                                            <AlertDescription className="text-orange-800">
                                                The due date from the database was in the past. We've automatically set it to 3 days from today.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                {/* Message */}
                                <div>
                                    <Label className="text-sm mb-2 block">Message (optional)</Label>
                                    <Textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Additional message to include with the feedback request..."
                                        className=""
                                        rows={3}
                                    />
                                </div>

                <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setShowSendDialog(false)}>
                    Cancel
                </Button>


                <Button 
                    className="hover:bg-primary/80" 
                    disabled={sendingFeedback || (!selectedCustomer && !customEmail)}
                    onClick={handleSendFeedback}
                >
                        {sendingFeedback ? (
                          <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                        ) : null}
                        {sendingFeedback ? 'Sending...' : 'Send Form'}
                </Button>
                </div>
            </div>
            </DialogContent>
        </Dialog>
        )}
        </div>
    </div>
  )
}