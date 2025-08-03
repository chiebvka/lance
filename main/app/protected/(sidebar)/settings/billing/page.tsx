import { createClient } from '@/utils/supabase/server';
import React from 'react'
import SubscribeForm from './_components/subscribe-form';
import { getUserOrganization, userHasActiveSubscription } from '@/utils/user-profile';
import { getAuthenticatedUser } from '@/utils/auth';

type Props = {}

export default async function page({}: Props) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);

  let userOrganization = null;
  let hasActiveSubscription = false;

  // Only check organization and subscription if user is authenticated
  if (user) {
    userOrganization = await getUserOrganization(supabase, user.id);
    hasActiveSubscription = await userHasActiveSubscription(supabase, user.id);
  }

  return (
    <div>
      <SubscribeForm
        user={user}
        userOrganization={userOrganization}
        hasActiveSubscription={hasActiveSubscription}
      />
    </div>
  )
}