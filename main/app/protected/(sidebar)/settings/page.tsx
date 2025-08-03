import { getAuthenticatedUser } from '@/utils/auth';
import SettingsForm from './_components/settings-form';
import SettingsSkeleton from './_components/settings-skeleton';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  return (
    <div className="max-w-4xl p-6 space-y-6">
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsForm />
      </Suspense>
    </div>
  )
}