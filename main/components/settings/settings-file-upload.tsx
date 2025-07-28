"use client"
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bubbles, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

interface SettingsFileUploadProps {
  label: string;
  description?: string;
  value?: string | null;
  onChange: (file: File | null) => void;
  onSave: () => void;
  loading?: boolean;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in MB
}

export default function SettingsFileUpload({
  label,
  description,
  value,
  onChange,
  onSave,
  loading = false,
  disabled = false,
  accept = "image/*",
  maxSize = 5
}: SettingsFileUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      setIsDirty(true);
    };
    reader.readAsDataURL(file);

    onChange(file);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the upload click
    setPreview(null);
    setIsDirty(true);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    await onSave();
    setIsDirty(false);
  };

  const handleClick = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click();
    }
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
            <div
              className={`relative w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer transition-all duration-200 ${
                isHovered ? 'border-gray-400 bg-gray-50' : 'bg-gray-50'
              } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {preview ? (
                <>
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="rounded-lg object-cover"
                  />
                  {isHovered && !disabled && !loading && (
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center cursor-pointer"
                      onClick={handleDelete}
                    >
                      <X className="h-6 w-6 text-white" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || loading}
            />
            
            <p className="text-xs text-gray-400 mt-2">
              An avatar is optional but strongly recommended.
            </p>
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