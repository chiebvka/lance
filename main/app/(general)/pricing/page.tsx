import { createClient } from "@/utils/supabase/server";
import { PricingForm } from "./_components/pricing-form";
import { getUserOrganization, userHasActiveSubscription } from "@/utils/user-profile";
import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo'

export default async function PricingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userOrganization = null;
  let hasActiveSubscription = false;

  // Only check organization and subscription if user is authenticated
  if (user) {
    userOrganization = await getUserOrganization(supabase, user.id);
    hasActiveSubscription = await userHasActiveSubscription(supabase, user.id);
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Start with a 7-day free trial. No credit card required.
          </p>
        </div>

        <PricingForm 
          user={user}
          userOrganization={userOrganization}
          hasActiveSubscription={hasActiveSubscription}
        />
      </div>
    </div>
  );
}

export const metadata: Metadata = createPageMetadata({
  title: 'Pricing',
  description: 'Simple pricing with a free 7‑day trial. Choose a plan that fits your client operations workflow.',
  path: '/pricing',
});