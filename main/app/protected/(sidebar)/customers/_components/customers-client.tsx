'use client'

import React, { useRef, useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import CreateSearchFilter from "@/components/general/create-search-filter"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent,SheetClose, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Bubbles, Trash2 } from "lucide-react"
import CustomerTable from './customer-table'
import CustomerForm from './customer-form'
import { FilterTag } from '@/components/filtering/search-filter'
import { 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import ConfirmModal from '@/components/modal/confirm-modal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import EditCustomer from './edit-customer'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  website?: string
  contactPerson?: string
  address?: string
  addressLine2?: string
  invoiceCount: number
  projectCount: number
  receiptCount: number
  feedbackCount: number
  rating: number
  created_at: string
  lastActivity: string
  avatar?: string
}

const fetchCustomers = async (): Promise<Customer[]> => {
  const response = await axios.get('/api/customers');
  if (response.data.success) {
    return response.data.customers;
  }
  throw new Error(response.data.message || 'Error fetching customers');
};

export default function CustomersClient() {
  const queryClient = useQueryClient();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false)
  const [filterTags, setFilterTags] = useState<FilterTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [activeFilters, setActiveFilters] = useState<{
    createdAt: string[];
    rating: string[];
  }>({
    createdAt: [],
    rating: []
  });

  const { 
    data: customers = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: fetchCustomers
  });

  // Initialize from URL params
  useEffect(() => {
    const query = searchParams.get('query') || '';
    setSearchQuery(query);
    
    // Initialize filters from URL
    const createdAtParams = searchParams.getAll('createdAt');
    const ratingParams = searchParams.getAll('rating');
    
    setActiveFilters({
      createdAt: createdAtParams,
      rating: ratingParams
    });

    // Update filter tags based on URL params
    const tags: FilterTag[] = [];
    createdAtParams.forEach(value => {
      tags.push({
        key: `createdAt-${value}`,
        label: 'Created',
        value: getDisplayValue('createdAt', value)
      });
    });
    ratingParams.forEach(value => {
      tags.push({
        key: `rating-${value}`,
        label: 'Rating',
        value: getDisplayValue('rating', value)
      });
    });
    setFilterTags(tags);

    // Sync selected customer with URL customerId
    const customerId = searchParams.get('customerId');
    setSelectedCustomerId(customerId);
  }, [searchParams]);

  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply created at filter
    if (activeFilters.createdAt.length > 0) {
      filtered = filtered.filter(customer => {
        const createdDate = new Date(customer.created_at);
        const now = new Date();
        
        return activeFilters.createdAt.some(period => {
          switch (period) {
            case 'last24Hours':
              return now.getTime() - createdDate.getTime() <= 24 * 60 * 60 * 1000;
            case '3days':
              return now.getTime() - createdDate.getTime() <= 3 * 24 * 60 * 60 * 1000;
            case 'lastWeek':
              return now.getTime() - createdDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
            case 'lastMonth':
              return now.getTime() - createdDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
            case '3months':
              return now.getTime() - createdDate.getTime() <= 90 * 24 * 60 * 60 * 1000;
            case '6months':
              return now.getTime() - createdDate.getTime() <= 180 * 24 * 60 * 60 * 1000;
            case '12months':
              return now.getTime() - createdDate.getTime() <= 365 * 24 * 60 * 60 * 1000;
            default:
              return true;
          }
        });
      });
    }

    // Apply rating filter
    if (activeFilters.rating.length > 0) {
      filtered = filtered.filter(customer => {
        return activeFilters.rating.some(ratingRange => {
          switch (ratingRange) {
            case '80-100':
              return customer.rating >= 80 && customer.rating <= 100;
            case '60-79':
              return customer.rating >= 60 && customer.rating < 80;
            case '40-59':
              return customer.rating >= 40 && customer.rating < 60;
            case '20-39':
              return customer.rating >= 20 && customer.rating < 40;
            case '0-19':
              return customer.rating >= 0 && customer.rating < 20;
            default:
              return true;
          }
        });
      });
    }

    return filtered;
  }, [customers, searchQuery, activeFilters]);

  const customerBeingEdited = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId)
  }, [customers, selectedCustomerId])

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      return axios.delete(`/api/customers/${customerId}`);
    },
    onSuccess: () => {
      toast.success("Customer deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.delete('customerId');
      const newUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
      router.replace(newUrl);
    },
    onError: (error: any) => {
      console.error("Delete customer error:", error.response?.data);
      const errorMessage = error.response?.data?.error || "Failed to delete customer";
      toast.error(errorMessage);
    },
  });

  const updateURL = (newFilters: typeof activeFilters, search?: string) => {
    const params = new URLSearchParams(searchParams);
    
    // Update search query
    if (search !== undefined) {
      if (search) {
        params.set('query', search);
      } else {
        params.delete('query');
      }
    }

    // Clear existing filter params
    params.delete('createdAt');
    params.delete('rating');

    // Add new filter params
    newFilters.createdAt.forEach(value => params.append('createdAt', value));
    newFilters.rating.forEach(value => params.append('rating', value));

    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    updateURL(activeFilters, value);
  };

  const handleFilterChange = (filterType: 'createdAt' | 'rating', value: string, checked: boolean) => {
    const newFilters = { ...activeFilters };
    if (checked) {
      newFilters[filterType] = [...newFilters[filterType], value];
    } else {
      newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
    }
    
    setActiveFilters(newFilters);
    updateURL(newFilters);
    updateFilterTags(filterType, value, checked);
  };

  const updateFilterTags = (filterType: 'createdAt' | 'rating', value: string, checked: boolean) => {
    setFilterTags(prev => {
      const key = `${filterType}-${value}`;
      if (checked) {
        const label = filterType === 'createdAt' ? 'Created' : 'Rating';
        const displayValue = getDisplayValue(filterType, value);
        return [...prev, { key, label, value: displayValue }];
      } else {
        return prev.filter(tag => tag.key !== key);
      }
    });
  };

  const getDisplayValue = (filterType: 'createdAt' | 'rating', value: string) => {
    if (filterType === 'createdAt') {
      switch (value) {
        case 'last24Hours': return 'Last 24 hours';
        case '3days': return '3 days';
        case 'lastWeek': return 'Last week';
        case 'lastMonth': return 'Last month';
        case '3months': return '3 months';
        case '6months': return '6 months';
        case '12months': return '12 months';
        default: return value;
      }
    } else {
      switch (value) {
        case '80-100': return '80% - 100%';
        case '60-79': return '60% - 79%';
        case '40-59': return '40% - 59%';
        case '20-39': return '20% - 39%';
        case '0-19': return '0% - 19%';
        default: return value;
      }
    }
  };

  const handleRemoveFilter = (key: string) => {
    const [filterType, value] = key.split('-') as ['createdAt' | 'rating', string];
    handleFilterChange(filterType, value, false);
  };

  const handleClearAllFilters = () => {
    setActiveFilters({ createdAt: [], rating: [] });
    setFilterTags([]);
    updateURL({ createdAt: [], rating: [] });
  };

  const handleCustomerSelect = (customerId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('customerId', customerId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreateSuccess = () => {
    closeRef.current?.click();
    // Remove createCustomer param
    const params = new URLSearchParams(searchParams);
    params.delete('createCustomer');
    router.replace(`${pathname}?${params.toString()}`);
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleEditSuccess = () => {
    setSelectedCustomerId(null);
    // Remove customerId param
    const params = new URLSearchParams(searchParams);
    params.delete('customerId');
    router.replace(`${pathname}?${params.toString()}`);
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleCloseSheet = () => {
    router.push("/protected/customers");
    setSelectedCustomerId(null);
  };

  const handleCreateCancel = () => {
    closeRef.current?.click();
    const params = new URLSearchParams(searchParams);
    params.delete('createCustomer');
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleDeleteFromSheet = () => {
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedCustomerId) {
      deleteCustomerMutation.mutate(selectedCustomerId)
    }
    setDeleteModalOpen(false)
  }

  const footer = (
    <>
      <SheetClose asChild>
        <Button variant="ghost" ref={closeRef}>Cancel</Button>
      </SheetClose>
      <Button type="submit" form="customer-form" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.5s]" />
            Creating customer...
          </>
        ) : (
          'Create Customer'
        )}
      </Button>
    </>
  );

  const editFooter = (
    <>
      <SheetClose asChild>
        <Button variant="ghost" onClick={handleCloseSheet}>Cancel</Button>
      </SheetClose>
      <Button type="submit" form="edit-customer-form" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.5s]" />
            Updating customer...
          </>
        ) : (
          'Update Customer'
        )}
      </Button>
    </>
  );

  const filterContent = (
    <div className="p-2">
      <DropdownMenuLabel>Filter customers</DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      {/* Created At Filter */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Created At</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuCheckboxItem
            checked={activeFilters.createdAt.includes('last24Hours')}
            onCheckedChange={(checked) => handleFilterChange('createdAt', 'last24Hours', checked)}
          >
            Last 24 hours
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.createdAt.includes('3days')}
            onCheckedChange={(checked) => handleFilterChange('createdAt', '3days', checked)}
          >
            3 days
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.createdAt.includes('lastWeek')}
            onCheckedChange={(checked) => handleFilterChange('createdAt', 'lastWeek', checked)}
          >
            Last week
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.createdAt.includes('lastMonth')}
            onCheckedChange={(checked) => handleFilterChange('createdAt', 'lastMonth', checked)}
          >
            Last month
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.createdAt.includes('3months')}
            onCheckedChange={(checked) => handleFilterChange('createdAt', '3months', checked)}
          >
            3 months
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.createdAt.includes('6months')}
            onCheckedChange={(checked) => handleFilterChange('createdAt', '6months', checked)}
          >
            6 months
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.createdAt.includes('12months')}
            onCheckedChange={(checked) => handleFilterChange('createdAt', '12months', checked)}
          >
            12 months
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      
      <DropdownMenuSeparator />
      
      {/* Rating Filter */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Rating</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuCheckboxItem
            checked={activeFilters.rating.includes('80-100')}
            onCheckedChange={(checked) => handleFilterChange('rating', '80-100', checked)}
          >
             (80% - 100%)
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.rating.includes('60-79')}
            onCheckedChange={(checked) => handleFilterChange('rating', '60-79', checked)}
          >
           (60% - 79%)
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.rating.includes('40-59')}
            onCheckedChange={(checked) => handleFilterChange('rating', '40-59', checked)}
          >
             (40% - 59%)
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.rating.includes('20-39')}
            onCheckedChange={(checked) => handleFilterChange('rating', '20-39', checked)}
          >
             (20% - 39%)
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={activeFilters.rating.includes('0-19')}
            onCheckedChange={(checked) => handleFilterChange('rating', '0-19', checked)}
          >
             (0% - 19%)
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </div>
  );

  if (isLoading) {
    return <div className="p-8">Loading customers...</div>;
  }

  if (isError) {
    return <div className="p-8">Error fetching customers: {(error as Error).message}</div>;
  }

  return (
    <>
      <CreateSearchFilter 
        placeholder="Search customers..." 
        onSearch={handleSearch}
        filterContent={filterContent}
        filterTags={filterTags}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        sheetTriggerText="New Customer"
        sheetTitle="New Customer"
        sheetContent={<CustomerForm onSuccess={handleCreateSuccess} onLoadingChange={setIsSubmitting} />}
        sheetContentClassName='w-full sm:w-3/4 md:w-1/2 lg:w-[40%]'
        footer={footer}
        closeRef={closeRef}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={customerBeingEdited?.name || "this customer"}
        itemType="Customer"
        isLoading={deleteCustomerMutation.isPending}
      />

      {/* Edit Customer Sheet */}
      <Sheet open={!!selectedCustomerId} onOpenChange={open => { if (!open) handleCloseSheet(); }}>
        <SheetContent 
          side="right" 
          bounce="right" 
          withGap={true} 
          className="w-full flex flex-col p-0 sm:w-3/4 md:w-1/2 lg:w-[40%]"
        >
          <SheetHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>Edit Customer</SheetTitle>
              {selectedCustomerId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-none border-destructive text-destructive hover:bg-destructive/10 mr-7 hover:text-destructive"
                  onClick={handleDeleteFromSheet}
                  disabled={deleteCustomerMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Customer
                </Button>
              )}
            </div>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            <div className="p-4">
              {customerBeingEdited && <EditCustomer customer={customerBeingEdited} onSuccess={handleEditSuccess} onLoadingChange={setIsSubmitting} />}
            </div>
          </ScrollArea>
          <SheetFooter className="p-4 border-t">
            {editFooter}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="mt-6">
        <CustomerTable 
          customer={filteredCustomers} 
          onCustomerSelect={handleCustomerSelect}
        />
      </div>
    </>
  )
} 