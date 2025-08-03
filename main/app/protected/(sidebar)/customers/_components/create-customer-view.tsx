"use client"

import React, { useRef, useState } from 'react';
import { z } from "zod";

import CreateSearchFilter from '@/components/general/create-search-filter';
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
            <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.5s]" />
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
      <CreateSearchFilter 
        placeholder='Search Customers...'
        onSearch={onSearch}
        sheetTriggerText='New Customer'
        sheetTitle='New Customer'
        sheetContent={<CustomerForm onSuccess={handleSuccess} onLoadingChange={setIsSubmitting} />}
        sheetContentClassName='w-full sm:w-3/4 md:w-1/2 lg:w-[40%]'
        footer={footer}
      />
    </div>
  );
} 