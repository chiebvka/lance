"use client"
import React, { useEffect, useTransition } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Building2, FileUser, Loader2, MapPin, Search, Warehouse } from 'lucide-react';
import { Label } from '@/components/ui/label';
import customerSchema from '@/validation/customer';
import { createCustomer } from '@/actions/customer/create';

type CustomerFormValues = z.infer<typeof customerSchema>;

type Props = {
  setIsSubmitting: (isSubmitting: boolean) => void;
  onSuccess: () => void;
}




export default function EditCustomer({ setIsSubmitting, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  
  return <div>EditCustomer</div>
}