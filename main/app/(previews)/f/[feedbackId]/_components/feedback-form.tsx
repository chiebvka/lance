"use client"

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow, isPast } from 'date-fns';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Star, Calendar, Building2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import SubscriptionNotice from "@/app/(previews)/_components/SubscriptionNotice";

interface Question {
  id: string
  type: "yes_no" | "multiple_choice" | "text" | "rating" | "dropdown" | "number"
  text: string
  options?: {
    choices?: string[]
    min?: number
    max?: number
  } | string[] // Handle both formats
  required: boolean
}

interface FeedbackData {
  id: string
  name: string
  state: "sent" | "completed" | "overdue"
  questions: Question[]
  dueDate: string | null
  filledOn: string | null
  organizationName: string | null
  organizationLogoUrl: string | null
  organizationEmail: string | null
  message: string | null
  created_at: string
}

interface Answer {
  questionId: string
  answer: string | number | boolean | string[]
}

interface FeedbackFormProps {
  feedbackId: string
  token: string
}

export default function FeedbackForm({ feedbackId, token }: FeedbackFormProps) {
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockedReason, setBlockedReason] = useState<string | null>(null)

  useEffect(() => {
    fetchFeedbackData()
  }, [feedbackId, token])

  const fetchFeedbackData = async () => {
    try {
      const response = await axios.get(`/api/feedback/submit-feedback?feedbackId=${feedbackId}&token=${token}`)
      if (response.data.success) {
        setFeedbackData(response.data.data)
        // Initialize answers array
        const initialAnswers: Answer[] = response.data.data.questions.map((q: Question) => ({
          questionId: q.id,
          answer: q.type === "multiple_choice" ? [] : (q.type === "rating" ? 0 : "")
        }))
        setAnswers(initialAnswers)
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setBlockedReason(error.response?.data?.reason || null)
        setError(null)
      } else {
        setError(error.response?.data?.error || "Failed to load feedback form")
      }
    } finally {
      setLoading(false)
    }
  }

  const updateAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => 
      prev.map(a => a.questionId === questionId ? { ...a, answer } : a)
    )
  }

  // Helper function to get question options as array
  const getQuestionOptions = (question: Question): string[] => {
    if (!question.options) return []
    
    // Handle different option formats
    if (Array.isArray(question.options)) {
      return question.options
    }
    
    if (typeof question.options === 'object' && question.options.choices) {
      return question.options.choices
    }
    
    return []
  }

  const handleSubmit = async () => {
    if (!feedbackData) return

    // Validate required fields
    const unansweredRequired = feedbackData.questions.filter(q => {
      if (!q.required) return false
      const answer = answers.find(a => a.questionId === q.id)?.answer
      if (!answer) return true
      if (Array.isArray(answer)) return answer.length === 0
      if (typeof answer === "string") return answer.trim() === ""
      if (typeof answer === "number") return answer === 0
      return false
    })

    if (unansweredRequired.length > 0) {
      toast.error(`Please answer all required questions: ${unansweredRequired.map(q => q.text).join(", ")}`)
      return
    }

    try {
      setSubmitting(true)
      const response = await axios.patch('/api/feedback/submit-feedback', {
        feedbackId,
        token,
        answers: answers.filter(a => a.answer !== "" && a.answer !== 0 && (!Array.isArray(a.answer) || a.answer.length > 0))
      })

      if (response.data.success) {
        toast.success("Thank you! Your feedback has been submitted successfully.")
        // Refresh the data to show completed state
        await fetchFeedbackData()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: Question, index: number) => {
    const answer = answers.find(a => a.questionId === question.id)?.answer
    const questionOptions = getQuestionOptions(question)

    return (
      <div key={question.id} className="space-y-3">
        <div className="flex items-start gap-2">
          <Label className="md:text-lg text-sm font-medium flex-1">
            {index + 1}. {question.text}
          </Label>
          {question.required && (
            <div className="flex items-center gap-1">
              <span className="text-red-400 text-xs font-bold">*</span>
              <span className="text-xs text-red-300 px-2 py-1 rounded bg-red-100">Required</span>
            </div>
          )}
        </div>

        {question.type === "yes_no" && (
          <RadioGroup 
            value={answer === true ? "yes" : answer === false ? "no" : ""} 
            onValueChange={(value) => updateAnswer(question.id, value === "yes")}
            className="flex flex-row gap-6 text-xs md:text-sm"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`${question.id}-yes`} />
              <Label htmlFor={`${question.id}-yes`} className="cursor-pointer text-xs md:text-sm">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`${question.id}-no`} />
              <Label htmlFor={`${question.id}-no`} className="cursor-pointer text-xs md:text-sm">No</Label>
            </div>
          </RadioGroup> 
        )}

        {question.type === "multiple_choice" && (
          <div className="space-y-3">
            {questionOptions.map((option, optIndex) => (
              <div key={optIndex} className="flex items-center space-x-3">
                <Checkbox 
                  id={`question-${question.id}-option-${optIndex}`}
                  checked={Array.isArray(answer) && answer.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentAnswers = Array.isArray(answer) ? answer : []
                    if (checked) {
                      updateAnswer(question.id, [...currentAnswers, option])
                    } else {
                      updateAnswer(question.id, currentAnswers.filter(a => a !== option))
                    }
                  }}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label 
                  htmlFor={`question-${question.id}-option-${optIndex}`}
                  className="text-xs md:text-sm font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )}

        {question.type === "text" && (
          <Textarea 
            placeholder="Your answer..." 
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            className="min-h-[80px] text-xs md:text-sm"
          />
        )}

        {question.type === "rating" && (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button 
                key={rating} 
                type="button"
                onClick={() => updateAnswer(question.id, rating)}
                className="md:p-2 p-1 text-xs md:text-sm rounded hover:bg-gray-100 transition-colors"
              >
                <Star className={`md:h-6 md:w-6 h-4 w-4 transition-colors ${
                  typeof answer === "number" && answer >= rating 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-gray-300 hover:text-yellow-400"
                }`} />
              </button>
            ))}
          </div>
        )}

        {question.type === "dropdown" && (
          <Select 
            value={typeof answer === "string" ? answer : ""}
            onValueChange={(value) => updateAnswer(question.id, value)}
          >
            <SelectTrigger className="text-xs md:text-sm">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {questionOptions.map((option, optIndex) => (
                <SelectItem key={optIndex} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {question.type === "number" && (
          <Input 
            type="number" 
            placeholder="Enter a number" 
            value={typeof answer === "number" ? answer.toString() : ""}
            onChange={(e) => updateAnswer(question.id, parseInt(e.target.value) || 0)}
          />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading feedback form...</p>
        </div>
      </div>
    )
  }

  if (blockedReason) {
    return <SubscriptionNotice reason={blockedReason} />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <AlertCircle className="md:h-12 md:w-12 h-8 w-8 text-red-500 mx-auto mb-4" />
          <h1 className="md:text-2xl text-lg font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 text-xs md:text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!feedbackData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Feedback form not found</h1>
        </div>
      </div>
    )
  }

  if (feedbackData.state === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center p-8 bg-white shadow-lg">
          <CheckCircle className="md:h-16 md:w-16 h-8 w-8 text-green-500 mx-auto mb-4" />
          <h1 className="md:text-2xl text-lg font-bold text-gray-800 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-4 text-xs md:text-sm">You have already completed this feedback form.</p>
          {feedbackData.filledOn && (
            <p className="text-xs md:text-sm text-gray-500">
              Submitted {formatDistanceToNow(new Date(feedbackData.filledOn), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    )
  }

  const isOverdue = feedbackData.dueDate && isPast(new Date(feedbackData.dueDate))
  const daysOverdue = feedbackData.dueDate ? formatDistanceToNow(new Date(feedbackData.dueDate)) : null

  return (
    <div className="min-h-screen  md:p-6 ">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl shadow-black/10 border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-bexoni/60 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center md:gap-3 gap-1">
                {feedbackData.organizationLogoUrl ? (
                  <img
                    src={feedbackData.organizationLogoUrl}
                    alt={feedbackData.organizationName || "Company"}
                    className="md:w-12 md:h-12 w-8 h-8 rounded-lg bg-white/20 p-2 object-contain"
                  />
                ) : (
                  <div className="md:w-12 md:h-12 w-8 h-8 rounded-none bg-white/20 p-2 flex items-center justify-center">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-xs md:text-base">{feedbackData.organizationName || "Company"}</h3>
                  <p className="text-blue-100 text-xs md:text-sm">Feedback Request</p>
                </div>
              </div>
              {feedbackData.dueDate && (
                <Badge variant="secondary" className={`${
                  isOverdue ? "bg-red-500/20 text-red-100 border-red-300" : "bg-white/20 text-white text-xs md:text-sm border-white/30"
                }`}>
                  {isOverdue ? <AlertCircle className="w-4 h-4 mr-1" /> : <Calendar className="w-4 h-4 mr-1 text-xs md:text-sm" />}
                  {isOverdue ? `Overdue by ${daysOverdue}` : `Due: ${new Date(feedbackData.dueDate).toLocaleDateString()}`}
                </Badge>
              )}
            </div>
            <h1 className="md:text-2xl text-lg font-bold">{feedbackData.name}</h1>
            <p className="text-blue-100 mt-2 text-xs md:text-sm">Please fill out the form below</p>
            {feedbackData.message && (
              <p className="text-blue-100 mt-2 text-sm bg-white/10 p-3 rounded-lg">
                {feedbackData.message}
              </p>
            )}
          </div>

          <CardContent className="md:p-8 p-4 space-y-8">
            {feedbackData.questions.map(renderQuestion)}

            <div className="pt-6 border-t">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 text-base  disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}