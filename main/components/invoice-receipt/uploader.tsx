"use client"
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bubbles, Trash, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/organizations/use-organization';

interface InvoiceReceiptUploaderProps {
  description?: string;
  loading?: boolean;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  onImageChange?: (url: string | null) => void;
}

export default function InvoiceReceiptUploader({

  description,
  loading = false,
  disabled = false,
  accept = "image/*",
  maxSize = 5,
  onImageChange
}: InvoiceReceiptUploaderProps) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<string | null>(organization?.logoUrl || null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when organization logo changes
  useEffect(() => {
    setPreview(organization?.logoUrl || null);
  }, [organization?.logoUrl]);

  // Upload logo mutation
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
      queryClient.setQueryData(["organization"], (old: any) => {
        if (!old) return old;
        return { ...old, logoUrl: tempUrl };
      });

      return { previousOrganization, tempUrl };
    },
    onSuccess: (data) => {
      // Update with the real URL
      queryClient.setQueryData(["organization"], (old: any) => {
        if (!old) return old;
        return { ...old, logoUrl: data.url };
      });
      
      setPreview(data.url);
      setIsDirty(false);
      onImageChange?.(data.url);
      
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
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

    // Upload the file
    uploadLogoMutation.mutate(file);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the upload click
    
    setPreview(null);
    setIsDirty(true);
    onImageChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !loading && !uploadLogoMutation.isPending) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative">
      {description && (
        <p className="text-sm mb-3">
          {description}
        </p>
      )}
      
      <div
        className={`relative w-20 h-20 border-2 border-dashed border-primary rounded-none cursor-pointer transition-all duration-200 hover:border-gray-400 ${
          disabled || loading || uploadLogoMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Logo"
              fill
              className="object-cover rounded-none"
            />
            {isHovered && !disabled && !loading && !uploadLogoMutation.isPending && (
              <div 
                className="absolute inset-0 bg-bexoni/20 bg-opacity-50 flex items-center justify-center cursor-pointer rounded-none"
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
        
        {(loading || uploadLogoMutation.isPending) && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-none">
            <Bubbles className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || loading || uploadLogoMutation.isPending}
      />
    </div>
  );
}