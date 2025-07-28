"use client"
import SettingsFileUpload from '@/components/settings/settings-file-upload';
import SettingsInput from '@/components/settings/settings-input';
import SettingsDelete from '@/components/settings/settings-delete';
import ConfirmModal from '@/components/modal/confirm-modal';
import { useState } from 'react';
import { countries } from '@/data/countries';
import { currencies } from '@/data/currency';
import SettingsCombobox from '@/components/settings/settings-combobox';

export default function SettingsForm() {
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('lancersfortes@gmail.com');
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingCompanyName, setSavingCompanyName] = useState(false);
  const [savingCompanyEmail, setSavingCompanyEmail] = useState(false);
  const [country, setCountry] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [savingCountry, setSavingCountry] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveLogo = async () => {
    setSavingLogo(true);
    // TODO: Implement save logic
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setSavingLogo(false);
  };

  const handleSaveCompanyName = async () => {
    setSavingCompanyName(true);
    // TODO: Implement save logic
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setSavingCompanyName(false);
  };

  const handleSaveCompanyEmail = async () => {
    setSavingCompanyEmail(true);
    // TODO: Implement save logic
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setSavingCompanyEmail(false);
  };

  const handleSaveCurrency = async () => {
    setSavingCurrency(true);
    // TODO: Save logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSavingCurrency(false);
  };    

  const handleSaveCountry = async () => {
    setSavingCountry(true);
    // TODO: Save logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSavingCountry(false);
  };

  const handleDeleteTeam = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      // TODO: Implement actual delete logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Redirect to login or home page after successful deletion
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting team:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsFileUpload
        label="Company Logo"
        description="This is your company's logo. Click on the logo to upload a custom one from your files."
        value={null}
        onChange={setCompanyLogo}
        onSave={handleSaveLogo}
        loading={savingLogo}
      />
      
      <SettingsInput
        label="Company Name"
        description="This is your company's visible name within Lance. For example, the name of your company or department."
        value={companyName}
        onChange={setCompanyName}
        onSave={handleSaveCompanyName}
        placeholder="Enter company name"
        maxLength={32}
        loading={savingCompanyName}
      />
      
      <SettingsInput
        label="Company Email"
        description="This is the email address that will be used to receive emails from Lance."
        value={companyEmail}
        onChange={setCompanyEmail}
        onSave={handleSaveCompanyEmail}
        type="email"
        placeholder="Enter company email"
        loading={savingCompanyEmail}
      />

      <SettingsCombobox
        label="Company country"
        description="This is your company's country of origin."
        value={country}
        onChange={setCountry}
        onSave={handleSaveCountry}
        items={countries.map(c => ({ value: c.code, label: c.label }))}
        placeholder="Select country"
        searchPlaceholder="Search country..."
        loading={savingCountry}
      />

      <SettingsCombobox
        label="Company currency"
        description="This is your company's default currency."
        value={currency}
        onChange={setCurrency}
        onSave={handleSaveCurrency}
        items={currencies.map(c => ({ value: c.code, label: c.label }))}
        placeholder="Select currency"
        searchPlaceholder="Search currency..."
        loading={savingCurrency}
      />

      <SettingsDelete
        title="Delete team"
        description="Permanently remove your Team and all of its contents from the Lance platform. This action is not reversible — please continue with caution."
        onDelete={handleDeleteTeam}
        loading={isDeleting}
        itemType="team"
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Team"
        itemName="your team"
        itemType="team"
        description="Permanently remove your Team and all of its contents from the Lance platform. This action is not reversible — please continue with caution."
        isLoading={isDeleting}
        warningMessage="This will permanently delete your team and all associated data including projects, invoices, customers, and settings. This action cannot be undone."
      />
    </div>
  );
} 