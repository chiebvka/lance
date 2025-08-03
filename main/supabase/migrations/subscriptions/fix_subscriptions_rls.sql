-- Fix RLS policies for subscriptions table

-- First, ensure service_role bypasses RLS completely
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "subscriptions_select_policy" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON public.subscriptions;  
DROP POLICY IF EXISTS "subscriptions_update_policy" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_policy" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role full access" ON public.subscriptions;
DROP POLICY IF EXISTS "Users insert organization subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users update organization subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users view organization subscriptions" ON public.subscriptions;

-- Create simple, robust policies

-- SELECT policy: Users can view subscriptions for their organization
CREATE POLICY "select_own_organization_subscriptions" ON public.subscriptions
    FOR SELECT 
    TO authenticated
    USING (
        "organizationId" IN (
            SELECT "organizationId" 
            FROM public.profiles 
            WHERE profile_id = auth.uid()
        )
    );

-- INSERT policy: Users can insert subscriptions for their organization
CREATE POLICY "insert_own_organization_subscriptions" ON public.subscriptions
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        "organizationId" IN (
            SELECT "organizationId" 
            FROM public.profiles 
            WHERE profile_id = auth.uid()
        )
    );

-- UPDATE policy: Users can update subscriptions for their organization  
CREATE POLICY "update_own_organization_subscriptions" ON public.subscriptions
    FOR UPDATE 
    TO authenticated
    USING (
        "organizationId" IN (
            SELECT "organizationId" 
            FROM public.profiles 
            WHERE profile_id = auth.uid()
        )
    )
    WITH CHECK (
        "organizationId" IN (
            SELECT "organizationId" 
            FROM public.profiles 
            WHERE profile_id = auth.uid()
        )
    );

-- DELETE policy: Only allow organization creators to delete
CREATE POLICY "delete_own_organization_subscriptions" ON public.subscriptions
    FOR DELETE 
    TO authenticated
    USING (
        "organizationId" IN (
            SELECT id 
            FROM public.organization 
            WHERE "createdBy" = auth.uid()
        )
    );

-- Grant permissions to roles
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- Ensure service_role can bypass RLS completely
-- This is the key fix - service_role should have unrestricted access
GRANT ALL PRIVILEGES ON public.subscriptions TO service_role;

-- Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_lookup 
    ON public.subscriptions("organizationId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_lookup 
    ON public.subscriptions("stripeSubscriptionId");

-- Add comments for clarity
COMMENT ON POLICY "select_own_organization_subscriptions" ON public.subscriptions 
    IS 'Allow users to view subscriptions for their organization';
COMMENT ON POLICY "insert_own_organization_subscriptions" ON public.subscriptions 
    IS 'Allow users to create subscriptions for their organization';
COMMENT ON POLICY "update_own_organization_subscriptions" ON public.subscriptions 
    IS 'Allow users to update subscriptions for their organization';
COMMENT ON POLICY "delete_own_organization_subscriptions" ON public.subscriptions 
    IS 'Allow organization creators to delete subscriptions';