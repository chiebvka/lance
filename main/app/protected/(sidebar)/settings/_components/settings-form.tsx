"use client";
import SettingsFileUpload from "@/components/settings/settings-file-upload";
import SettingsInput from "@/components/settings/settings-input";
import SettingsDelete from "@/components/settings/settings-delete";
import ConfirmModal from "@/components/modal/confirm-modal";
import SettingsCombobox from "@/components/settings/settings-combobox";
import { Organization, useOrganization } from "@/hooks/organizations/use-organization";
import { countries } from "@/data/countries";
import { currencies } from "@/data/currency";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useState } from "react";






export default function SettingsForm() {
  const { data: organization, isLoading, error } = useOrganization();
  const queryClient = useQueryClient();


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

  // Mutation for updating organization fields
  const updateOrganizationMutation = useMutation({
    mutationFn: async (updates: Partial<Organization>) => {
      if (!organization) throw new Error("No organization data");
      const response = await axios.patch(`/api/organization/${organization.id}`, updates);
      return response.data;
    },
    onMutate: async (updates) => {
      const field = Object.keys(updates)[0] as keyof Organization;
      setMutatingField(field);
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["organization"] });

      // Snapshot the previous value
      const previousOrganization = queryClient.getQueryData(["organization"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["organization"], (old: Organization | undefined) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      // Return a context object with the snapshotted value
      return { previousOrganization };
    },
    onSuccess: (data, variables) => {
      // Clear user inputs for updated fields
      setUserInputs(prev => {
        const newInputs = { ...prev };
        Object.keys(variables).forEach(key => {
          delete newInputs[key as keyof Organization];
        });
        return newInputs;
      });
      
      toast.success("Settings updated successfully!", {
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value
      if (context?.previousOrganization) {
        queryClient.setQueryData(["organization"], context.previousOrganization);
      }
      
      console.error("Error updating organization:", error);
      let errorMessage = "Failed to save changes. Please try again.";
      if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error("Save failed", { description: errorMessage });
    },
    onSettled: () => {
      // Always refetch after error or success
      setMutatingField(null); 
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });

  // Combined mutation for logo upload and update
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!organization) throw new Error("No organization data");
      
      // Upload file first
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");
      const uploadResponse = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const { url } = uploadResponse.data;
      
      // Then update organization with new logo URL
      const updateResponse = await axios.patch(`/api/organization/${organization.id}`, {
        logoUrl: url,
      });
      
      return { url, updateData: updateResponse.data };
    },
    onMutate: async (file) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["organization"] });

      // Snapshot the previous value
      const previousOrganization = queryClient.getQueryData(["organization"]);

      // Create a temporary URL for optimistic update
      const tempUrl = URL.createObjectURL(file);
      
      // Optimistically update with temporary URL
      queryClient.setQueryData(["organization"], (old: Organization | undefined) => {
        if (!old) return old;
        return { ...old, logoUrl: tempUrl };
      });

      return { previousOrganization, tempUrl };
    },
    onSuccess: (data) => {
      // Update with the real URL
      queryClient.setQueryData(["organization"], (old: Organization | undefined) => {
        if (!old) return old;
        return { ...old, logoUrl: data.url };
      });
      
      toast.success("Logo uploaded successfully!", {
        description: "Your company logo has been updated.",
      });
    },
    onError: (error: any, file, context) => {
      // Rollback to the previous value
      if (context?.previousOrganization) {
        queryClient.setQueryData(["organization"], context.previousOrganization);
      }
      
      // Revoke the temporary URL
      if (context?.tempUrl) {
        URL.revokeObjectURL(context.tempUrl);
      }
      
      console.error("Error uploading logo:", error);
      let errorMessage = "Failed to save logo. Please try again.";
      if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error("Upload failed", { description: errorMessage });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });

  // Mutation for deleting logo
  const deleteLogoMutation = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error("No organization data");
      await axios.patch(`/api/organization/${organization.id}`, { logoUrl: null });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["organization"] });

      // Snapshot the previous value
      const previousOrganization = queryClient.getQueryData(["organization"]);

      // Optimistically update
      queryClient.setQueryData(["organization"], (old: Organization | undefined) => {
        if (!old) return old;
        return { ...old, logoUrl: null };
      });

      return { previousOrganization };
    },
    onSuccess: () => {
      toast.success("Logo deleted successfully!", {
        description: "Your company logo has been removed.",
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value
      if (context?.previousOrganization) {
        queryClient.setQueryData(["organization"], context.previousOrganization);
      }
      
      console.error("Error deleting logo:", error);
      let errorMessage = "Failed to delete logo. Please try again.";
      if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error("Delete failed", { description: errorMessage });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });

  // Mutation for deleting team
  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error("No organization data");
      
      const response = await axios.delete(`/api/organization/${organization.id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Organization deleted successfully!", {
        description: "Your organization has been permanently removed.",
      });
      
      // Redirect to login page after successful deletion
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Error deleting organization:", error);
      
      let errorMessage = "Failed to delete organization. Please try again.";
      
      if (error.response?.status === 403) {
        errorMessage = "You are not authorized to delete this organization. Only organization creators can delete the organization.";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error("Delete failed", {
        description: errorMessage,
      });
    },
  });

  const handleSaveField = (field: keyof Organization) => {
    const value = getCurrentValue(field);
    updateOrganizationMutation.mutate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <SettingsFileUpload
        label="Company Logo"
        description="This is your company's logo. Click on the logo to upload a custom one from your files."
        value={organization?.logoUrl || null}
        onChange={setCompanyLogo}
        onSave={() => companyLogo && uploadLogoMutation.mutate(companyLogo)}
        onDelete={() => deleteLogoMutation.mutate()}
        loading={uploadLogoMutation.isPending || deleteLogoMutation.isPending}
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
        loading={deleteTeamMutation.isPending}
        itemType="team"
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteTeamMutation.mutate()}
        title="Delete Team"
        itemName="your team"
        itemType="team"
        description="Permanently remove your Team and all of its contents from the Lance platform. This action is not reversible — please continue with caution."
        isLoading={deleteTeamMutation.isPending}
        warningMessage="This will permanently delete your team and all associated data including projects, invoices, customers, and settings. This action cannot be undone."
      />
    </div>
  );
}