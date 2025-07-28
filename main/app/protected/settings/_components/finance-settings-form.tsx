"use client"
import SettingsList from '@/components/settings/settings-list';
import { useState } from 'react';

interface BankAccount {
  id: string;
  type: 'bank';
  accountName: string;
  accountNumber?: string;
  routingNumber?: string;
  institutionNumber?: string;
  transitNumber?: string;
  iban?: string;
  swiftCode?: string;
  sortCode?: string;
  bankName: string;
  bankAddress?: string;
  country: string;
  currency: string;
  isDefault: boolean;
  lastUpdated: string;
}

interface CryptoWallet {
  id: string;
  type: 'crypto';
  walletName: string;
  cryptoType: string;
  network: string;
  walletAddress: string;
  usdRate?: number;
  isDefault: boolean;
  lastUpdated: string;
}

interface StripeAccount {
  id: string;
  type: 'stripe';
  accountName: string;
  paymentLink: string;
  currency: string;
  isDefault: boolean;
  lastUpdated: string;
}

interface PayPalAccount {
  id: string;
  type: 'paypal';
  accountName: string;
  paymentLink: string;
  currency: string;
  isDefault: boolean;
  lastUpdated: string;
}

type Account = BankAccount | CryptoWallet | StripeAccount | PayPalAccount;

export default function FinanceSettingsForm() {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      type: 'bank',
      accountName: 'Main Business Account',
      bankName: 'Chase Bank',
      accountNumber: '****1234',
      routingNumber: '021000021',
      country: 'US',
      currency: 'USD',
      isDefault: true,
      lastUpdated: 'about 14 hours ago via Plaid'
    },
    {
      id: '2',
      type: 'crypto',
      walletName: 'Bitcoin Wallet',
      cryptoType: 'BTC',
      network: 'bitcoin',
      walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      usdRate: 43250.75,
      isDefault: false,
      lastUpdated: '2 days ago'
    },
    {
      id: '3',
      type: 'crypto',
      walletName: 'Solana Wallet',
      cryptoType: 'SOL',
      network: 'solana',
      walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      usdRate: 98.45,
      isDefault: false,
      lastUpdated: '1 day ago'
    },
    {
      id: '4',
      type: 'stripe',
      accountName: 'Stripe Business',
      paymentLink: 'https://checkout.stripe.com/pay/cs_test_a1...',
      currency: 'USD',
      isDefault: false,
      lastUpdated: '1 day ago'
    },
    {
      id: '5',
      type: 'paypal',
      accountName: 'PayPal Business',
      paymentLink: 'https://www.paypal.com/paypalme/business',
      currency: 'USD',
      isDefault: false,
      lastUpdated: '3 days ago'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleAddAccount = async (accountInput: any) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newAccount: Account = {
      id: Date.now().toString(),
      ...accountInput,
      isDefault: accounts.length === 0, // First account becomes default
      lastUpdated: 'just now'
    };
    
    setAccounts(prev => [...prev, newAccount]);
    setIsLoading(false);
  };

  const handleDeleteAccount = async (id: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAccounts(prev => prev.filter(account => account.id !== id));
    setIsLoading(false);
  };

  const handleSetDefault = async (id: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAccounts(prev => prev.map(account => ({
      ...account,
      isDefault: account.id === id
    })));
    setIsLoading(false);
  };

  const handleRefreshAccount = async (id: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setAccounts(prev => prev.map(account => 
      account.id === id 
        ? { ...account, lastUpdated: 'just now' }
        : account
    ));
    setIsLoading(false);
  };

  return (
    <SettingsList
      title="Accounts"
      description="Manage bank accounts, update or connect new ones."
      accounts={accounts}
      onAddAccount={handleAddAccount}
      onDeleteAccount={handleDeleteAccount}
      onSetDefault={handleSetDefault}
      onRefreshAccount={handleRefreshAccount}
      loading={isLoading}
    />
  );
}