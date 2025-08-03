"use client"

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

type Props = {}

export default function NotificationSkeleton({}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>Manage your personal notification settings for this team.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {/* Invoice Overdue Switch Skeleton */}
          <div className="flex items-center justify-between py-4">
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium text-gray-900">Invoice Overdue</div>
              <p className="text-sm text-gray-500">Receive notifications about overdue invoices.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </div>
          
          {/* Project Signoff Switch Skeleton */}
          <div className="flex items-center justify-between py-4">
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium text-gray-900">Project Signoff</div>
              <p className="text-sm text-gray-500">Receive notifications about projects that are late to sign off.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </div>
          
          {/* Overdue Feedbacks Switch Skeleton */}
          <div className="flex items-center justify-between py-4">
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium text-gray-900">Overdue Feedbacks</div>
              <p className="text-sm text-gray-500">Receive notifications about overdue feedbacks.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}