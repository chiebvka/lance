import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface Bank {
  id: string
  accountName: string | null
  accountNumber: string | null
  routingNumber: string | null
  institutionNumber: string | null
  transitNumber: string | null
  iban: string | null
  swiftCode: string | null
  sortCode: string | null
  bankName: string | null
  bankAddress: string | null
  country: string | null
  currency: string | null
  isDefault: boolean | null
  type: string | null
  stripePaymentLink: string | null
  paypalPaymentLink: string | null
  organizationId: string | null
  createdBy: string | null
  created_at: string
  updatedAt: string | null
}

export interface BankInput {
  accountType: 'bank' | 'crypto' | 'stripe' | 'paypal'
  accountName?: string
  accountNumber?: string
  routingNumber?: string
  institutionNumber?: string
  transitNumber?: string
  iban?: string
  swiftCode?: string
  sortCode?: string
  bankName?: string
  bankAddress?: string
  country?: string
  currency?: string
  isDefault?: boolean
  stripePaymentLink?: string
  paypalPaymentLink?: string
  // Crypto specific fields
  walletName?: string
  cryptoType?: string
  network?: string
  walletAddress?: string
  // Payment link for stripe/paypal
  paymentLink?: string
}

export async function fetchBanks(): Promise<Bank[]> {
  const { data } = await axios.get<{ success: boolean; banks: Bank[] }>('/api/banks')
  if (!data.success) throw new Error('Error fetching banks')
  return data.banks
}

export function useBanks() {
  return useQuery<Bank[]>({
    queryKey: ['banks'],
    queryFn: fetchBanks,
  })
} 