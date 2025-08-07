"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Edit, Save, X } from 'lucide-react';

type Invoice = {
  id: string
  invoiceNumber?: string | null
  recepientEmail?: string | null
  recepientName?: string | null
  created_at?: string | null
  paidOn?: string | null
  dueDate?: string | null
  issueDate?: string | null
  state?: string | null
  status?: string | null
  totalAmount?: number | null
  currency?: string | null
  taxRate?: number | null
  vatRate?: number | null
  notes?: string | null
  // ... add other fields as needed
}

type Props = {
  invoice: Invoice
  onSuccess?: () => void
  onCancel?: () => void
}

export default function EditInvoice({ invoice, onSuccess, onCancel }: Props) {
  return (
    <div className="p-6">
  
      
      <Separator className="mb-6" />
      
      <div className="space-y-6">
        <div className="text-center py-8">
          <Edit className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Edit Invoice Form</h3>
          <p className="text-sm text-muted-foreground">
            Invoice editing functionality will be implemented here.
          </p>
        </div>
        
        <div className="flex gap-3 pt-6">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onSuccess}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}