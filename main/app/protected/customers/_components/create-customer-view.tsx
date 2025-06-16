"use client"

import React, { useRef, useState } from 'react';
import { z } from "zod";

import PageHeaderWrapper from '@/components/page-header-wrapper';
import CustomerForm from './customer-form';
import customerSchema from '@/validation/customer';
import { Button } from '@/components/ui/button';
import { SheetClose } from '@/components/ui/sheet';
import { Bubbles } from "lucide-react";

type CustomerFormValues = z.infer<typeof customerSchema>;

type Props = {
  onSearch: (value: string) => void;
}

export default function CreateCustomerView({ onSearch }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuccess = () => {
    closeRef.current?.click();
  };

  const footer = (
    <>
      <SheetClose asChild>
        <Button variant="ghost" ref={closeRef}>Cancel</Button>
      </SheetClose>
      <Button type="submit" form="customer-form" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.8s]" />
            Creating customer...
          </>
        ) : (
          'Create Customer'
        )}
      </Button>
    </>
  );

  return (
    <div className='w-full'>
      <PageHeaderWrapper 
        placeholder='Search Customers...'
        buttonText='New Customer'
        sheetTitle='New Customer'
        onSearch={onSearch}
        formComponent={<CustomerForm onSuccess={handleSuccess} onLoadingChange={setIsSubmitting} />}
        sheetContentClassName='w-full sm:w-3/4 md:w-1/2 lg:w-[40%]'
        footer={footer}
      />
    </div>
  );
} 