"use client";
import SettingsFileUpload from "@/components/settings/settings-file-upload";
import SettingsInput from "@/components/settings/settings-input";
import SettingsDelete from "@/components/settings/settings-delete";
import ConfirmModal from "@/components/modal/confirm-modal";
import SettingsCombobox from "@/components/settings/settings-combobox";
import { Organization, useOrganization, useUpdateOrganization, useUploadOrganizationLogo, useDeleteOrganizationLogo, useDeleteOrganization } from "@/hooks/organizations/use-organization";
import { countries } from "@/data/countries";
import { currencies } from "@/data/currency";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";






export default function SettingsForm() {
  const { data: organization, isLoading, error } = useOrganization();
  const queryClient = useQueryClient();
  const updateOrganization = useUpdateOrganization();
  const uploadLogo = useUploadOrganizationLogo();
  const deleteLogo = useDeleteOrganizationLogo();
  const deleteOrganization = useDeleteOrganization();


  // Track user input separately from organization data
  const [userInputs, setUserInputs] = useState<Partial<Organization>>({});
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mutatingField, setMutatingField] = useState<keyof Organization | null>(null);

  

  // Helper to get current value (user input or organization data)
 // Helper to get current value (user input or organization data)
  const getCurrentValue = (field: keyof Organization): string => {
    const value = userInputs[field] ?? organization?.[field];
    // Ensure the returned value is always a string.
    // null or undefined values will become an empty string.
    return value != null ? String(value) : "";
  };

  // Helper to update user input
  const updateUserInput = (field: keyof Organization, value: any) => {
    setUserInputs(prev => ({ ...prev, [field]: value }));
  };

  // Use centralized mutations
  const handleUpdate = (updates: Partial<Organization>) => {
    const field = Object.keys(updates)[0] as keyof Organization | undefined;
    if (field) setMutatingField(field);
    updateOrganization.mutate(updates, {
      onSettled: () => setMutatingField(null),
      onSuccess: (_data, variables) => {
        setUserInputs(prev => {
          const newInputs = { ...prev };
          Object.keys(variables).forEach(key => {
            delete newInputs[key as keyof Organization];
          });
          return newInputs;
        });
      }
    });
  };

  const handleSaveField = (field: keyof Organization) => {
    const value = getCurrentValue(field);
    handleUpdate({ [field]: value } as Partial<Organization>);
  };

  return (
    <div className="space-y-6">
      <SettingsFileUpload
        label="Company Logo"
        description="This is your company's logo. Click on the logo to upload a custom one from your files."
        value={organization?.logoUrl || null}
        onChange={setCompanyLogo}
        onSave={() => companyLogo && uploadLogo.mutate(companyLogo)}
        onDelete={() => deleteLogo.mutate()}
        loading={uploadLogo.isPending || deleteLogo.isPending}
      />

      <SettingsInput
        label="Company Name"
        description="This is your company's visible name within Lance. For example, the name of your company or department."
        value={getCurrentValue("name")}
        onChange={(value) => updateUserInput("name", value)}
        onSave={() => handleSaveField("name")}
        placeholder="Enter company name"
        maxLength={32}
        loading={mutatingField === 'name'} 
        // loading={updateOrganizationMutation.isPending}
      />

      <SettingsInput
        label="Company Email"
        description="This is the email address that will be used to receive emails from Lance."
        value={getCurrentValue("email")}
        onChange={(value) => updateUserInput("email", value)}
        onSave={() => handleSaveField("email")}
        type="email"
        placeholder="Enter company email"
        loading={mutatingField === 'email'}
        // loading={updateOrganizationMutation.isPending}
      />

      <SettingsCombobox
        label="Company country"
        description="This is your company's country of origin."
        value={getCurrentValue("country")}
        onChange={(value) => updateUserInput("country", value)}
        onSave={() => handleSaveField("country")}
        items={countries.map((c) => ({ value: c.code, label: c.label }))}
        placeholder="Select country"
        searchPlaceholder="Search country..."
        loading={mutatingField === 'country'} 
        // loading={updateOrganizationMutation.isPending}
      />

      <SettingsCombobox
        label="Company currency"
        description="This is your company's default currency."
        value={getCurrentValue("baseCurrency")}
        onChange={(value) => updateUserInput("baseCurrency", value)}
        onSave={() => handleSaveField("baseCurrency")}
        items={currencies.map((c) => ({ value: c.code, label: c.label }))}
        placeholder="Select currency"
        searchPlaceholder="Search currency..."
        loading={mutatingField === 'baseCurrency'} 
        // loading={updateOrganizationMutation.isPending}
      />

      <SettingsDelete
        title="Delete team"
        description="Permanently remove your Team and all of its contents from the Lance platform. This action is not reversible — please continue with caution."
        onDelete={() => setIsDeleteModalOpen(true)}
        loading={deleteOrganization.isPending}
        itemType="team"
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteOrganization.mutate(undefined, {
          onSuccess: () => {
            setTimeout(() => {
              window.location.href = "/login";
            }, 2000);
          }
        })}
        title="Delete Team"
        itemName="your team"
        itemType="team"
        description="Permanently remove your Team and all of its contents from the Lance platform. This action is not reversible — please continue with caution."
        isLoading={deleteOrganization.isPending}
        warningMessage="This will permanently delete your team and all associated data including projects, invoices, customers, and settings. This action cannot be undone."
      />
    </div>
  );
}