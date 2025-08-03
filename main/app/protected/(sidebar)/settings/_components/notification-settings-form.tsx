"use client"
import SettingsSwitch from '@/components/settings/settings-switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/hooks/organizations/use-organization';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useState } from 'react';

export default function NotificationSettingsForm() {
  const { data: organization, isLoading, error } = useOrganization();
  const queryClient = useQueryClient();

  // Track user input separately from organization data
  const [userInputs, setUserInputs] = useState<{
    invoiceNotifications?: boolean;
    projectNotifications?: boolean;
    feedbackNotifications?: boolean;
  }>({});

  

  // Handle error
  if (error) {
    throw error;
  }

  // Helper to get current value (user input or organization data)
  const getCurrentValue = (field: 'invoiceNotifications' | 'projectNotifications' | 'feedbackNotifications') => {
    const userInput = userInputs[field];
    const orgValue = organization?.[field];
    const finalValue = userInput ?? orgValue ?? true; // Default to true if not set
    
 
    
    return finalValue;
  };

  // Helper to update user input
  const updateUserInput = (field: 'invoiceNotifications' | 'projectNotifications' | 'feedbackNotifications', value: boolean) => {

    
    setUserInputs(prev => {
      const newInputs = { ...prev, [field]: value };
      return newInputs;
    });
  };

  // Mutation for updating notification settings
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (settings: {
      invoiceNotifications: boolean;
      projectNotifications: boolean;
      feedbackNotifications: boolean;
    }) => {
      const response = await axios.patch('/api/notifications', {
        action: 'update_notification_settings',
        notificationSettings: settings
      });
      return response.data;
    },
    onMutate: async (settings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['organization'] });

      // Snapshot the previous value
      const previousOrganization = queryClient.getQueryData(['organization']);

      // Optimistically update to the new value
      queryClient.setQueryData(['organization'], (old: any) => {
        if (!old) return old;
        return { ...old, ...settings };
      });

      // Return a context object with the snapshotted value
      return { previousOrganization };
    },
    onSuccess: (data, variables) => {
      // Clear user inputs for updated fields
      setUserInputs(prev => {
        const newInputs = { ...prev };
        Object.keys(variables).forEach(key => {
          delete newInputs[key as keyof typeof newInputs];
        });
        return newInputs;
      });
      
      toast.success("Notification settings updated successfully!", {
        description: "Your email notification preferences have been saved.",
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value
      if (context?.previousOrganization) {
        queryClient.setQueryData(['organization'], context.previousOrganization);
      }
      
      console.error("Error updating notification settings:", error);
      let errorMessage = "Failed to update notification settings. Please try again.";
      if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error("Update failed", { description: errorMessage });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });

  // Individual mutations for each switch
  const updateInvoiceNotificationsMutation = useMutation({
    mutationFn: async (invoiceNotifications: boolean) => {
      const payload = {
        invoiceNotifications
      };
      
      const response = await axios.patch(`/api/organization/${organization?.id}`, payload);
      return response.data;
    },
    onMutate: async (invoiceNotifications) => {
      await queryClient.cancelQueries({ queryKey: ['organization'] });
      const previousOrganization = queryClient.getQueryData(['organization']);
      
      queryClient.setQueryData(['organization'], (old: any) => {
        if (!old) return old;
        const updated = { ...old, invoiceNotifications };
        return updated;
      });
      
      return { previousOrganization };
    },
    onSuccess: (data) => {

      setUserInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs.invoiceNotifications;
        return newInputs;
      });
      toast.success("Invoice notifications updated!");
    },
    onError: (error: any, variables, context) => {
      console.error('🔍 [Frontend] Invoice notification update error:', error);
      console.error('🔍 [Frontend] Error response:', error.response?.data);
      if (context?.previousOrganization) {
        queryClient.setQueryData(['organization'], context.previousOrganization);
      }
      toast.error("Failed to update invoice notifications");
    },
    onSettled: () => {
    },
  });



  const updateProjectNotificationsMutation = useMutation({
    mutationFn: async (projectNotifications: boolean) => {
      const payload = {
        projectNotifications
      };
      const response = await axios.patch(`/api/organization/${organization?.id}`, payload);
      return response.data;
    },
    onMutate: async (projectNotifications) => {
      await queryClient.cancelQueries({ queryKey: ['organization'] });
      const previousOrganization = queryClient.getQueryData(['organization']);
      
      queryClient.setQueryData(['organization'], (old: any) => {
        if (!old) return old;
        const updated = { ...old, projectNotifications };
        return updated;
      });
      
      return { previousOrganization };
    },
    onSuccess: (data) => {
      setUserInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs.projectNotifications;
        return newInputs;
      });
      toast.success("Project notifications updated!");
    },
    onError: (error: any, variables, context) => {
      console.error('🔍 [Frontend] Project notification update error:', error);
      console.error('🔍 [Frontend] Error response:', error.response?.data);
      if (context?.previousOrganization) {
        queryClient.setQueryData(['organization'], context.previousOrganization);
      }
      toast.error("Failed to update project notifications");
    },
    onSettled: () => {
    },
  });

  const updateFeedbackNotificationsMutation = useMutation({
    mutationFn: async (feedbackNotifications: boolean) => {
      const payload = {
        feedbackNotifications
      };
      
      const response = await axios.patch(`/api/organization/${organization?.id}`, payload);
      return response.data;
    },
    onMutate: async (feedbackNotifications) => {
      await queryClient.cancelQueries({ queryKey: ['organization'] });
      const previousOrganization = queryClient.getQueryData(['organization']);
      
      queryClient.setQueryData(['organization'], (old: any) => {
        if (!old) return old;
        const updated = { ...old, feedbackNotifications };
        return updated;
      });
      
      return { previousOrganization };
    },
    onSuccess: (data) => {
      setUserInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs.feedbackNotifications;
        return newInputs;
      });
      toast.success("Feedback notifications updated!");
    },
    onError: (error: any, variables, context) => {
      console.error('🔍 [Frontend] Feedback notification update error:', error);
      console.error('🔍 [Frontend] Error response:', error.response?.data);
      if (context?.previousOrganization) {
        queryClient.setQueryData(['organization'], context.previousOrganization);
      }
      toast.error("Failed to update feedback notifications");
    },
    onSettled: () => {
    },
  });

  const handleSaveInvoiceOverdue = async (value: boolean) => {
    updateInvoiceNotificationsMutation.mutate(value);
  };

  const handleSaveProjectSignoff = async (value: boolean) => {
    updateProjectNotificationsMutation.mutate(value);
  };

  const handleSaveOverdueFeedbacks = async (value: boolean) => {
    updateFeedbackNotificationsMutation.mutate(value);
  };



  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>Manage your personal notification settings for this team.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          <SettingsSwitch
            label="Invoice Overdue"
            description="Receive notifications about overdue invoices."
            value={getCurrentValue('invoiceNotifications')}
            onChange={(value) => updateUserInput('invoiceNotifications', value)}
            onSave={handleSaveInvoiceOverdue}
            loading={updateInvoiceNotificationsMutation.isPending}
          />
          
          <SettingsSwitch
            label="Project Signoff"
            description="Receive notifications about projects that are late to sign off."
            value={getCurrentValue('projectNotifications')}
            onChange={(value) => updateUserInput('projectNotifications', value)}
            onSave={handleSaveProjectSignoff}
            loading={updateProjectNotificationsMutation.isPending}
          />
          
          <SettingsSwitch
            label="Overdue Feedbacks"
            description="Receive notifications about overdue feedbacks."
            value={getCurrentValue('feedbackNotifications')}
            onChange={(value) => updateUserInput('feedbackNotifications', value)}
            onSave={handleSaveOverdueFeedbacks}
            loading={updateFeedbackNotificationsMutation.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}

