import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface FAQ {
  id: string
  question: string
  answer: string
}

interface FaqAccordianProps {
  faqs: FAQ[]
  className?: string
  allowMultiple?: boolean
  collapsible?: boolean
}

export default function FaqAccordian({ 
  faqs, 
  className = "",
  allowMultiple = false,
  collapsible = true 
}: FaqAccordianProps) {
  if (!faqs || faqs.length === 0) {
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      <Accordion 
        type={allowMultiple ? "multiple" : "single"} 
        collapsible={collapsible}
        className="w-full"
      >
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-muted-foreground">
                {faq.answer}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

// Export the FAQ interface for use in other components
export type { FAQ }