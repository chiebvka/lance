"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Star, Calendar, Building2 } from "lucide-react";


type Props = {}

interface FormData {
    rating: number
    dropdown: string
    aspects: string[]
    comments: string
    recommendation: string
  }
  
  interface FeedbackFormProps {
    companyName: string
    companyLogo: string
    dueDate: string
    formTitle: string
    style: "modern" | "minimal" | "corporate" | "creative" | "glassmorphism" | "neon" | "retro" | "nature" | "luxury"
  }
  

export default function FeedbackForm({}: Props) {
  return (
    <div>feedback-form</div>
  )
}