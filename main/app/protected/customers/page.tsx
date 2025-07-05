import React from 'react'
import RecentActivityWrapper from './_components/recent-activity-wrapper'
import CustomersClient from './_components/customers-client'

// You'll need to fetch your customers data here
// This is just a placeholder - replace with your actual data fetching
async function getCustomers() {
  // TODO: Replace with actual data fetching logic
  return []
}

export default async function CustomersPage() {
  const customers = await getCustomers()

  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
      <CustomersClient />
      <RecentActivityWrapper />
    </div>
  )
}