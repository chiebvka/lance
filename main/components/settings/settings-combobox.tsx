"use client"
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bubbles } from 'lucide-react';
import { useState } from 'react';
import ComboBox from '../combobox';

interface SettingsComboboxProps {
  label: string;
  description?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  onSave: () => void;
  items: { value: string; label: string; searchValue?: string; [key: string]: any }[];
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
}

export default function SettingsCombobox({
  label,
  description,
  value,
  onChange,
  onSave,
  items,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  loading = false,
  disabled = false
}: SettingsComboboxProps) {
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (newValue: string | null) => {
    onChange(newValue);
    setIsDirty(newValue !== value);
  };

  const handleSave = async () => {
    await onSave();
    setIsDirty(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Label className="text-sm font-medium text-gray-900">
            {label}
          </Label>
          {description && (
            <p className="text-sm text-gray-500">
              {description}
            </p>
          )}
          
          <div className="relative">
            <div className="max-w-md">
              <ComboBox
                items={items}
                value={value}
                onValueChange={handleChange}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                emptyMessage="No results found."
              />
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleSave}
          disabled={!isDirty || loading || disabled}
          className="ml-6 bg-black hover:bg-gray-800 text-white"
        >
          {loading ? (
            <>
              <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.8s]" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  );
}