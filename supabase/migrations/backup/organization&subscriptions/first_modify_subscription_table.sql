-- Update the subscriptions table to use the new enum types
-- ALTER TABLE subscriptions 
-- ADD COLUMN planType plan_type_enum,
-- ADD COLUMN billingCycle billing_cycle_enum,
-- ADD COLUMN stripeMetadata JSONB DEFAULT '{}',
-- ADD COLUMN subscriptionStatus subscription_status_enum DEFAULT 'pending'

ALTER TABLE subscriptions 
ADD COLUMN "planType" plan_type_enum,
ADD COLUMN "billingCycle" billing_cycle_enum,
ADD COLUMN "stripeMetadata" JSONB DEFAULT '{}',
ADD COLUMN "subscriptionStatus" subscription_status_enum DEFAULT 'pending';


-- Add indexes for the subscriptions table
-- CREATE INDEX idx_subscriptions_organization_id ON subscriptions(organizationId);
-- CREATE INDEX idx_subscriptions_status ON subscriptions(subscriptionStatus);
-- CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripeCustomerId);
-- CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripeSubscriptionId);
-- CREATE INDEX idx_subscriptions_stripe_metadata ON subscriptions USING GIN (stripeMetadata);

CREATE INDEX idx_subscriptions_organization_id ON subscriptions("organizationId");
CREATE INDEX idx_subscriptions_status ON subscriptions("subscriptionStatus");
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions("stripeCustomerId");
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions("stripeSubscriptionId");
CREATE INDEX idx_subscriptions_stripe_metadata ON subscriptions USING GIN ("stripeMetadata");

-- Add foreign key constraint if not already present
-- ALTER TABLE subscriptions 
-- ADD CONSTRAINT fk_subscriptions_organization 
-- FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE;

ALTER TABLE subscriptions
ADD CONSTRAINT fk_subscriptions_organization
FOREIGN KEY ("organizationId") REFERENCES organization(id) ON DELETE CASCADE;