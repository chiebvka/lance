"use client"

import React, { useTransition } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from 'lucide-react';

import PageHeaderWrapper from '@/components/page-header-wrapper';
import CustomerForm from './customer-form';
import customerSchema from '@/validation/customer';
import { Button } from '@/components/ui/button';
import { SheetClose } from '@/components/ui/sheet';
import { createCustomer } from '@/actions/customer/create';

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CreateCustomerView() {
  const [isPending, startTransition] = useTransition();
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
      adressline1: "",
      unitNumber: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  const onSubmit = (values: CustomerFormValues) => {
    startTransition(async () => {
      const result = await createCustomer(values);
      if (result.success) {
        console.log(result.success);
        form.reset();
        // You can add a success toast notification here
      } else if (result.error) {
        console.error(result.error);
        // You can add an error toast notification here
      }
    });
  };

  const footer = (
    <>
      <SheetClose asChild>
        <Button variant="ghost">Cancel</Button>
      </SheetClose>
      <Button type="submit" form="customer-form" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Customer
      </Button>
    </>
  );

  return (
    <PageHeaderWrapper 
      placeholder="Search customers" 
      buttonText=" New Customer" 
      formComponent={<CustomerForm form={form} onSubmit={onSubmit} />} 
      sheetTitle="New Customer" 
      sheetContentClassName="w-full sm:w-3/4 md:w-1/2 lg:w-[40%]"
      footer={footer}
    />
  );
} 