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


const pathFormSchema = z.object({
  title: z.string().min(1, "Wall title is required"),
  description: z.string().min(1, "Wall description is required"),
})

type Props = {}

export default function PathBuilder({}: Props) {
  return (
    <div>PathBuilder</div>
  )
}