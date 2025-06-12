import React from 'react'
import CreateProjectView from './_components/create-project-view'

type Props = {}

export default function page({}: Props) {
  return (
    <div className='w-full py-4 px-6 border border-bexoni'>
        <CreateProjectView />
    </div>
  )
}


