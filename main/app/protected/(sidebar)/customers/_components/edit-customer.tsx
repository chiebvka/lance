"use client"

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileUser, Warehouse, InfoIcon, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CustomerRatingMeter from '@/components/customer-rating-meter';
import customerSchema from '@/validation/customer';
import ConfirmModal from '@/components/modal/confirm-modal';

type CustomerFormValues = z.infer<typeof customerSchema>;

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  website?: string
  contactPerson?: string
  addressLine1?: string
  unitNumber?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  taxId?: string
  notes?: string
  rating: number
  invoiceCount: number
  projectCount: number
  receiptCount: number
  feedbackCount: number
}

type Props = {
  customer: Customer;
  onSuccess: () => void;
  onLoadingChange: (isLoading: boolean) => void;
  onDelete?: () => void;
}

export default function EditCustomer({ customer, onSuccess, onLoadingChange, onDelete }: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer.name || "",
      email: customer.email || "",
      website: customer.website || "",
      contactPerson: customer.contactPerson || "",
      taxId: customer.taxId || "",
      notes: customer.notes || "",
      phone: customer.phone || "",
      addressLine1: customer.addressLine1 || "",
      unitNumber: customer.unitNumber || "",
      city: customer.city || "",
      state: customer.state || "",
      postalCode: customer.postalCode || "",
      country: customer.country || "",
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    onLoadingChange(true);
    try {
      const response = await axios.put(`/api/customers/${customer.id}`, values);
      toast.success(response.data.success || "Customer updated successfully!");
      onSuccess();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to update customer.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      onLoadingChange(false);
    }
  };

  const handleDelete = async () => {
    setIsDeletingCustomer(true);
    onLoadingChange(true);
    try {
      const response = await axios.delete(`/api/customers/${customer.id}`);
      toast.success(response.data.success || "Customer deleted successfully!");
      setIsDeleteModalOpen(false);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to delete customer.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsDeletingCustomer(false);
      onLoadingChange(false);
    }
  };

  // Define the color scheme from the activity component
  const tagColors = {
    invoice: "#22c55e", // Green
    project: "#8b5cf6", // Purple
    receipt: "#f59e0b", // Amber
    feedback: "#3b82f6", // Blue
  }

  return (
    <Form {...form}>
      <form id="edit-customer-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
        {/* Customer Overview Card */}
        <Card className="border-primary border bg-lightCard dark:bg-darkCard">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left side: Name and email (no avatar) */}
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-primary">{customer.name}</h3>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              </div>
              
              {/* Right side: Rating section - mobile layout */}
              <div className="sm:hidden flex flex-col justify-center -mt-12 mb-2 items-end gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <span className="text-sm text-primary font-medium underline decoration-primary">
                          Customer Rating
                        </span>
                        <InfoIcon className="h-4 w-4 text-primary" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-semibold">Customer Reliability Score</p>
                        <p className="text-xs">This rating is calculated based on:</p>
                        <ul className="text-xs space-y-1">
                          <li>• Invoice payment completion rate </li>
                          <li>• On-time payment history </li>
                          <li>• Customer project volume history </li>
                          <li>• Customer interaction rate </li>
                          <li>• Penalties for overdue invoices</li>
                        </ul>
                        <p className="text-xs text-muted-foreground pt-1">
                          Higher scores indicate more reliable payment behavior.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <CustomerRatingMeter 
                  rating={customer.rating} 
                  size="md" 
                  showLabel={false}
                />
              </div>
              
              {/* Desktop layout: Rating section - side by side */}
              <div className="hidden sm:flex flex-col sm:flex-row items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <span className="text-sm text-primary font-medium underline decoration-primary">
                          Customer Rating
                        </span>
                        <InfoIcon className="h-4 w-4 text-primary" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-semibold">Customer Reliability Score</p>
                        <p className="text-xs">This rating is calculated based on:</p>
                        <ul className="text-xs space-y-1">
                          <li>• Invoice payment completion rate </li>
                          <li>• On-time payment history </li>
                          <li>• Customer project volume history </li>
                          <li>• Customer interaction rate </li>
                          <li>• Penalties for overdue invoices</li>
                        </ul>
                        <p className="text-xs text-muted-foreground pt-1">
                          Higher scores indicate more reliable payment behavior.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <CustomerRatingMeter 
                  rating={customer.rating} 
                  size="md" 
                  showLabel={false}
                />
              </div>
            </div>
            
            {/* Statistics Grid */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: tagColors.invoice }}>
                  {customer.invoiceCount}
                </div>
                <div className="text-xs text-muted-foreground">Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: tagColors.project }}>
                  {customer.projectCount}
                </div>
                <div className="text-xs text-muted-foreground">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: tagColors.receipt }}>
                  {customer.receiptCount}
                </div>
                <div className="text-xs text-muted-foreground">Receipts</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: tagColors.feedback }}>
                  {customer.feedbackCount}
                </div>
                <div className="text-xs text-muted-foreground">Feedback</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Button */}
        {/* <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 rounded-none border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setIsDeleteModalOpen(true)}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            Delete Customer
          </Button>
        </div> */}

        <Accordion type="multiple" defaultValue={["business", "personal"]}>
          <AccordionItem value="business" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileUser className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-primary">General</h3>
                  <p className="text-sm text-muted-foreground">Basic information about the customer</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                <div className='flex flex-col gap-3'>
                  <Label htmlFor="name">Name</Label>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl><Input {...field} placeholder="Acme Inc" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='flex flex-col gap-3'>
                  <Label htmlFor="email">Email</Label>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl><Input {...field} placeholder="example@acme.com" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='flex flex-col gap-3'>
                  <Label htmlFor="phone">Phone</Label>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl><Input {...field} placeholder="+1 (555) 123-4567" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='flex flex-col gap-3'>
                  <Label htmlFor="website">Website</Label>
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl><Input {...field} placeholder="acme.com" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='flex flex-col gap-3'>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl><Input {...field} placeholder="John Doe" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="personal" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Warehouse className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-primary">Personal Information</h3>
                  <p className="text-sm text-muted-foreground">Basic contact details</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className='flex flex-col gap-3'>
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <FormField
                        control={form.control}
                        name="addressLine1"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input {...field} placeholder="123 Main Street" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className='flex flex-col gap-3'>
                      <Label htmlFor="unitNumber">Unit Number</Label>
                      <FormField
                        control={form.control}
                        name="unitNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input {...field} placeholder="Suite or Apartment Number" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className='flex flex-col gap-3'>
                        <Label htmlFor="country">Country</Label>
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input {...field} placeholder="Canada" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className='flex flex-col gap-3'>
                        <Label htmlFor="city">City</Label>
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input {...field} placeholder="Charlottetown" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className='flex flex-col gap-3'>
                        <Label htmlFor="state">State / Province</Label>
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input {...field} placeholder="PE" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className='flex flex-col gap-3'>
                        <Label htmlFor="postalCode">Zip Code / Postal Code</Label>
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl><Input {...field} placeholder="C1A 1A1" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className='flex flex-col gap-3'>
                      <Label htmlFor="taxId">TAX ID / VAT Number</Label>
                      <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input {...field} placeholder="Enter VAT Number" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className='flex flex-col gap-3'>
                      <Label htmlFor="notes">Notes</Label>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Textarea {...field} placeholder="Additional information about the customer" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Custom Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          itemName={customer.name}
          itemType="Customer"
          isLoading={isDeletingCustomer}
          hasConnectedItems={customer.projectCount > 0}
          connectedItemsCount={customer.projectCount}
          connectedItemsType="projects"
          warningMessage={
            customer.projectCount > 0 
              ? `This customer has ${customer.projectCount} active project${customer.projectCount !== 1 ? 's' : ''}. You must complete or delete all projects before removing this customer.`
              : undefined
          }
        />
      </form>
    </Form>
  )
}