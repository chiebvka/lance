"use client"
import SettingsList from '@/components/settings/settings-list';
import { useBanks, Bank, BankInput } from '@/hooks/banks/use-banks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import FinanceSkeleton from '../finance/_components/finance-skeleton';

export default function FinanceSettingsForm() {
  const { data: banks, isLoading, error } = useBanks();
  const queryClient = useQueryClient();



  // Mutation for creating a new bank account
  const createBankMutation = useMutation({
    mutationFn: async (bankData: BankInput) => {
      const response = await axios.post('/api/banks/create', bankData);
      return response.data;
    },
    onMutate: async (newBank) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['banks'] });

      // Snapshot the previous value
      const previousBanks = queryClient.getQueryData(['banks']);

      // Optimistically update to the new value
      queryClient.setQueryData(['banks'], (old: Bank[] | undefined) => {
        if (!old) return old;
        
        // Check if this is the first bank
        const isFirstBank = old.length === 0;
        
        const optimisticBank: Bank = {
          id: crypto.randomUUID(), // Proper UUID for optimistic update
          accountName: newBank.accountName || null,
          accountNumber: newBank.accountNumber || null,
          routingNumber: newBank.routingNumber || null,
          institutionNumber: newBank.institutionNumber || null,
          transitNumber: newBank.transitNumber || null,
          iban: newBank.iban || null,
          swiftCode: newBank.swiftCode || null,
          sortCode: newBank.sortCode || null,
          bankName: newBank.bankName || null,
          bankAddress: newBank.bankAddress || null,
          country: newBank.country || null,
          currency: newBank.currency || null,
          isDefault: isFirstBank, // First bank is default
          type: 'bankOther', // Default type for optimistic update
          stripePaymentLink: newBank.stripePaymentLink || null,
          paypalPaymentLink: newBank.paypalPaymentLink || null,
          organizationId: null,
          createdBy: null,
          created_at: new Date().toISOString(),
          updatedAt: null
        };

        return [optimisticBank, ...old];
      });

      // Return a context object with the snapshotted value
      return { previousBanks };
    },
    onSuccess: (data) => {
      toast.success("Bank account created successfully!", {
        description: "Your new payment method has been added.",
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value
      if (context?.previousBanks) {
        queryClient.setQueryData(['banks'], context.previousBanks);
      }
      
      console.error("Error creating bank:", error);
      let errorMessage = "Failed to create bank account. Please try again.";
      if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error("Creation failed", { description: errorMessage });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['banks'] });
    },
  });

  // Mutation for updating a bank account
  const updateBankMutation = useMutation({
    mutationFn: async ({ id, ...bankData }: { id: string } & BankInput) => {
      const response = await axios.patch(`/api/banks/${id}`, bankData);
      return response.data;
    },
    onMutate: async ({ id, ...bankData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['banks'] });

      // Snapshot the previous value
      const previousBanks = queryClient.getQueryData(['banks']);

      // Optimistically update to the new value
      queryClient.setQueryData(['banks'], (old: Bank[] | undefined) => {
        if (!old) return old;
        return old.map(bank => 
          bank.id === id 
            ? { ...bank, ...bankData, updatedAt: new Date().toISOString() }
            : bank
        );
      });

      // Return a context object with the snapshotted value
      return { previousBanks };
    },
    onSuccess: (data) => {
      toast.success("Bank account updated successfully!", {
        description: "Your payment method has been updated.",
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value
      if (context?.previousBanks) {
        queryClient.setQueryData(['banks'], context.previousBanks);
      }
      
      console.error("Error updating bank:", error);
      let errorMessage = "Failed to update bank account. Please try again.";
      if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || "Cannot remove default status. At least one payment method must remain as default.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error("Update failed", { description: errorMessage });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['banks'] });
    },
  });

  // Mutation for simple bank updates (like default status)
  const updateBankSimpleMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string; isDefault?: boolean }) => {
      const response = await axios.patch(`/api/banks/${id}`, updateData);
      return response.data;
    },
    onMutate: async ({ id, ...updateData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['banks'] });

      // Snapshot the previous value
      const previousBanks = queryClient.getQueryData(['banks']);

      // Optimistically update to the new value
      queryClient.setQueryData(['banks'], (old: Bank[] | undefined) => {
        if (!old) return old;
        return old.map(bank => 
          bank.id === id 
            ? { ...bank, ...updateData, updatedAt: new Date().toISOString() }
            : bank
        );
      });

      // Return a context object with the snapshotted value
      return { previousBanks };
    },
    onSuccess: (data) => {
      toast.success("Default status updated successfully!", {
        description: "Your default payment method has been updated.",
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value
      if (context?.previousBanks) {
        queryClient.setQueryData(['banks'], context.previousBanks);
      }
      
      console.error("Error updating bank:", error);
      let errorMessage = "Failed to update default status. Please try again.";
      if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || "Cannot remove default status. At least one payment method must remain as default.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error("Update failed", { description: errorMessage });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['banks'] });
    },
  });

  // Mutation for simple bank edits (like name, account number, etc.)
  const editBankSimpleMutation = useMutation({
    mutationFn: async ({ id, ...editData }: { id: string; accountName?: string; accountNumber?: string; routingNumber?: string; institutionNumber?: string; transitNumber?: string; iban?: string; swiftCode?: string; sortCode?: string; bankName?: string; bankAddress?: string; country?: string; currency?: string; stripePaymentLink?: string; paypalPaymentLink?: string; walletName?: string; cryptoType?: string; network?: string; walletAddress?: string; paymentLink?: string }) => {
      const response = await axios.patch(`/api/banks/${id}`, editData);
      return response.data;
    },
    onMutate: async ({ id, ...editData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['banks'] });

      // Snapshot the previous value
      const previousBanks = queryClient.getQueryData(['banks']);

      // Optimistically update to the new value
      queryClient.setQueryData(['banks'], (old: Bank[] | undefined) => {
        if (!old) return old;
        return old.map(bank => 
          bank.id === id 
            ? { ...bank, ...editData, updatedAt: new Date().toISOString() }
            : bank
        );
      });

      // Return a context object with the snapshotted value
      return { previousBanks };
    },
    onSuccess: (data) => {
      toast.success("Bank account updated successfully!", {
        description: "Your payment method has been updated.",
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value
      if (context?.previousBanks) {
        queryClient.setQueryData(['banks'], context.previousBanks);
      }
      
      console.error("Error updating bank:", error);
      let errorMessage = "Failed to update bank account. Please try again.";
      if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error("Update failed", { description: errorMessage });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['banks'] });
    },
  });

  // Mutation for deleting a bank account
  const deleteBankMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/banks/${id}`);
      return response.data;
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['banks'] });

      // Snapshot the previous value
      const previousBanks = queryClient.getQueryData(['banks']);

      // Optimistically update to the new value
      queryClient.setQueryData(['banks'], (old: Bank[] | undefined) => {
        if (!old) return old;
        return old.filter(bank => bank.id !== id);
      });

      // Return a context object with the snapshotted value
      return { previousBanks };
    },
    onSuccess: (data) => {
      toast.success("Bank account deleted successfully!", {
        description: "Your payment method has been removed.",
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value
      if (context?.previousBanks) {
        queryClient.setQueryData(['banks'], context.previousBanks);
      }
      
      console.error("Error deleting bank:", error);
      let errorMessage = "Failed to delete bank account. Please try again.";
      if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error("Delete failed", { description: errorMessage });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['banks'] });
    },
  });

  // Convert banks to the format expected by SettingsList
  const accounts = banks?.map(bank => {
    // Determine the account type based on the database type
    let accountType: 'bank' | 'crypto' | 'stripe' | 'paypal';
    let accountData: any = {
      id: bank.id.toString(),
      isDefault: bank.isDefault || false,
      lastUpdated: bank.updatedAt ? new Date(bank.updatedAt).toLocaleDateString() : 'Never'
    };

    if (bank.type === 'crypto') {
      accountType = 'crypto';
      accountData = {
        ...accountData,
        type: accountType,
        walletName: bank.accountName || '',
        cryptoType: bank.routingNumber || '', // crypto type is stored in routingNumber
        network: bank.institutionNumber || '', // network is stored in institutionNumber
        walletAddress: bank.accountNumber || '', // wallet address is stored in accountNumber
      };
    } else if (bank.type === 'stripe') {
      accountType = 'stripe';
      accountData = {
        ...accountData,
        type: accountType,
        accountName: bank.accountName || '',
        paymentLink: bank.stripePaymentLink || '',
        currency: 'USD',
      };
    } else if (bank.type === 'paypal') {
      accountType = 'paypal';
      accountData = {
        ...accountData,
        type: accountType,
        accountName: bank.accountName || '',
        paymentLink: bank.paypalPaymentLink || '',
        currency: 'USD',
      };
    } else {
      // All bank types (bankUs, bankCanada, bankUk, bankEurope, bankOther)
      accountType = 'bank';
      accountData = {
        ...accountData,
        type: accountType,
        accountName: bank.accountName || '',
        accountNumber: bank.accountNumber || undefined,
        routingNumber: bank.routingNumber || undefined,
        institutionNumber: bank.institutionNumber || undefined,
        transitNumber: bank.transitNumber || undefined,
        iban: bank.iban || undefined,
        swiftCode: bank.swiftCode || undefined,
        sortCode: bank.sortCode || undefined,
        bankName: bank.bankName || '',
        bankAddress: bank.bankAddress || undefined,
        country: bank.country || '',
        currency: bank.currency || '',
      };
    }

    return accountData;
  }) || [];

  const handleAddAccount = async (accountInput: any) => {
    // For crypto wallets, use walletName as accountName
    if (accountInput.type === 'crypto') {
      const bankData: BankInput = {
        accountType: 'crypto',
        walletName: accountInput.walletName, // Use walletName as accountName
        cryptoType: accountInput.cryptoType,
        network: accountInput.network,
        walletAddress: accountInput.walletAddress,
        // Let the API handle default logic
      };

      createBankMutation.mutate(bankData);
    } else if (accountInput.type === 'stripe') {
      const bankData: BankInput = {
        accountType: 'stripe',
        accountName: accountInput.accountName,
        paymentLink: accountInput.paymentLink,
        // Let the API handle default logic
      };

      createBankMutation.mutate(bankData);
    } else if (accountInput.type === 'paypal') {
      const bankData: BankInput = {
        accountType: 'paypal',
        accountName: accountInput.accountName,
        paymentLink: accountInput.paymentLink,
        // Let the API handle default logic
      };

      createBankMutation.mutate(bankData);
    } else {
      // For bank accounts, let the API handle default logic
      const bankData: BankInput = {
        accountType: 'bank',
        accountName: accountInput.accountName,
        accountNumber: accountInput.accountNumber,
        routingNumber: accountInput.routingNumber,
        institutionNumber: accountInput.institutionNumber,
        transitNumber: accountInput.transitNumber,
        iban: accountInput.iban,
        swiftCode: accountInput.swiftCode,
        sortCode: accountInput.sortCode,
        bankName: accountInput.bankName,
        bankAddress: accountInput.bankAddress,
        country: accountInput.country,
        currency: accountInput.currency,
        stripePaymentLink: accountInput.stripePaymentLink,
        paypalPaymentLink: accountInput.paypalPaymentLink
      };

      createBankMutation.mutate(bankData);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    deleteBankMutation.mutate(id);
  };

  const handleSetDefault = async (id: string) => {
    const bankId = id;
    
    // Find the current bank to see if it's already default
    const currentBank = banks?.find(bank => bank.id === bankId);
    
    if (currentBank?.isDefault) {
      // If it's already default, try to turn it off
      updateBankSimpleMutation.mutate({ id: bankId, isDefault: false });
    } else {
      // If it's not default, set it as default
      updateBankSimpleMutation.mutate({ id: bankId, isDefault: true });
    }
  };

  const handleRefreshAccount = async (id: string) => {
    // This could be used to refresh account data from external services
    // For now, we'll just update the timestamp
    const bankId = id;
    updateBankMutation.mutate({ id: bankId, accountType: 'bank' });
  };

  const handleEditAccount = async (id: string, accountInput: any) => {
    // For simple edits, use the simple mutation
    const editData: any = {};
    
    // Map the form data to the correct fields based on account type
    if (accountInput.type === 'crypto') {
      editData.accountName = accountInput.walletName;
      editData.routingNumber = accountInput.cryptoType; // crypto type
      editData.institutionNumber = accountInput.network; // network
      editData.accountNumber = accountInput.walletAddress; // wallet address
    } else if (accountInput.type === 'stripe') {
      editData.accountName = accountInput.accountName;
      editData.stripePaymentLink = accountInput.paymentLink;
    } else if (accountInput.type === 'paypal') {
      editData.accountName = accountInput.accountName;
      editData.paypalPaymentLink = accountInput.paymentLink;
    } else {
      // Bank accounts
      editData.accountName = accountInput.accountName;
      editData.accountNumber = accountInput.accountNumber;
      editData.routingNumber = accountInput.routingNumber;
      editData.institutionNumber = accountInput.institutionNumber;
      editData.transitNumber = accountInput.transitNumber;
      editData.iban = accountInput.iban;
      editData.swiftCode = accountInput.swiftCode;
      editData.sortCode = accountInput.sortCode;
      editData.bankName = accountInput.bankName;
      editData.bankAddress = accountInput.bankAddress;
      editData.country = accountInput.country;
      editData.currency = accountInput.currency;
    }

    editBankSimpleMutation.mutate({ id, ...editData });
  };


      // ▷ EARLY–RETURN YOUR SKELETON ◁
      if (isLoading) {
        return <FinanceSkeleton />
      }
      if (error) {
        return <div className="p-4 text-red-500">Error loading payment methods.</div>
      }

  return (
    <SettingsList
      title="Payment Methods"
      description="Manage bank accounts and payment methods for your organization."
      accounts={accounts}
      onAddAccount={handleAddAccount}
      onDeleteAccount={handleDeleteAccount}
      onSetDefault={handleSetDefault}
      onRefreshAccount={handleRefreshAccount}
      onEditAccount={handleEditAccount}
      loading={createBankMutation.isPending || updateBankMutation.isPending || updateBankSimpleMutation.isPending || editBankSimpleMutation.isPending || deleteBankMutation.isPending}
    />
  );
}