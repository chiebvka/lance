"use client"

import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'
import React from 'react'

type Props = {}

export default function SettingsSkeleton({}: Props) {
  return (
    <div className="space-y-6">
      {/* Company Logo Section */}
      <div className="bg-lightCard text-card-foreground dark:bg-darkCard border p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Label className="text-sm font-bold text-primary">
              Company Logo
            </Label>
            <p className="text-sm">
              This is your company's logo. Click on the logo to upload a custom one from your files.
            </p>
            
            <div className="relative">
              <div className="relative w-20 h-20 border-2 border-dashed border-primary cursor-pointer transition-all duration-200">
                <div className="flex items-center justify-center h-full">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <p className="text-xs mt-2">
                An avatar is optional but strongly recommended.
              </p>
            </div>
          </div>
          
          <Button disabled className="ml-6">
            Save
          </Button>
        </div>
      </div>

      {/* Company Name Section */}
      <div className="bg-lightCard text-card-foreground dark:bg-darkCard border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Label className="text-sm font-bold text-primary">
              Company Name
            </Label>
            <p className="text-sm text-gray-500">
              This is your company's visible name within Lance. For example, the name of your company or department.
            </p>
            <div className="relative">
              <Skeleton className="h-10 w-80" />
              <p className="text-xs text-gray-400 mt-1">
                Please use 32 characters at maximum.
              </p>
            </div>
          </div>
          <Button disabled className="ml-6">
            Save
          </Button>
        </div>
      </div>

      {/* Company Email Section */}
      <div className="bg-lightCard text-card-foreground dark:bg-darkCard border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Label className="text-sm font-bold text-primary">
              Company Email
            </Label>
            <p className="text-sm text-gray-500">
              This is the email address that will be used to receive emails from Lance.
            </p>
            <div className="relative">
              <Skeleton className="h-10 w-80" />
            </div>
          </div>
          <Button disabled className="ml-6">
            Save
          </Button>
        </div>
      </div>

      {/* Company Country Section */}
      <div className="bg-lightCard text-card-foreground dark:bg-darkCard border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Label className="text-sm font-bold text-primary">
              Company country
            </Label>
            <p className="text-sm text-gray-500">
              This is your company's country of origin.
            </p>
            <div className="relative">
              <Skeleton className="h-10 w-80" />
            </div>
          </div>
          <Button disabled className="ml-6">
            Save
          </Button>
        </div>
      </div>

      {/* Company Currency Section */}
      <div className="bg-lightCard text-card-foreground dark:bg-darkCard border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Label className="text-sm font-bold text-primary">
              Company currency
            </Label>
            <p className="text-sm text-gray-500">
              This is your company's default currency.
            </p>
            <div className="relative">
              <Skeleton className="h-10 w-80" />
            </div>
          </div>
          <Button disabled className="ml-6">
            Save
          </Button>
        </div>
      </div>

      {/* Delete Team Section */}
      <div className="bg-lightCard text-card-foreground dark:bg-darkCard border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Label className="text-sm font-bold text-red-600">
              Delete team
            </Label>
            <p className="text-sm text-gray-500">
              Permanently remove your Team and all of its contents from the Lance platform. This action is not reversible — please continue with caution.
            </p>
          </div>
          <Button variant="destructive" disabled className="ml-6">
            Delete team
          </Button>
        </div>
      </div>
    </div>
  )
}