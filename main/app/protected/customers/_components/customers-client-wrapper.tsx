'use client'
import React from 'react'
import CreateCustomerView from './create-customer-view'
import CustomerLoading from './customer-loading'
import CustomerTable from './customer-table'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  website?: string
  contactPerson?: string
  address?: string
  addressLine2?: string
  invoiceCount: number
  projectCount: number
  receiptCount: number
  feedbackCount: number
  rating: number
  created_at: string
  lastActivity: string
  avatar?: string
}

interface CustomersClientWrapperProps {
  customers: Customer[]
}

interface SearchAndTableProps {
  customers?: Customer[] | null
  showTable?: boolean
}

export function SearchOnly({ customers }: SearchAndTableProps = {}) {
  const handleSearch = (value: string) => {
    // TODO: Implement customer search logic
    console.log("Searching for customer:", value)
  }
  
  return <CreateCustomerView onSearch={handleSearch} />
}

export function CustomerTableOnly({ customers }: SearchAndTableProps = {}) {
  return <CustomerTable customer={customers || null} />
}

export default function CustomersClientWrapper({ customers }: CustomersClientWrapperProps) {
  const handleSearch = (value: string) => {
    // TODO: Implement customer search logic
    console.log("Searching for customer:", value)
  }
  
  return (
    <>
      <CreateCustomerView onSearch={handleSearch} />
      <CustomerTable customer={customers} />
    </>
  )
} 