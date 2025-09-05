-- Add notification preference columns to organization table
ALTER TABLE organization 
ADD COLUMN IF NOT EXISTS "invoiceNotifications" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "projectNotifications" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "feedbackNotifications" BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_invoice_notifications ON organization("invoiceNotifications");
CREATE INDEX IF NOT EXISTS idx_organization_project_notifications ON organization("projectNotifications");
CREATE INDEX IF NOT EXISTS idx_organization_feedback_notifications ON organization("feedbackNotifications");

-- Update any existing organizations to have notifications enabled by default
UPDATE organization 
SET 
  "invoiceNotifications" = true,
  "projectNotifications" = true,
  "feedbackNotifications" = true
WHERE 
  "invoiceNotifications" IS NULL 
  OR "projectNotifications" IS NULL 
  OR "feedbackNotifications" IS NULL;
