CREATE TYPE customer_activity_type_enum AS ENUM (
 'invoice_sent',
  'invoice_paid',
  'invoice_viewed',
  'invoice_overdue',
  'invoice_reminder',
  'invoice_updated',
  'invoice_link_clicked',
  'receipt_sent',
  'receipt_link_clicked',
  'receipt_viewed',
  'receipt_reminder',
  'receipt_updated',
  'project_started',
  'project_overdue',
  'project_completed',
  'project_updated',
  'project_reminder',
  'project_signed',
  'project_sent',
  'project_viewed'
  'project_link_clicked',
  'agreement_sent',
  'agreement_signed',
  'agreement_viewed',
  'agreement_link_clicked',
  'feedback_sent',
  'feedback_updated',
  'feedback_reminder',
  'feedback_received',
  'feedback_submitted',
  'feedback_overdue',
  'feedback_viewed',
  'feedback_link_clicked',
  'email_opened',

);

CREATE TYPE customer_activity_reference_enum AS ENUM (
  'invoice',
  'receipt',
  'project',
  'agreement',
  'feedback',
);

ALTER TYPE customer_activity_type_enum ADD VALUE IF NOT EXISTS 'feedback_sent';
ALTER TYPE customer_activity_type_enum ADD VALUE IF NOT EXISTS 'feedback_reminder';
ALTER TYPE customer_activity_type_enum ADD VALUE IF NOT EXISTS 'feedback_overdue';


CREATE TABLE IF NOT EXISTS public.customer_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NULL,
  created_at timestamptz DEFAULT timezone('utc', now()),
  createdBy uuid NULL REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
  customerId uuid NULL REFERENCES public.customers(id) ON DELETE SET NULL,
  details jsonb NULL,
  label text NULL,
  referenceId uuid NULL,
  referenceType customer_activity_reference_enum NULL,
  tagColor text NULL,
  type customer_activity_type_enum NULL
);