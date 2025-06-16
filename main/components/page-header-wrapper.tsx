"use client"

import React from 'react'
import PageHeader from './page-header';

type Props = {
    placeholder: string;
    onSearch: (value: string) => void;
    formComponent: React.ReactNode;
    buttonText: string;
    sheetTitle: string;
    sheetContentClassName?: string;
    footer?: React.ReactNode;
}

export default function PageHeaderWrapper({placeholder, onSearch, formComponent, buttonText, sheetTitle, sheetContentClassName, footer}: Props) {
  return (
    <div className='w-full'>
        <PageHeader placeholder={placeholder} onSearch={onSearch} formComponent={formComponent} buttonText={buttonText} sheetTitle={sheetTitle} sheetContentClassName={sheetContentClassName} footer={footer} />
    </div>
  )
}