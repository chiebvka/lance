"use client"

import React from 'react'
import PageHeader from './page-header';

type Props = {
    placeholder: string;
    formComponent: React.ReactNode;
    buttonText: string;
    sheetTitle: string;
    sheetContentClassName?: string;
    footer?: React.ReactNode;
    action?: React.ReactNode;
    filterContent?: React.ReactNode;
}

export default function PageHeaderWrapper({placeholder, formComponent, buttonText, sheetTitle, sheetContentClassName, footer, action, filterContent}: Props) {
  return (
    <div className='w-full'>
        <PageHeader 
          placeholder={placeholder} 
          formComponent={formComponent} 
          buttonText={buttonText} 
          sheetTitle={sheetTitle} 
          sheetContentClassName={sheetContentClassName} 
          footer={footer}
          action={action}
          filterContent={filterContent}
        />
    </div>
  )
}