"use client"

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { CreditCard, Coins, RefreshCw, SquarePen, Trash2, Plus } from 'lucide-react'
import React from 'react'

type Props = {}

export default function FinanceSkeleton({}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <p className="text-sm text-gray-600">Manage bank accounts and payment methods for your organization.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account 1 - Bank Account */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={true} disabled />
            <Button variant="ghost" size="sm" disabled>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <SquarePen className="h-4 w-4 text-blue-500" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Account 2 - Crypto Wallet */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Coins className="h-8 w-8 text-yellow-600" />
            <div>
              <Skeleton className="h-4 w-28 mb-1" />
              <Skeleton className="h-3 w-36 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={false} disabled />
            <Button variant="ghost" size="sm" disabled>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <SquarePen className="h-4 w-4 text-blue-500" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Account 3 - Stripe Account */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-8 w-8 text-purple-600" />
            <div>
              <Skeleton className="h-4 w-26 mb-1" />
              <Skeleton className="h-3 w-30 mb-1" />
              <Skeleton className="h-3 w-22" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={false} disabled />
            <Button variant="ghost" size="sm" disabled>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <SquarePen className="h-4 w-4 text-blue-500" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Account 4 - PayPal Account */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-8 w-8 text-blue-500" />
            <div>
              <Skeleton className="h-4 w-30 mb-1" />
              <Skeleton className="h-3 w-34 mb-1" />
              <Skeleton className="h-3 w-26" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={false} disabled />
            <Button variant="ghost" size="sm" disabled>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <SquarePen className="h-4 w-4 text-blue-500" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Add Account Button */}
        <Button className="w-full" disabled>
          <Plus className="mr-2 h-4 w-4" />
          Add account
        </Button>
      </CardContent>
    </Card>
  )
}