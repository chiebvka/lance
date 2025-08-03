import { getAuthenticatedUser } from '@/utils/auth';
import FinanceSettingsForm from '../_components/finance-settings-form';
import FinanceSkeleton from './_components/finance-skeleton';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

type Props = {}

export default async function FinancePage({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  return (
    <div className="max-w-4xl p-6 space-y-6">
        <FinanceSettingsForm />
    </div>
  )
}