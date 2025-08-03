"use client"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bubbles, CreditCard, Coins, MoreHorizontal, RefreshCw, Trash2, Plus, SquarePen } from 'lucide-react';
import { useState, useEffect } from 'react';

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

type BankAccountInput = Omit<BankAccount, 'id' | 'isDefault' | 'lastUpdated'>;
type CryptoWalletInput = Omit<CryptoWallet, 'id' | 'isDefault' | 'lastUpdated'>;
type StripeAccountInput = Omit<StripeAccount, 'id' | 'isDefault' | 'lastUpdated'>;
type PayPalAccountInput = Omit<PayPalAccount, 'id' | 'isDefault' | 'lastUpdated'>;
type AccountInput = BankAccountInput | CryptoWalletInput | StripeAccountInput | PayPalAccountInput;

interface SettingsListProps {
  title: string;
  description: string;
  accounts: Account[];
  onAddAccount: (account: AccountInput) => void;
  onDeleteAccount: (id: string) => void;
  onSetDefault: (id: string) => void;
  onRefreshAccount: (id: string) => void;
  onEditAccount: (id: string, account: AccountInput) => void;
  loading?: boolean;
}

// Simulated crypto rates (replace with API call later)
const getCryptoRate = (cryptoType: string): number => {
  const rates: { [key: string]: number } = {
    'BTC': 43250.75,
    'ETH': 2650.30,
    'USDT': 1.00,
    'USDC': 1.00,
    'SOL': 98.45,
    'MATIC': 0.85
  };
  return rates[cryptoType] || 0;
};

export default function SettingsList({
  title,
  description,
  accounts,
  onAddAccount,
  onDeleteAccount,
  onSetDefault,
  onRefreshAccount,
  onEditAccount,
  loading = false
}: SettingsListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'bank' | 'crypto' | 'stripe' | 'paypal'>('bank');
  const [country, setCountry] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bank form fields
  const [bankForm, setBankForm] = useState({
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    institutionNumber: '',
    transitNumber: '',
    iban: '',
    swiftCode: '',
    sortCode: '',
    bankName: '',
    bankAddress: '',
    currency: ''
  });

  // Crypto form fields
  const [cryptoForm, setCryptoForm] = useState({
    walletName: '',
    cryptoType: '',
    network: '',
    walletAddress: ''
  });

  // Stripe form fields
  const [stripeForm, setStripeForm] = useState({
    accountName: '',
    paymentLink: ''
  });

  // PayPal form fields
  const [paypalForm, setPaypalForm] = useState({
    accountName: '',
    paymentLink: ''
  });

  // Auto-set currency based on country
  useEffect(() => {
    if (country) {
      let defaultCurrency = '';
      switch (country) {
        case 'US':
          defaultCurrency = 'USD';
          break;
        case 'CA':
          defaultCurrency = 'CAD';
          break;
        case 'GB':
          defaultCurrency = 'GBP';
          break;
        case 'EU':
          defaultCurrency = 'EUR';
          break;
        case 'stripe':
          defaultCurrency = 'USD';
          break;
        case 'paypal':
          defaultCurrency = 'USD';
          break;
        case 'international':
          defaultCurrency = 'USD';
          break;
        default:
          defaultCurrency = 'USD';
      }
      setBankForm(prev => ({ ...prev, currency: defaultCurrency }));
    }
  }, [country]);

  const handleEditAccount = (id: string, account: AccountInput) => {
    setIsEditMode(true);
    setEditingAccountId(id);
    setIsAddDialogOpen(true);
    
    // Determine account type and populate form
    if (account.type === 'bank') {
      setAccountType('bank');
      setCountry(account.country || '');
      setBankForm({
        accountName: account.accountName || '',
        accountNumber: account.accountNumber || '',
        routingNumber: account.routingNumber || '',
        institutionNumber: account.institutionNumber || '',
        transitNumber: account.transitNumber || '',
        iban: account.iban || '',
        swiftCode: account.swiftCode || '',
        sortCode: account.sortCode || '',
        bankName: account.bankName || '',
        bankAddress: account.bankAddress || '',
        currency: account.currency || ''
      });
    } else if (account.type === 'crypto') {
      setAccountType('crypto');
      setCryptoForm({
        walletName: account.walletName || '',
        cryptoType: account.cryptoType || '',
        network: account.network || '',
        walletAddress: account.walletAddress || ''
      });
    } else if (account.type === 'stripe') {
      setAccountType('stripe');
      setStripeForm({
        accountName: account.accountName || '',
        paymentLink: account.paymentLink || ''
      });
    } else if (account.type === 'paypal') {
      setAccountType('paypal');
      setPaypalForm({
        accountName: account.accountName || '',
        paymentLink: account.paymentLink || ''
      });
    }
  };

  const getRequiredFields = (type: 'bank', country: string) => {
    switch (country) {
      case 'US':
        return ['accountName', 'accountNumber', 'routingNumber', 'bankName', 'currency'];
      case 'CA':
        return ['accountName', 'accountNumber', 'institutionNumber', 'transitNumber', 'bankName', 'currency'];
      case 'GB':
        return ['accountName', 'accountNumber', 'sortCode', 'bankName', 'currency'];
      case 'international':
        return ['accountName', 'accountNumber', 'bankName', 'currency'];
      default:
        return ['accountName', 'iban', 'swiftCode', 'bankName', 'currency'];
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (accountType === 'bank') {
        const requiredFields = getRequiredFields('bank', country);
        const hasAllRequired = requiredFields.every(field => 
          bankForm[field as keyof typeof bankForm]?.trim()
        );
        
        if (!hasAllRequired) {
          alert('Please fill in all required fields');
          return;
        }

        const bankAccount: BankAccountInput = {
          type: 'bank',
          accountName: bankForm.accountName,
          accountNumber: bankForm.accountNumber,
          routingNumber: bankForm.routingNumber,
          institutionNumber: bankForm.institutionNumber,
          transitNumber: bankForm.transitNumber,
          iban: bankForm.iban,
          swiftCode: bankForm.swiftCode,
          sortCode: bankForm.sortCode,
          bankName: bankForm.bankName,
          bankAddress: bankForm.bankAddress,
          country,
          currency: bankForm.currency
        };

        if (isEditMode && editingAccountId) {
          await onEditAccount(editingAccountId, bankAccount);
        } else {
          await onAddAccount(bankAccount);
        }
      } else if (accountType === 'crypto') {
        if (!cryptoForm.walletName || !cryptoForm.cryptoType || !cryptoForm.network || !cryptoForm.walletAddress) {
          alert('Please fill in all required fields');
          return;
        }

        const cryptoWallet: CryptoWalletInput = {
          type: 'crypto',
          walletName: cryptoForm.walletName,
          cryptoType: cryptoForm.cryptoType,
          network: cryptoForm.network,
          walletAddress: cryptoForm.walletAddress,
          usdRate: getCryptoRate(cryptoForm.cryptoType)
        };

        if (isEditMode && editingAccountId) {
          await onEditAccount(editingAccountId, cryptoWallet);
        } else {
          await onAddAccount(cryptoWallet);
        }
      } else if (accountType === 'stripe') {
        if (!stripeForm.accountName || !stripeForm.paymentLink) {
          alert('Please fill in all required fields');
          return;
        }

        const stripeAccount: StripeAccountInput = {
          type: 'stripe',
          accountName: stripeForm.accountName,
          paymentLink: stripeForm.paymentLink,
          currency: 'USD'
        };

        if (isEditMode && editingAccountId) {
          await onEditAccount(editingAccountId, stripeAccount);
        } else {
          await onAddAccount(stripeAccount);
        }
      } else if (accountType === 'paypal') {
        if (!paypalForm.accountName || !paypalForm.paymentLink) {
          alert('Please fill in all required fields');
          return;
        }

        const paypalAccount: PayPalAccountInput = {
          type: 'paypal',
          accountName: paypalForm.accountName,
          paymentLink: paypalForm.paymentLink,
          currency: 'USD'
        };

        if (isEditMode && editingAccountId) {
          await onEditAccount(editingAccountId, paypalAccount);
        } else {
          await onAddAccount(paypalAccount);
        }
      }

      setIsAddDialogOpen(false);
      resetForms();
    } catch (error) {
      console.error('Error adding/editing account:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForms = () => {
    setBankForm({
      accountName: '',
      accountNumber: '',
      routingNumber: '',
      institutionNumber: '',
      transitNumber: '',
      iban: '',
      swiftCode: '',
      sortCode: '',
      bankName: '',
      bankAddress: '',
      currency: ''
    });
    setCryptoForm({
      walletName: '',
      cryptoType: '',
      network: '',
      walletAddress: ''
    });
    setStripeForm({
      accountName: '',
      paymentLink: ''
    });
    setPaypalForm({
      accountName: '',
      paymentLink: ''
    });
    setCountry('');
    setIsEditMode(false);
    setEditingAccountId(null);
  };

  const renderBankForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Country *</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="EU">European Union</SelectItem>
              <SelectItem value="international">International</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="currency">Currency *</Label>
          <Select value={bankForm.currency} onValueChange={(value) => setBankForm({...bankForm, currency: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="accountName">Account Name *</Label>
        <Input
          id="accountName"
          value={bankForm.accountName}
          onChange={(e) => setBankForm({...bankForm, accountName: e.target.value})}
          placeholder="e.g., Main EUR Account"
        />
      </div>

      <div>
        <Label htmlFor="bankName">Bank Name *</Label>
        <Input
          id="bankName"
          value={bankForm.bankName}
          onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
          placeholder="Bank name"
        />
      </div>

      {country === 'US' && (
        <>
          <div>
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              value={bankForm.accountNumber}
              onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
              placeholder="Account number"
            />
          </div>
          <div>
            <Label htmlFor="routingNumber">Routing Number *</Label>
            <Input
              id="routingNumber"
              value={bankForm.routingNumber}
              onChange={(e) => setBankForm({...bankForm, routingNumber: e.target.value})}
              placeholder="Routing number"
            />
          </div>
        </>
      )}

      {country === 'CA' && (
        <>
          <div>
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              value={bankForm.accountNumber}
              onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
              placeholder="Account number"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="institutionNumber">Institution Number *</Label>
              <Input
                id="institutionNumber"
                value={bankForm.institutionNumber}
                onChange={(e) => setBankForm({...bankForm, institutionNumber: e.target.value})}
                placeholder="Institution number"
              />
            </div>
            <div>
              <Label htmlFor="transitNumber">Transit Number *</Label>
              <Input
                id="transitNumber"
                value={bankForm.transitNumber}
                onChange={(e) => setBankForm({...bankForm, transitNumber: e.target.value})}
                placeholder="Transit number"
              />
            </div>
          </div>
        </>
      )}

      {country === 'GB' && (
        <>
          <div>
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              value={bankForm.accountNumber}
              onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
              placeholder="Account number"
            />
          </div>
          <div>
            <Label htmlFor="sortCode">Sort Code *</Label>
            <Input
              id="sortCode"
              value={bankForm.sortCode}
              onChange={(e) => setBankForm({...bankForm, sortCode: e.target.value})}
              placeholder="Sort code"
            />
          </div>
        </>
      )}

      {country === 'EU' && (
        <>
          <div>
            <Label htmlFor="iban">IBAN *</Label>
            <Input
              id="iban"
              value={bankForm.iban}
              onChange={(e) => setBankForm({...bankForm, iban: e.target.value})}
              placeholder="IBAN"
            />
          </div>
          <div>
            <Label htmlFor="swiftCode">SWIFT/BIC Code *</Label>
            <Input
              id="swiftCode"
              value={bankForm.swiftCode}
              onChange={(e) => setBankForm({...bankForm, swiftCode: e.target.value})}
              placeholder="SWIFT/BIC code"
            />
          </div>
        </>
      )}

      {country === 'international' && (
        <div>
          <Label htmlFor="accountNumber">Account Number *</Label>
          <Input
            id="accountNumber"
            value={bankForm.accountNumber}
            onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
            placeholder="Account number"
          />
        </div>
      )}
    </div>
  );

  const renderCryptoForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="walletName">Wallet Name *</Label>
        <Input
          id="walletName"
          value={cryptoForm.walletName}
          onChange={(e) => setCryptoForm({...cryptoForm, walletName: e.target.value})}
          placeholder="e.g., My Bitcoin Wallet"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cryptoType">Cryptocurrency *</Label>
          <Select value={cryptoForm.cryptoType} onValueChange={(value) => setCryptoForm({...cryptoForm, cryptoType: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select cryptocurrency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
              <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
              <SelectItem value="USDT">Tether (USDT)</SelectItem>
              <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
              <SelectItem value="SOL">Solana (SOL)</SelectItem>
              <SelectItem value="MATIC">Polygon (MATIC)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="network">Network *</Label>
          <Select value={cryptoForm.network} onValueChange={(value) => setCryptoForm({...cryptoForm, network: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bitcoin">Bitcoin</SelectItem>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
              <SelectItem value="bsc">Binance Smart Chain</SelectItem>
              <SelectItem value="solana">Solana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="walletAddress">Wallet Address *</Label>
        <Input
          id="walletAddress"
          value={cryptoForm.walletAddress}
          onChange={(e) => setCryptoForm({...cryptoForm, walletAddress: e.target.value})}
          placeholder="Wallet address"
        />
      </div>

      {cryptoForm.cryptoType && (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          Current rate: 1 {cryptoForm.cryptoType} = ${getCryptoRate(cryptoForm.cryptoType).toLocaleString()} USD
        </div>
      )}
    </div>
  );

  const renderStripeForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="stripeAccountName">Account Name *</Label>
        <Input
          id="stripeAccountName"
          value={stripeForm.accountName}
          onChange={(e) => setStripeForm({...stripeForm, accountName: e.target.value})}
          placeholder="e.g., Stripe Business Account"
        />
      </div>

      <div>
        <Label htmlFor="stripePaymentLink">Payment Link *</Label>
        <Input
          id="stripePaymentLink"
          value={stripeForm.paymentLink}
          onChange={(e) => setStripeForm({...stripeForm, paymentLink: e.target.value})}
          placeholder="https://checkout.stripe.com/..."
        />
      </div>

      <div className="text-sm text-gray-500">
        Currency: USD (fixed for Stripe)
      </div>
    </div>
  );

  const renderPayPalForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="paypalAccountName">Account Name *</Label>
        <Input
          id="paypalAccountName"
          value={paypalForm.accountName}
          onChange={(e) => setPaypalForm({...paypalForm, accountName: e.target.value})}
          placeholder="e.g., PayPal Business Account"
        />
      </div>

      <div>
        <Label htmlFor="paypalPaymentLink">Payment Link *</Label>
        <Input
          id="paypalPaymentLink"
          value={paypalForm.paymentLink}
          onChange={(e) => setPaypalForm({...paypalForm, paymentLink: e.target.value})}
          placeholder="https://www.paypal.com/..."
        />
      </div>

      <div className="text-sm text-gray-500">
        Currency: USD (fixed for PayPal)
      </div>
    </div>
  );

  const renderForm = () => {
    switch (accountType) {
      case 'bank':
        return renderBankForm();
      case 'crypto':
        return renderCryptoForm();
      case 'stripe':
        return renderStripeForm();
      case 'paypal':
        return renderPayPalForm();
      default:
        return null;
    }
  };

  const getAccountIcon = (account: Account) => {
    switch (account.type) {
      case 'bank':
        return <CreditCard className="h-8 w-8 text-blue-600" />;
      case 'crypto':
        return <Coins className="h-8 w-8 text-yellow-600" />;
      case 'stripe':
        return <CreditCard className="h-8 w-8 text-purple-600" />;
      case 'paypal':
        return <CreditCard className="h-8 w-8 text-blue-500" />;
      default:
        return <CreditCard className="h-8 w-8 text-gray-600" />;
    }
  };

  const getAccountDisplayName = (account: Account) => {
    switch (account.type) {
      case 'bank':
        return account.accountName;
      case 'crypto':
        return account.walletName;
      case 'stripe':
        return account.accountName;
      case 'paypal':
        return account.accountName;
      default:
        return 'Unknown Account';
    }
  };

  const getAccountSubtitle = (account: Account) => {
    switch (account.type) {
      case 'bank':
        return account.bankName;
      case 'crypto':
        const rateDisplay = account.usdRate ? ` - $${account.usdRate.toLocaleString()}` : '';
        return `${account.cryptoType} (${account.network})${rateDisplay}`;
      case 'stripe':
        return 'Stripe Payment';
      case 'paypal':
        return 'PayPal Payment';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getAccountIcon(account)}
              <div>
                <p className="font-medium">
                  {getAccountDisplayName(account)}
                </p>
                <p className="text-sm text-gray-500">
                  {getAccountSubtitle(account)}
                </p>
                <p className="text-xs text-gray-400">
                  Updated {account.lastUpdated}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={account.isDefault}
                onCheckedChange={() => onSetDefault(account.id)}
                disabled={loading}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRefreshAccount(account.id)}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditAccount(account.id, account)}
                disabled={loading}
              >
                <SquarePen className="h-4 w-4 text-blue-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteAccount(account.id)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Account' : 'Add New Account'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Account Type</Label>
                <Select value={accountType} onValueChange={(value: 'bank' | 'crypto' | 'stripe' | 'paypal') => setAccountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency Wallet</SelectItem>
                    <SelectItem value="stripe">Stripe Payment (USD)</SelectItem>
                    <SelectItem value="paypal">PayPal Payment (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderForm()}

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForms();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Bubbles className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    isEditMode ? 'Update Account' : 'Add Account'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}