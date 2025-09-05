-- Add columns to notifications table for overdue item tracking
ALTER TABLE public.notifications 
ADD COLUMN "tableName" TEXT,
ADD COLUMN "tableId" UUID,
ADD COLUMN "state" TEXT DEFAULT 'active' CHECK ("state" IN ('active', 'archived'));

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_notifications_table_name ON public.notifications("tableName");
CREATE INDEX IF NOT EXISTS idx_notifications_table_id ON public.notifications("tableId");
CREATE INDEX IF NOT EXISTS idx_notifications_state ON public.notifications("state");

-- Add allowReminders column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN "allowReminders" BOOLEAN DEFAULT true;

-- Add allowReminders column to projects table
ALTER TABLE public.projects 
ADD COLUMN "allowReminders" BOOLEAN DEFAULT true;

-- Add allowReminders column to feedbacks table
ALTER TABLE public.feedbacks 
ADD COLUMN "allowReminders" BOOLEAN DEFAULT true;

-- Create indexes for allowReminders columns
CREATE INDEX IF NOT EXISTS idx_invoices_allow_reminders ON public.invoices("allowReminders");
CREATE INDEX IF NOT EXISTS idx_projects_allow_reminders ON public.projects("allowReminders");
CREATE INDEX IF NOT EXISTS idx_feedbacks_allow_reminders ON public.feedbacks("allowReminders"); 