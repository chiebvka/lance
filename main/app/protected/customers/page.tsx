import React from 'react'
import RecentActivity from './_components/recent-activity'
import CreateCustomerView from './_components/create-customer-view'


type Props = {}

export default function page({}: Props) {
  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
        <CreateCustomerView />
        <RecentActivity />
    </div>
  )
}