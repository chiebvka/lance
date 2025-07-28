import FinanceSettingsForm from '../_components/finance-settings-form';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react'

type Props = {}

export default async function FinancePage({}: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <p className="text-gray-600 mt-1">Manage your financial accounts and settings</p>
      </div>
      
      <FinanceSettingsForm />
    </div>
  )
}