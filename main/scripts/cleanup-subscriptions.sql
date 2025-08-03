-- Cleanup duplicate subscriptions and fix subscription statuses

-- First, let's see what we have
-- SELECT 
--   id, 
--   "organizationId", 
--   "stripeSubscriptionId", 
--   "subscriptionStatus", 
--   "planType",
--   created_at
-- FROM public.subscriptions 
-- ORDER BY "organizationId", created_at;

-- Keep only the latest subscription for each organization
-- Delete older duplicate subscriptions
WITH ranked_subscriptions AS (
  SELECT 
    id,
    "organizationId",
    "stripeSubscriptionId",
    ROW_NUMBER() OVER (
      PARTITION BY "organizationId" 
      ORDER BY created_at DESC
    ) as rn
  FROM public.subscriptions
)
DELETE FROM public.subscriptions 
WHERE id IN (
  SELECT id FROM ranked_subscriptions WHERE rn > 1
);

-- Update subscription statuses for subscriptions that have payment method
-- (These should be considered active even if Stripe shows 'trialing')
UPDATE public.subscriptions 
SET "subscriptionStatus" = 'active'
WHERE "subscriptionStatus" = 'trial' 
  AND "paymentMethod" IS NOT NULL;

-- Update organization statuses to match
UPDATE public.organization 
SET "subscriptionStatus" = 'active'
WHERE "subscriptionStatus" = 'trial' 
  AND "subscriptionId" IN (
    SELECT "stripeSubscriptionId" 
    FROM public.subscriptions 
    WHERE "subscriptionStatus" = 'active'
  );

-- Show final results
SELECT 
  'After cleanup:' as status,
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN "subscriptionStatus" = 'trial' THEN 1 END) as trial_count,
  COUNT(CASE WHEN "subscriptionStatus" = 'active' THEN 1 END) as active_count
FROM public.subscriptions;