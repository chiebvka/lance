import { getAuthenticatedUser } from '@/utils/auth';
import NotificationSettingsForm from '../_components/notification-settings-form';
import NotificationSkeleton from './_component/notification-skeleton';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

type Props = {}

export default async function NotificationsPage({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  return (
    <div className="max-w-4xl p-6 space-y-6">
      <Suspense fallback={<NotificationSkeleton />}>
        <NotificationSettingsForm />
      </Suspense>
    </div>
  )
}