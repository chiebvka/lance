"use client"

import React from 'react';
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

type CustomerFormValues = z.infer<typeof customerSchema>;

type Props = {
  onSuccess: () => void;
  onLoadingChange: (isLoading: boolean) => void;
}

export default function CustomerForm({ onSuccess, onLoadingChange }: Props) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      website: "",
      contactPerson: "",
      taxId: "",
      notes: "",
      phone: "",
      addressLine1: "",
      unitNumber: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    onLoadingChange(true);
    try {
      // await new Promise(resolve => setTimeout(resolve, 4000));
      const response = await axios.post('/api/customers/create', values);
      toast.success(response.data.success || "Customer created successfully!");
      form.reset();
      onSuccess();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to create customer.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id="customer-form" className="space-y-6">
        <Accordion  type="multiple" defaultValue={["business", "personal"]}>
          <AccordionItem value="business" className="">
            <AccordionTrigger className="px-4 border py-3 my-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="p-2  rounded-full">
                  <FileUser  className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-primary">General </h3>
                  <p className="text-sm text-bexoni/70">Basic information about the customer</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 border-b border-bexoni">
              <div className="space-y-4">
                <div className='flex flex-col gap-3'>
                  <Label htmlFor="name"> Name</Label>
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
                  <Label htmlFor="email"> Email</Label>
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
                  <Label htmlFor="phone"> Phone</Label>
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
                  <Label htmlFor="website"> Website</Label>
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
                  <Label htmlFor="contactPerson"> Contact Person</Label>
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
                <div className="p-2 rounded-full">
                  <Warehouse className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-primary">Personal Information</h3>
                  <p className="text-sm text-bexoni/70">Basic contact details</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {/* Address Search Section */}
                <div className="space-y-4 pt-4 border-t">
                  {/* <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <Label className="text-primary font-medium">Search for address</Label>
                  </div> */}

                  {/* Address Search Bar */}
                  {/* <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search for your address..."
                        className="pl-10 pr-10"
                      />
                    </div>
                  </div> */}

                  {/* Manual Address Fields */}
                  <div className="space-y-4">
                    <div className='flex flex-col gap-3'>
                      <Label htmlFor="adressline1"> Address Line 1</Label>
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
                      <Label htmlFor="unitNumber"> Unit Number</Label>
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
                        <Label htmlFor="country"> Country</Label>
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
                        <Label htmlFor="city"> City</Label>
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
                        <Label htmlFor="state"> State / Province</Label>
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
                        <Label htmlFor="postalCode"> Zip Code / Postal Code</Label>
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
                      <Label htmlFor="adressline1"> TAX ID / VAT Number</Label>
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
                      <Label htmlFor="notes"> Notes</Label>
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
                    {/* <div>
                      <Label htmlFor="country">Country</Label>
                      <Select
                        // value={addressData.country}
                        // onValueChange={(value) => handleAddressFieldChange("country", value)}
                      >
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
                    </div> */}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>
    </Form>
  )
}