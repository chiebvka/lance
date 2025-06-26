import React from 'react'
import RecentActivityWrapper from './_components/recent-activity-wrapper'
import { SearchOnly, CustomerTableOnly } from './_components/customers-client-wrapper'

type Props = {}

export default function CustomersPage({}: Props) {
  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
        <SearchOnly />
        <RecentActivityWrapper />
        <CustomerTableOnly />
    </div>
  )
}