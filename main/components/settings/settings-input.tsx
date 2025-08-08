"use client"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bubbles } from 'lucide-react';
import { useState } from 'react';

interface SettingsInputProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  placeholder?: string;
  maxLength?: number;
  type?: 'text' | 'email' | 'tel' | 'url';
  loading?: boolean;
  disabled?: boolean;
}

export default function 
SettingsInput({
  label,
  description,
  value,
  onChange,
  onSave,
  placeholder,
  maxLength,
  type = 'text',
  loading = false,
  disabled = false
}: SettingsInputProps) {
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsDirty(newValue !== value);
  };

  const handleSave = async () => {
    await onSave();
    setIsDirty(false);
  };

  return (
    <div className="bg-lightCard text-card-foreground dark:bg-darkCard  border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Label className="text-sm font-bold text-primary">
            {label}
          </Label>
          {description && (
            <p className="text-sm ">
              {description}
            </p>
          )}
          <div className="relative">
            <Input
              type={type}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled || loading}
              className="max-w-md"
            />
            {maxLength && (
              <p className="text-xs text-muted-foreground mt-1">
                Please use {maxLength} characters at maximum.
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!isDirty || loading || disabled}
          className="ml-6 "
        >
          {loading ? (
            <>
              <Bubbles className="mr-2 h-4 w-4 animate-spin [animation-duration:0.5s]" />
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