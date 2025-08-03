-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizationId UUID REFERENCES organization(id) ON DELETE CASCADE,
  userId UUID,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error', 'trial_reminder'
  isRead BOOLEAN DEFAULT FALSE,
  actionUrl TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expiresAt TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organizationId);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(isRead);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT 
    USING (
        organizationId IN (
            SELECT organizationId 
            FROM profiles 
            WHERE profile_id = auth.uid()
        )
        OR userId = auth.uid()
    );

CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT 
    WITH CHECK (
        organizationId IN (
            SELECT organizationId 
            FROM profiles 
            WHERE profile_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE 
    USING (
        organizationId IN (
            SELECT organizationId 
            FROM profiles 
            WHERE profile_id = auth.uid()
        )
        OR userId = auth.uid()
    );

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE 
    USING (
        organizationId IN (
            SELECT organizationId 
            FROM profiles 
            WHERE profile_id = auth.uid()
        )
        OR userId = auth.uid()
        OR auth.role() = 'service_role'
    );

-- Grant permissions
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();