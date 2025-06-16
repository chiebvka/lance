'use client'
import React from 'react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Search from './search';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Props = {
  placeholder : string,
  onSearch : (value: string) => void,
  sheetTitle? : string,
  buttonText? : string,
  formComponent? : React.ReactNode,
  sheetContentClassName?: string;
  footer?: React.ReactNode;
  action?: React.ReactNode;
}

export default function PageHeader({placeholder, onSearch, sheetTitle, buttonText, formComponent, sheetContentClassName, footer, action}: Props) {
  const showSheet = formComponent && buttonText && sheetTitle;
  
  return (
    <header className="flex justify-between items-center  border-b">
    <div className="flex items-center space-x-4">
    <Search placeholder={placeholder} />
    </div>
    {action ? action : (
      showSheet && (
        <Sheet>
          <SheetTrigger asChild>
            <Button> 
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{buttonText}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" bounce="right" withGap={true} className={cn("flex flex-col", sheetContentClassName)}>
            <SheetTitle className='sr-only'>
              {sheetTitle}
            </SheetTitle>
            <ScrollArea className="flex-1 pr-4">
              {formComponent}
            </ScrollArea>
            {footer && <SheetFooter className='pt-4'>{footer}</SheetFooter>}
            </SheetContent>
        </Sheet>
      )
    )}
  </header>
  )
}