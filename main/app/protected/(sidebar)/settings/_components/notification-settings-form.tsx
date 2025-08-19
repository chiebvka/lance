"use client"
import SettingsSwitch from '@/components/settings/settings-switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization, useUpdateOrganization } from '@/hooks/organizations/use-organization';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

export default function NotificationSettingsForm() {
  const { data: organization, isLoading, error } = useOrganization();
  const queryClient = useQueryClient();
  const updateOrganization = useUpdateOrganization();

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

  // Centralized mutations
  const updateNotificationSettingsMutation = {
    mutate: (settings: { invoiceNotifications?: boolean; projectNotifications?: boolean; feedbackNotifications?: boolean }) => {
      updateOrganization.mutate(settings, {
        onSuccess: (_data, variables) => {
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
        }
      })
    }
  } as const

  const updateInvoiceNotificationsMutation = {
    mutate: (invoiceNotifications: boolean) => {
      updateOrganization.mutate({ invoiceNotifications }, {
        onSuccess: () => {
          setUserInputs(prev => {
            const newInputs = { ...prev };
            delete newInputs.invoiceNotifications;
            return newInputs;
          });
          toast.success("Invoice notifications updated!");
        }
      })
    },
    get isPending() { return updateOrganization.isPending }
  } as const



  const updateProjectNotificationsMutation = {
    mutate: (projectNotifications: boolean) => {
      updateOrganization.mutate({ projectNotifications }, {
        onSuccess: () => {
          setUserInputs(prev => {
            const newInputs = { ...prev };
            delete newInputs.projectNotifications;
            return newInputs;
          });
          toast.success("Project notifications updated!");
        }
      })
    },
    get isPending() { return updateOrganization.isPending }
  } as const

  const updateFeedbackNotificationsMutation = {
    mutate: (feedbackNotifications: boolean) => {
      updateOrganization.mutate({ feedbackNotifications }, {
        onSuccess: () => {
          setUserInputs(prev => {
            const newInputs = { ...prev };
            delete newInputs.feedbackNotifications;
            return newInputs;
          });
          toast.success("Feedback notifications updated!");
        }
      })
    },
    get isPending() { return updateOrganization.isPending }
  } as const

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

