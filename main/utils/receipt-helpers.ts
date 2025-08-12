import { Receipt } from "@/hooks/receipts/use-receipts"
import { format, parseISO } from 'date-fns'


/**
 * Generates the next invoice number based on existing invoices
 * @param invoices - Array of existing invoices
 * @returns The next invoice number in format "INV-XXXX"
 */
export function generateNextReceiptNumber(receipts: Receipt[]): string {
    if (!receipts || receipts.length === 0) {
      return 'RCPT-0001'
    }
  
    // Extract numbers from existing invoice numbers
    const numbers = receipts
      .map(receipt => receipt.receiptNumber)
      .filter(number => number && number.match(/^RCPT-\d+$/))
      .map(number => {
        const match = number?.match(/^RCPT-(\d+)$/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter(num => num > 0)
  
    // Find the highest number
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0
    
    // Generate next number with leading zeros
    const nextNumber = maxNumber + 1
    return `RCPT-${nextNumber.toString().padStart(4, '0')}`
  }
  
  /**
   * Formats an invoice number for display
   * @param invoiceNumber - The invoice number to format
   * @returns Formatted invoice number
   */
  export function formatReceiptNumber(receiptNumber: string | null): string {
    if (!receiptNumber) return 'Not assigned'
    return receiptNumber
  }
  
  /**
   * Gets the total count of invoices
   * @param invoices - Array of invoices
   * @returns Total count
   */
  export function getReceiptCount(receipts: Receipt[]): number {
    return receipts?.length || 0
  }
  
  /**
   * Formats a date string using date-fns
   * @param dateString - ISO date string
   * @param formatString - Date format string (default: 'MMM dd, yyyy')
   * @returns Formatted date string
   */
  export function formatReceiptDate(dateString: string | null, formatString: string = 'MMM dd, yyyy'): string {
    if (!dateString) return 'Not set'
    
    try {
      const date = parseISO(dateString)
      return format(date, formatString)
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }
  
  /**
   * Formats a date for display in a table or list
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  export function formatReceiptDateShort(dateString: string | null): string {
    return formatReceiptDate(dateString, 'MMM dd')
  }
  
  /**
   * Formats a date for detailed display
   * @param dateString - ISO date string
   * @returns Formatted date string with time
   */
  export function formatReceiptDateTime(dateString: string | null): string {
    return formatReceiptDate(dateString, 'MMM dd, yyyy HH:mm')
  } 