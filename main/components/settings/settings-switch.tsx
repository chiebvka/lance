"use client"
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bubbles } from 'lucide-react';
import { useState } from 'react';

interface SettingsSwitchProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  onSave: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function SettingsSwitch({
  label,
  description,
  value,
  onChange,
  onSave,
  loading = false,
  disabled = false
}: SettingsSwitchProps) {
  const handleChange = async (newValue: boolean) => {
    onChange(newValue);
    await onSave();
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 space-y-1">
        <Label className="text-sm font-medium text-gray-900">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {loading && (
          <Bubbles className="h-4 w-4 animate-spin [animation-duration:0.8s] text-gray-400" />
        )}
        <Switch
          checked={value}
          onCheckedChange={handleChange}
          disabled={disabled || loading}
        />
      </div>
    </div>
  );
}