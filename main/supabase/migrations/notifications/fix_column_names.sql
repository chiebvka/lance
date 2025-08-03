-- Fix notifications table column names to match TypeScript interface

-- Rename columns from snake_case to camelCase
ALTER TABLE public.notifications 
  RENAME COLUMN isread TO "isRead";

ALTER TABLE public.notifications 
  RENAME COLUMN actionurl TO "actionUrl";

ALTER TABLE public.notifications 
  RENAME COLUMN expiresat TO "expiresAt";

-- Update the indexes if they exist
DROP INDEX IF EXISTS idx_notifications_is_read;
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications("isRead");

-- Update RLS policies to use correct column names
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;

-- Create new policies with correct column names
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT 
    USING (
        "organizationId" IN (
            SELECT "organizationId" 
            FROM public.profiles 
            WHERE profile_id = auth.uid()
        )
        OR "userId" = auth.uid()
    );

CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT 
    WITH CHECK (
        "organizationId" IN (
            SELECT "organizationId" 
            FROM public.profiles 
            WHERE profile_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE 
    USING (
        "organizationId" IN (
            SELECT "organizationId" 
            FROM public.profiles 
            WHERE profile_id = auth.uid()
        )
        OR "userId" = auth.uid()
    );

CREATE POLICY "notifications_delete_policy" ON public.notifications
    FOR DELETE 
    USING (
        "organizationId" IN (
            SELECT "organizationId" 
            FROM public.profiles 
            WHERE profile_id = auth.uid()
        )
        OR "userId" = auth.uid()
        OR auth.role() = 'service_role'
    );