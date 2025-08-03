-- Enable RLS on subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "subscriptions_select_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_policy" ON subscriptions;

-- Policy for SELECT: Users can view subscriptions for their organization
CREATE POLICY "subscriptions_select_policy" ON subscriptions
    FOR SELECT 
    USING (
        organizationId IN (
            SELECT organizationId 
            FROM profiles 
            WHERE profile_id = auth.uid()
        )
    );

-- Policy for INSERT: Allow system/webhooks to create subscriptions
-- This policy allows authenticated users to insert subscriptions for their organization
CREATE POLICY "subscriptions_insert_policy" ON subscriptions
    FOR INSERT 
    WITH CHECK (
        -- Allow if user has access to the organization
        organizationId IN (
            SELECT organizationId 
            FROM profiles 
            WHERE profile_id = auth.uid()
        )
        OR 
        -- Allow system inserts (for webhooks) - you might need to create a service role for this
        auth.role() = 'service_role'
    );

-- Policy for UPDATE: Users can update subscriptions for their organization
-- This is mainly for system updates via webhooks
CREATE POLICY "subscriptions_update_policy" ON subscriptions
    FOR UPDATE 
    USING (
        organizationId IN (
            SELECT organizationId 
            FROM profiles 
            WHERE profile_id = auth.uid()
        )
    )
    WITH CHECK (
        organizationId IN (
            SELECT organizationId 
            FROM profiles 
            WHERE profile_id = auth.uid()
        )
    );

-- Policy for DELETE: Generally, subscriptions should not be deleted by users
-- Only allow system/admin operations
CREATE POLICY "subscriptions_delete_policy" ON subscriptions
    FOR DELETE 
    USING (
        -- Only allow system deletes (for cleanup operations)
        auth.role() = 'service_role'
        OR
        -- Or if user is the organization creator (admin)
        organizationId IN (
            SELECT id 
            FROM organization 
            WHERE createdBy = auth.uid()
        )
    );

-- Grant necessary permissions to authenticated users
GRANT SELECT ON subscriptions TO authenticated;
GRANT INSERT ON subscriptions TO authenticated;
GRANT UPDATE ON subscriptions TO authenticated;

-- Grant permissions to service role for webhook operations
GRANT ALL ON subscriptions TO service_role;

-- Create index for better performance on organization lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organizationId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripeSubscriptionId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(subscriptionStatus);

-- Comments for documentation
COMMENT ON POLICY "subscriptions_select_policy" ON subscriptions IS 'Allow users to view subscriptions for their organization';
COMMENT ON POLICY "subscriptions_insert_policy" ON subscriptions IS 'Allow system and organization members to create subscriptions';
COMMENT ON POLICY "subscriptions_update_policy" ON subscriptions IS 'Allow system and organization members to update subscriptions';
COMMENT ON POLICY "subscriptions_delete_policy" ON subscriptions IS 'Only allow system or organization creators to delete subscriptions';