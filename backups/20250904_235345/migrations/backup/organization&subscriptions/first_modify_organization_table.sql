-- Create the planType enum
CREATE TYPE plan_type_enum AS ENUM ('starter', 'pro', 'corporate');

-- Create the billingCycle enum
CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'yearly');

-- Create the subscriptionStatus enum
CREATE TYPE subscription_status_enum AS ENUM ('trial', 'pending', 'active', 'expired', 'cancelled', 'suspended');

-- Add the new columns to the organization table with camelCase naming
ALTER TABLE organization 
ADD COLUMN planType plan_type_enum,
ADD COLUMN billingCycle billing_cycle_enum,
ADD COLUMN subscriptionStatus subscription_status_enum DEFAULT 'trial',
ADD COLUMN subscriptionStartDate TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscriptionEndDate TIMESTAMP WITH TIME ZONE,
ADD COLUMN billingEmail TEXT,
ADD COLUMN paymentMethodId TEXT,
ADD COLUMN stripeMetadata JSONB DEFAULT '{}',
ADD COLUMN subscriptionMetadata JSONB DEFAULT '{}';

-- Update the existing subscriptionStatus column to use the new enum
-- First, backup existing data if needed
-- Then drop and recreate with the enum type
ALTER TABLE organization 
DROP COLUMN subscriptionStatus,
ADD COLUMN subscriptionStatus subscription_status_enum DEFAULT 'trial';

-- Create indexes for better performance on subscription-related queries
CREATE INDEX idx_organization_subscriptionStatus ON organization("subscriptionStatus");
CREATE INDEX idx_organization_stripeMetadata ON organization USING GIN ("stripeMetadata");
CREATE INDEX idx_organization_planType ON organization("planType");
CREATE INDEX idx_organization_trialEndsAt ON organization("trialEndsAt");
CREATE INDEX idx_organization_subscriptionEndDate ON organization("subscriptionEndDate");

-- Add a check constraint to ensure trial organizations have trialEndsAt set
-- ALTER TABLE organization 
-- ADD CONSTRAINT check_trial_ends_at 
-- CHECK (
--   (subscriptionStatus = 'trial' AND trialEndsAt IS NOT NULL) OR 
--   (subscriptionStatus != 'trial')
-- );

ALTER TABLE organization
ADD CONSTRAINT trial_ends_at_check
CHECK (
    ("subscriptionStatus" = 'trial' AND "trialEndsAt" IS NOT NULL) OR
    ("subscriptionStatus" != 'trial')
);

-- Add a check constraint to ensure active subscriptions have end dates
-- ALTER TABLE organization 
-- ADD CONSTRAINT check_subscription_dates 
-- CHECK (
--   (subscriptionStatus = 'active' AND subscriptionEndDate IS NOT NULL) OR 
--   (subscriptionStatus != 'active')
-- );


ALTER TABLE organization
ADD CONSTRAINT subscription_dates_check
CHECK (
    ("subscriptionStatus" = 'active' AND "subscriptionEndDate" IS NOT NULL) OR
    ("subscriptionStatus" != 'active')
);