import { z } from "zod";

// Helper function to determine bank type based on account type and country
export function getBankType(accountType: string, country?: string): string {
  if (accountType === 'crypto') return 'crypto';
  if (accountType === 'stripe') return 'stripe';
  if (accountType === 'paypal') return 'paypal';
  
  // For bank accounts, determine type based on country
  if (accountType === 'bank') {
    switch (country) {
      case 'US': return 'bankUs';
      case 'CA': return 'bankCanada';
      case 'GB': return 'bankUk';
      case 'EU': return 'bankEurope';
      case 'international': return 'bankOther';
      default: return 'bankOther';
    }
  }
  
  return 'bankOther';
}

// Validation schema for bank creation
export const bankSchema = z.object({
  id: z.string().optional(),
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  institutionNumber: z.string().optional(),
  transitNumber: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  sortCode: z.string().optional(),
  bankName: z.string().min(1, "Bank name is required"),
  bankAddress: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  currency: z.string().min(1, "Currency is required"),
  isDefault: z.boolean().optional(),
  type: z.enum(["crypto", "stripe", "paypal", "bankUs", "bankCanada", "bankUk", "bankEurope", "bankOther"]).optional(),
  stripePaymentLink: z.string().optional(),
  paypalPaymentLink: z.string().optional(),
  organizationId: z.string().optional(),
});

// Validation schema for different account types
export const bankAccountSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  routingNumber: z.string().optional(),
  institutionNumber: z.string().optional(),
  transitNumber: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  sortCode: z.string().optional(),
  bankName: z.string().min(1, "Bank name is required"),
  bankAddress: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  currency: z.string().min(1, "Currency is required"),
  isDefault: z.boolean().optional(),
});

export const cryptoWalletSchema = z.object({
  walletName: z.string().min(1, "Wallet name is required"),
  cryptoType: z.string().min(1, "Cryptocurrency type is required"),
  network: z.string().min(1, "Network is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
  isDefault: z.boolean().optional(),
});

export const stripeAccountSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  paymentLink: z.string().url("Valid payment link is required"),
  isDefault: z.boolean().optional(),
});

export const paypalAccountSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  paymentLink: z.string().url("Valid payment link is required"),
  isDefault: z.boolean().optional(),
});

// Combined schema for all account types
export const createBankSchema = z.discriminatedUnion('accountType', [
  z.object({
    accountType: z.literal('bank'),
    ...bankAccountSchema.shape,
  }),
  z.object({
    accountType: z.literal('crypto'),
    ...cryptoWalletSchema.shape,
  }),
  z.object({
    accountType: z.literal('stripe'),
    ...stripeAccountSchema.shape,
  }),
  z.object({
    accountType: z.literal('paypal'),
    ...paypalAccountSchema.shape,
  }),
]);

export type BankInput = z.infer<typeof bankSchema>;
export type CreateBankInput = z.infer<typeof createBankSchema>;