"use client"

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from "sonner"; // Add this import for toast notifications
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
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import ComboBox from "@/components/combobox";
import ConfirmModal from "@/components/modal/confirm-modal";
import { useFeedbackBuilderData, FeedbackTemplate, FeedbackDraft } from "@/hooks/feedbacks/use-feedbacks";
import { useCustomers } from "@/hooks/customers/use-customers";
import { useProjects } from "@/hooks/projects/use-projects";
import { useQueryClient } from '@tanstack/react-query';
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
  Bubbles,
} from "lucide-react";

interface Question {
    id: string
    type: "yes_no" | "multiple_choice" | "text" | "rating" | "dropdown" | "number"
    text: string
    options?: string[]
    required: boolean
}
  
const questionTypes = [
  { id: "yes_no", label: "Yes/No", icon: CheckSquare, color: "bg-green-600" },
  { id: "multiple_choice", label: "Multiple Choice", icon: MessageSquare, color: "bg-blue-600" },
  { id: "text", label: "Text", icon: Type, color: "bg-yellow-600" },
  { id: "rating", label: "Rating (1-5)", icon: Star, color: "bg-orange-600" },
  { id: "dropdown", label: "Dropdown", icon: ChevronDown, color: "bg-indigo-600" },
  { id: "number", label: "Number", icon: Hash, color: "bg-red-600" },
]

type Props = {}

export default function FeedbackBuilder({}: Props) {
    // Query client for cache invalidation
    const queryClient = useQueryClient()
    
    // Form state
    const [currentForm, setCurrentForm] = useState<Question[]>([])
    const [formName, setFormName] = useState("")
    const [selectedTemplate, setSelectedTemplate] = useState<string>("")
    const [selectedDraft, setSelectedDraft] = useState<string>("")
    const [editingQuestion, setEditingQuestion] = useState<string>("")
    
    // Data from hooks - loads in parallel with caching
    const { templates, drafts, isLoading: builderDataLoading, isError: builderDataError } = useFeedbackBuilderData()
    const { data: customers = [], isLoading: customersLoading, error: customersError } = useCustomers()
    const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useProjects()
    
    // Combined loading state
    const loading = builderDataLoading || customersLoading || projectsLoading
    
    // Dialog states
    const [showPreview, setShowPreview] = useState(false)
    const [showSendDialog, setShowSendDialog] = useState(false)
    const [templateNameDialog, setTemplateNameDialog] = useState(false)
    const [templateName, setTemplateName] = useState("")
    const [showDraftDialog, setShowDraftDialog] = useState(false)
    const [draftName, setDraftName] = useState("")
    
    // Confirm modal states
    const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false)
    const [showDeleteDraftModal, setShowDeleteDraftModal] = useState(false)
    const [templateToDelete, setTemplateToDelete] = useState<string>("")
    const [draftToDelete, setDraftToDelete] = useState<string>("")
    
    // Send form state
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
    const [selectedProject, setSelectedProject] = useState<string | null>(null)
    const [customEmail, setCustomEmail] = useState("")
    const [customName, setCustomName] = useState("")
    const [sendToCustomer, setSendToCustomer] = useState(false)
    const [attachToProject, setAttachToProject] = useState(false)
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
    const [message, setMessage] = useState("")
    
    // Loading states
    const [sendingFeedback, setSendingFeedback] = useState(false)
    const [savingTemplate, setSavingTemplate] = useState(false)
    const [savingDraft, setSavingDraft] = useState(false)
    const [deletingTemplate, setDeletingTemplate] = useState(false)
    const [deletingDraft, setDeletingDraft] = useState(false)

    // Set default due date on component mount
    useEffect(() => {
        const defaultDueDate = addDays(new Date(), 3);
        setDueDate(defaultDueDate);
    }, []);

    const addQuestion = (type: Question["type"]) => {
        const newQuestion: Question = {
          id: Date.now().toString(),
          type,
          text: `New ${type.replace('_', ' ')} question`,
          options: type === "multiple_choice" || type === "dropdown" ? ["Option 1", "Option 2"] : undefined,
          required: false,
        }
        setCurrentForm([...currentForm, newQuestion])
        setEditingQuestion(newQuestion.id)
      }
    
    const updateQuestion = (id: string, updates: Partial<Question>) => {
      setCurrentForm(currentForm.map((q) => (q.id === id ? { ...q, ...updates } : q)))
    }
    
    const deleteQuestion = (id: string) => {
      setCurrentForm(currentForm.filter((q) => q.id !== id))
      if (editingQuestion === id) {
        setEditingQuestion("")
      }
    }

    // Helper function to transform question data structure from DB
    const transformQuestionFromDB = (dbQuestion: any): Question => {
        return {
            id: dbQuestion.id,
            type: dbQuestion.type,
            text: dbQuestion.text,
            required: dbQuestion.required || false,
            // Handle the options structure - DB stores as {choices: []} but we use flat array
            options: dbQuestion.options?.choices || dbQuestion.options || undefined
        }
    }
    
    const loadTemplate = (templateId: string) => {
        const template = (templates as FeedbackTemplate[]).find((t: FeedbackTemplate) => t.id === templateId)
        if (template) {
            // Transform questions from DB structure to frontend structure
            const transformedQuestions = template.questions.map(transformQuestionFromDB)
            setCurrentForm(transformedQuestions)
          setFormName(template.name)
          setSelectedTemplate(templateId)
            setSelectedDraft("") // Clear draft selection
        }
    }

    const loadDraft = (draftId: string) => {
        const draft = (drafts as FeedbackDraft[]).find((d: FeedbackDraft) => d.id === draftId)
        if (draft) {
            // Transform questions from DB structure to frontend structure
            const transformedQuestions = draft.questions.map(transformQuestionFromDB)
            setCurrentForm(transformedQuestions)
            setFormName(draft.name)
            setSelectedDraft(draftId)
            setSelectedTemplate("") // Clear template selection
            
            // Set form fields from draft
            if (draft.customerId) {
                setSendToCustomer(true)
                setSelectedCustomer(draft.customerId)
                setCustomEmail("") // Clear custom email when using customer
            } else if (draft.recipientEmail) {
                setSendToCustomer(false)
                setCustomEmail(draft.recipientEmail)
                setSelectedCustomer(null) // Clear customer when using custom email
            }
            
            if (draft.projectId) {
                setAttachToProject(true)
                setSelectedProject(draft.projectId)
            } else {
                setAttachToProject(false)
                setSelectedProject(null)
            }

            // Set due date if available
            if (draft.dueDate) {
                const date = new Date(draft.dueDate);
                setDueDate(date);
            } else {
                setDueDate(undefined);
            }
        }
    }
    
    const resetForm = () => {
        setCurrentForm([])
        setFormName("")
        setSelectedTemplate("")
        setSelectedDraft("")
        setEditingQuestion("")
        // Reset send form state
        setSelectedCustomer(null)
        setSelectedProject(null)
        setCustomEmail("")
        setCustomName("")
        setDueDate(undefined)
        setMessage("")
        setSendToCustomer(false)
        setAttachToProject(false)
    }

    // Helper function to determine the name to use
    const getFormName = (customName?: string) => {
        if (customName && customName.trim()) {
            return customName.trim();
        }
        if (formName && formName.trim()) {
            return formName.trim();
        }
        if (currentForm.length > 0 && currentForm[0].text) {
            return currentForm[0].text;
        }
        return 'Untitled Feedback';
    }

    // Helper function for button text - updated to be more descriptive
    const getQuickSaveButtonText = () => {
        if (savingDraft) return 'Saving...'
        if (isEditingExistingDraft()) return `Update: "${(drafts as FeedbackDraft[]).find((d: FeedbackDraft) => d.id === selectedDraft)?.name}"`
        if (formName.trim()) return `Quick Save: "${getFormName()}"`
        return 'Save Draft'
    }

    const isEditingExistingTemplate = () => {
        return selectedTemplate !== ""
    }

    const isEditingExistingDraft = () => {
        return selectedDraft !== ""
    }

    const handleSaveAsTemplate = async () => {
        if (currentForm.length === 0) return
        
        if (isEditingExistingTemplate()) {
            // Update existing template
            await updateTemplate()
        } else {
            // Create new template
            const nameToUse = formName.trim() || templateName.trim()
            if (!nameToUse) {
                setTemplateNameDialog(true)
                return
            }
            await saveTemplate(nameToUse)
        }
    }

    const saveTemplate = async (name: string) => {
        try {
            setSavingTemplate(true)
            const response = await axios.post('/api/feedback/create', {
                action: 'save_template',
                name,
                questions: currentForm.map(q => ({
                    id: q.id,
                    text: q.text,
                    type: q.type,
                    required: q.required,
                    options: q.options ? {
                        choices: q.options
                    } : undefined
                })),
                isDefault: false
            })

            if (response.data.success) {
                toast.success('Template saved successfully!')
                
                // Invalidate cache to trigger refetch
                queryClient.invalidateQueries({ queryKey: ['feedback-templates'] })
                
                setTemplateNameDialog(false)
                setTemplateName("")
                console.log('Template saved successfully')
            }
        } catch (error) {
            console.error('Error saving template:', error)
            
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.error || 'Failed to save template'
                toast.error(errorMessage)
                
                if (error.response?.data?.details) {
                    console.error('Validation details:', error.response.data.details)
                }
            } else {
                toast.error('An unexpected error occurred. Please try again.')
            }
        } finally {
            setSavingTemplate(false)
        }
    }

    const updateTemplate = async () => {
        try {
            setSavingTemplate(true)
            const response = await axios.put('/api/feedback', {
                templateId: selectedTemplate,
              name: formName,
                questions: currentForm.map(q => ({
                    id: q.id,
                    text: q.text,
                    type: q.type,
                    required: q.required,
                    options: q.options ? {
                        choices: q.options
                    } : undefined
                }))
            })

            if (response.data.success) {
                toast.success('Template updated successfully!')
                
                // Invalidate cache to trigger refetch
                queryClient.invalidateQueries({ queryKey: ['feedback-templates'] })
                
                console.log('Template updated successfully')
            }
        } catch (error) {
            console.error('Error updating template:', error)
        } finally {
            setSavingTemplate(false)
        }
    }

    const handleSaveDraft = async (name: string) => {
        if (currentForm.length === 0) return
        
        try {
            setSavingDraft(true)
            
            const finalName = getFormName(name);
            
            // Prepare data with proper validation
            const draftData = {
                name: finalName,
                customerId: sendToCustomer ? selectedCustomer : null,
                projectId: attachToProject ? selectedProject : null,
                recipientEmail: sendToCustomer ? 
                    customers.find(c => c.id === selectedCustomer)?.email || "" : 
                    customEmail || "",
                recepientName: sendToCustomer ? 
                    customers.find(c => c.id === selectedCustomer)?.name || null : 
                    customName || null,
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
            
            let response;
            
            if (isEditingExistingDraft()) {
                // Update existing draft using PATCH route
                response = await axios.patch(`/api/feedback/${selectedDraft}`, draftData)
            } else {
                // Create new draft using POST route
                response = await axios.post('/api/feedback/create', {
                    action: 'save_draft',
                    ...draftData
                })
            }

            if (response.data.success) {
                toast.success(isEditingExistingDraft() ? 'Draft updated successfully!' : 'Draft saved successfully!')
                
                // Invalidate cache to trigger refetch
                queryClient.invalidateQueries({ queryKey: ['feedback-drafts'] })
                
                setShowDraftDialog(false)
                setDraftName("")
                console.log(isEditingExistingDraft() ? 'Draft updated successfully' : 'Draft saved successfully')
            }
        } catch (error) {
            console.error('Error saving draft:', error)
            
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.error || 'Failed to save draft'
                toast.error(errorMessage)
                
                if (error.response?.data?.details) {
                    console.error('Validation details:', error.response.data.details)
                }
            } else {
                toast.error('An unexpected error occurred. Please try again.')
            }
        } finally {
            setSavingDraft(false)
        }
    }

    const handleSendFeedback = async () => {
        if (currentForm.length === 0) return
        
        const recipientEmail = sendToCustomer ? 
            customers.find(c => c.id === selectedCustomer)?.email : 
            customEmail
            
        if (!recipientEmail) {
            toast.error('No recipient email provided')
            return
        }
        
        // Basic email validation on frontend before sending
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(recipientEmail)) {
            toast.error('Invalid email address. Please provide a valid email format.')
            return
        }
        
        try {
            setSendingFeedback(true)
            
            const finalName = getFormName();
            
            // Prepare data with proper validation
            const feedbackData = {
                action: 'send_feedback',
                name: finalName,
                customerId: sendToCustomer ? selectedCustomer : null,
                projectId: attachToProject ? selectedProject : null,
                recipientEmail,
                recepientName: sendToCustomer ? 
                    customers.find(c => c.id === selectedCustomer)?.name || null : 
                    customName || null,
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
            
            const response = await axios.post('/api/feedback/create', feedbackData)

            if (response.data.success) {
                toast.success('Feedback sent successfully!')
                setShowSendDialog(false)
                resetForm()
                // Reset send form state
                setSelectedCustomer(null)
                setSelectedProject(null)
                setCustomEmail("")
                setCustomName("")
                setDueDate(undefined)
                setMessage("")
                setSendToCustomer(false)
                setAttachToProject(false)
                console.log('Feedback sent successfully')
            }
        } catch (error) {
            console.error('Error sending feedback:', error)
            
            // Handle specific error cases
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.error || 'Failed to send feedback'
                
                // Check for email validation errors specifically
                if (errorMessage.toLowerCase().includes('invalid email') || 
                    errorMessage.toLowerCase().includes('email address') ||
                    error.response?.data?.details?.fieldErrors?.recipientEmail) {
                    toast.error('Invalid email address. Please check the email and try again.')
                } else if (error.response?.status === 400) {
                    toast.error('Please check your form data and try again.')
                } else if (error.response?.status === 401) {
                    toast.error('You are not authorized to perform this action.')
                } else if (error.response?.status && error.response.status >= 500) {
                    toast.error('Server error. Please try again later.')
                } else {
                    toast.error(errorMessage)
                }
                
                // Log detailed validation errors for debugging
                if (error.response?.data?.details) {
                    console.error('Validation details:', error.response.data.details)
                }
            } else {
                toast.error('An unexpected error occurred. Please try again.')
            }
        } finally {
            setSendingFeedback(false)
        }
    }

    // Template delete functions
    const handleDeleteTemplate = (templateId: string) => {
      setTemplateToDelete(templateId)
      setShowDeleteTemplateModal(true)
    }

    const confirmDeleteTemplate = async () => {
      try {
          setDeletingTemplate(true)
          const response = await axios.delete(`/api/feedback?templateId=${templateToDelete}`)
          
          if (response.data.success) {
              toast.success('Template deleted successfully!')
              
              // Invalidate cache and reset form if needed
              queryClient.invalidateQueries({ queryKey: ['feedback-templates'] })
              if (selectedTemplate === templateToDelete) {
                resetForm()
              }
              console.log('Template deleted successfully')
          }
      } catch (error) {
          console.error('Error deleting template:', error)
          toast.error('Failed to delete template. Please try again.')
      } finally {
          setDeletingTemplate(false)
          setShowDeleteTemplateModal(false)
      setTemplateToDelete("")
      }
    }

    // Draft delete functions
    const handleDeleteDraft = (draftId: string) => {
        setDraftToDelete(draftId)
        setShowDeleteDraftModal(true)
    }

    const confirmDeleteDraft = async () => {
      try {
          setDeletingDraft(true)
          const response = await axios.post('/api/feedback/create', {
              action: 'delete_draft',
              draftId: draftToDelete
          })
          
          if (response.data.success) {
              toast.success('Draft deleted successfully!')
              
              // Invalidate cache and reset form if needed
              queryClient.invalidateQueries({ queryKey: ['feedback-drafts'] })
              if (selectedDraft === draftToDelete) {
                  resetForm()
              }
              console.log('Draft deleted successfully')
          }
      } catch (error) {
          console.error('Error deleting draft:', error)
          toast.error('Failed to delete draft. Please try again.')
      } finally {
          setDeletingDraft(false)
          setShowDeleteDraftModal(false)
          setDraftToDelete("")
      }
    }
    
    const editingQuestionData = currentForm.find((q) => q.id === editingQuestion)

    // Prepare dropdown data
    const customerOptions = customers.map(customer => ({
        value: customer.id,
        label: `${customer.name || 'Unnamed Customer'} (${customer.email || '-'})`,
        searchValue: `${customer.name || ''} ${customer.email || ''}`.trim()
    }))

    const projectOptions = projects.map(project => ({
        value: project.id,
        label: project.customerName ? 
            `${project.name || 'Unnamed Project'} - ${project.customerName}` : 
            (project.name || 'Unnamed Project'),
        searchValue: `${project.name || ''} ${project.customerName || ''}`.trim()
    }))
    
    const renderPreviewQuestion = (question: Question, index: number) => {
      return (
        <div key={question.id} className="space-y-3">
          <div className="flex items-start gap-2">
            <Label className="text-lg font-medium  flex-1">
              {index + 1}. {question.text}
            </Label>
            {question.required && (
              <div className="flex items-center gap-1">
                <span className="text-red-400 text-lg font-bold">*</span>
                <span className="text-xs text-red-300 px-2 py-1 rounded">Required</span>
              </div>
            )}
          </div>
  
          {question.type === "yes_no" && (
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input type="radio" name={`question-${question.id}`} className="text-primary" />
                <span>Yes</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name={`question-${question.id}`} className="text-primary" />
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
            <Textarea placeholder="Your answer..." className="" />
          )}
  
          {question.type === "rating" && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button key={rating} className="p-2 rounded">
                  <Star className="h-6 w-6 hover:text-yellow-400" />
                </button>
              ))}
            </div>
          )}
  
          {question.type === "dropdown" && (
            <Select>
              <SelectTrigger className="text-white">
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
            <Input type="number" placeholder="Enter a number" className="text-white" />
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

    // Show error state if there are critical errors
    if (builderDataError || customersError || projectsError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Failed to load feedback builder data</p>
                    <Button onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['feedback-templates'] })
                        queryClient.invalidateQueries({ queryKey: ['feedback-drafts'] })
                        queryClient.invalidateQueries({ queryKey: ['customers'] })
                        queryClient.invalidateQueries({ queryKey: ['projects'] })
                    }}>
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    // Get template and draft names for modals
    const templateToDeleteName = (templates as FeedbackTemplate[]).find((t: FeedbackTemplate) => t.id === templateToDelete)?.name || ""
    const draftToDeleteName = (drafts as FeedbackDraft[]).find((d: FeedbackDraft) => d.id === draftToDelete)?.name || ""

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-primary" />
            <h1 className="text-base font-bold">Form Builder</h1>
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
                  <SheetTitle className="">Templates & Questions</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Templates Section */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Templates</h3>
                    <div className="space-y-2">
                                              {(templates as FeedbackTemplate[]).map((template: FeedbackTemplate) => (
                        <Card
                          key={template.id}
                                                      className="cursor-pointer transition-colors"
                          onClick={() => loadTemplate(template.id)}
                        >
                          <CardContent className="p-3">
                                                          <h5 className="font-medium text-sm">{template.name}</h5>
                                                          <p className="text-xs">{template.questionCount} questions</p>
                                                          {template.isDefault && (
                                                              <Badge className="text-xs mt-1">Default</Badge>
                                                          )}
                                                      </CardContent>
                                                  </Card>
                                              ))}
                                          </div>
                                      </div>

                                      {/* Drafts Section */}
                                      <div>
                                          <h3 className="text-sm font-medium mb-3">Drafts</h3>
                                          <div className="space-y-2">
                                              {(drafts as FeedbackDraft[]).map((draft: FeedbackDraft) => (
                                                  <Card
                                                      key={draft.id}
                                                      className="cursor-pointer transition-colors"
                                                      onClick={() => loadDraft(draft.id)}
                                                  >
                                                      <CardContent className="p-3">
                                                          <h5 className="font-medium text-sm">{draft.name}</h5>
                                                          <p className="text-xs">{draft.questionCount} questions</p>
                                                          {draft.customerName && (
                                                              <p className="text-xs text-green-600 mt-1">Customer: {draft.customerName}</p>
                                                          )}
                                                          {draft.projectName && (
                                                              <p className="text-xs text-blue-600 mt-1">Project: {draft.projectName}</p>
                                                          )}
                                                          <p className="text-xs text-gray-500 mt-1">{draft.createdAtFormatted}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Question Types Section */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Question Types</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {questionTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <Button
                            key={type.id}
                            variant="ghost"
                            onClick={() => addQuestion(type.id as Question["type"])}
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
                  <h1 className="text-lg font-bold">Form Builder</h1>
                </div>
                {selectedTemplate && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/20 text-purple-300">
                                              Template
                    </Badge>
                                          {(templates as FeedbackTemplate[]).find((t: FeedbackTemplate) => t.id === selectedTemplate)?.isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(selectedTemplate)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                                  {selectedDraft && (
                                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                                          Editing Draft
                                      </Badge>
                                  )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={resetForm} className="">
                  Reset
                </Button>
                <Button 
                    variant="outline" 
                    onClick={handleSaveAsTemplate} 
                    className=""
                    disabled={savingTemplate || currentForm.length === 0}
                >
                  {savingTemplate ? (
                    <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                  ) : (
                    <Template className="h-4 w-4 mr-2" />
                  )}
                  {savingTemplate ? 'Saving...' : 
                  isEditingExistingTemplate() ? 'Update Template' : 'Save as Template'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentForm.length > 0) {
                      if (formName.trim()) {
                                                  handleSaveDraft(formName)
                      } else {
                        setShowDraftDialog(true)
                      }
                    }
                  }}
                  disabled={savingDraft || currentForm.length === 0}
                  className=""
                >
                  {savingDraft ? (
                    <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {getQuickSaveButtonText()}
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(true)} className="">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
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
            />
                          {selectedTemplate && (templates as FeedbackTemplate[]).find((t: FeedbackTemplate) => t.id === selectedTemplate)?.isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTemplate(selectedTemplate)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {selectedTemplate && (
            <Badge variant="secondary" className="bg-primary/20 text-purple-300 mt-2">
                              Template: {(templates as FeedbackTemplate[]).find((t: FeedbackTemplate) => t.id === selectedTemplate)?.name}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Column - Templates & Drafts (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-3 space-y-4">
                          {/* Templates Section */}
            <Card className="">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  <div className="space-y-2">
                                      {(templates as FeedbackTemplate[]).map((template: FeedbackTemplate) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-colors group ${
                            selectedTemplate === template.id ? "border-purple-500" : ""
                        }`}
                        onClick={() => loadTemplate(template.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm text-left">{template.name}</h5>
                                                          <p className="text-xs">{template.questionCount} questions</p>
                                                          {template.isDefault && (
                                                              <Badge className="text-xs mt-1">Default</Badge>
                                                          )}
                                                      </div>
                                                      {template.isOwner && (
                                                          <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              onClick={(e) => {
                                                                  e.stopPropagation()
                                                                  handleDeleteTemplate(template.id)
                                                              }}
                                                              className="group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-auto"
                                                          >
                                                              <Trash2 className="h-3 w-3" />
                                                          </Button>
                                                      )}
                                                  </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                              </CardContent>
                          </Card>

                          {/* Drafts Section */}
                          {(drafts as FeedbackDraft[]).length > 0 && (
                              <Card className="">
                                  <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                                          <Save className="h-5 w-5" />
                                          Drafts
                                      </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                                          {(drafts as FeedbackDraft[]).map((draft: FeedbackDraft) => (
                        <Card
                                                  key={draft.id}
                                                  className={`cursor-pointer transition-colors group ${
                                                      selectedDraft === draft.id ? "border-purple-500" : ""
                                                  }`}
                                                  onClick={() => loadDraft(draft.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                                              <h5 className="font-medium text-sm">{draft.name}</h5>
                                                              <p className="text-xs">{draft.questionCount} questions</p>
                                                              {draft.customerName && (
                                                                  <p className="text-xs text-green-600 mt-1">Customer: {draft.customerName}</p>
                                                              )}
                                                              {draft.projectName && (
                                                                  <p className="text-xs text-blue-600 mt-1">Project: {draft.projectName}</p>
                                                              )}
                                                              <p className="text-xs text-gray-500 mt-1">{draft.createdAtFormatted}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                                                  handleDeleteDraft(draft.id)
                                }}
                                                              className="group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-auto"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
              </CardContent>
            </Card>
                          )}

                          {/* Question Types Section */}
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
                        onClick={() => addQuestion(type.id as Question["type"])}
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
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTemplate && (
                      <Badge variant="secondary" className="bg-primary/20 text-purple-300">
                        Template: {(templates as FeedbackTemplate[]).find((t: FeedbackTemplate) => t.id === selectedTemplate)?.name}
                      </Badge>
                    )}
                    {selectedDraft && (
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                        Editing Draft: {(drafts as FeedbackDraft[]).find((d: FeedbackDraft) => d.id === selectedDraft)?.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentForm.length === 0 ? (
                  <div className="flex items-center justify-center h-64 lg:h-96">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-lg mb-2">Start building your form</p>
                      <p className="text-sm mb-4">Choose a template or add questions</p>
                      <div className="lg:hidden">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button className="">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Questions
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
                                                                              className="cursor-pointer hover:bg-gray-600 transition-colors"
                                      onClick={() => addQuestion(type.id as Question["type"])}
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
                            onClick={() => setEditingQuestion(question.id)}
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
                {editingQuestionData ? (
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
                    <p className="text-sm">Select a question to edit its properties</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="lg:hidden fixed bottom-4 right-4 flex flex-col gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              if (currentForm.length > 0) {
                if (formName.trim()) {
                                      handleSaveDraft(formName)
                } else {
                  setShowDraftDialog(true)
                }
              }
            }}
                          disabled={savingDraft || currentForm.length === 0}
                          className="shadow-lg"
          >
            {savingDraft ? (
              <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s]" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
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
                        onClick={() => addQuestion(type.id as Question["type"])}
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

        {/* Send Form Dialog */}
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

        {/* Save Template Dialog */}
        <Dialog open={templateNameDialog} onOpenChange={setTemplateNameDialog}>
                      <DialogContent className="mx-4">
            <DialogHeader>
              <DialogTitle className="">Save as Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                                  <Label className="">Template Name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="My Custom Template"
                  className=""
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setTemplateNameDialog(false)}>
                  Cancel
                </Button>
                                  <Button 
                                      onClick={() => saveTemplate(templateName)} 
                                      className="hover:bg-primary/80"
                                      disabled={savingTemplate || !templateName.trim()}
                                  >
                                      {savingTemplate ? (
                                        <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                                      ) : null}
                                      {savingTemplate ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Save Draft Dialog */}
        <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
                      <DialogContent className="mx-4">
            <DialogHeader>
              <DialogTitle className="">Save as Draft</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                                  <Label className="">Draft Name</Label>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="My Draft"
                  className=""
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowDraftDialog(false)}>
                  Cancel
                </Button>
                <Button
                                      onClick={() => handleSaveDraft(draftName)}
                                      className="hover:bg-primary/80"
                                      disabled={savingDraft || !draftName.trim()}
                                  >
                                      {savingDraft ? (
                                        <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.5s] mr-2" />
                                      ) : null}
                                      {savingDraft ? 'Saving...' : 'Save Draft'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

                  {/* Delete Template Confirmation Modal */}
                  <ConfirmModal
                      isOpen={showDeleteTemplateModal}
                      onClose={() => setShowDeleteTemplateModal(false)}
                      onConfirm={confirmDeleteTemplate}
                      title="Delete Template"
                      itemName={templateToDeleteName}
                      itemType="Template"
                      description={`Are you sure you want to permanently delete the template "${templateToDeleteName}"? This action cannot be undone.`}
                      isLoading={deletingTemplate}
                  />

                  {/* Draft Delete Confirmation Modal */}
                  <ConfirmModal
                      isOpen={showDeleteDraftModal}
                      onClose={() => setShowDeleteDraftModal(false)}
                      onConfirm={confirmDeleteDraft}
                      title="Delete Draft"
                      itemName={draftToDeleteName}
                      itemType="Draft"
                      description={`Are you sure you want to permanently delete the draft "${draftToDeleteName}"? This action cannot be undone.`}
                      isLoading={deletingDraft}
                  />
      </div>
    </div>
  )
}