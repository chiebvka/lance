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
}

export default function PageHeaderWrapper({placeholder, formComponent, buttonText, sheetTitle, sheetContentClassName, footer}: Props) {
  return (
    <div className='w-full'>
        <PageHeader placeholder={placeholder} onSearch={() => {}} formComponent={formComponent} buttonText={buttonText} sheetTitle={sheetTitle} sheetContentClassName={sheetContentClassName} footer={footer} />
    </div>
  )
}