"use client"
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bubbles, Trash, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';

interface SettingsFileUploadProps {
  label: string;
  description?: string;
  value?: string | null;
  onChange: (file: File | null) => void;
  onSave: () => void;
  onDelete?: () => void;
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
  onDelete,
  loading = false,
  disabled = false,
  accept = "image/*",
  maxSize = 5
}: SettingsFileUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when value changes (for existing logos)
  useEffect(() => {
    setPreview(value || null);
  }, [value]);

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
    
    // If there's an existing logo and onDelete is provided, call it
    if (value && onDelete) {
      onDelete();
    } else {
      // Otherwise, just clear the preview for new file selection
      setPreview(null);
      setIsDirty(true);
      onChange(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    <div className="bg-lightCard text-card-foreground dark:bg-darkCard border  p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Label className="text-sm font-bold text-primary ">
            {label}
          </Label>
          {description && (
            <p className="text-sm ">
              {description}
            </p>
          )}
          
          <div className="relative">
            <div
              className={`relative w-20 h-20  border-2 border-dashed border-primary cursor-pointer transition-all duration-200 ${
                isHovered ? 'border-gray-400 ' : ''
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
                    className=" object-cover"
                  />
                  {isHovered && !disabled && !loading && (
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer"
                      onClick={handleDelete}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Upload className="h-6 w-6 text-primary" />
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
            
            <p className="text-xs mt-2">
              An avatar is optional but strongly recommended.
            </p>
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