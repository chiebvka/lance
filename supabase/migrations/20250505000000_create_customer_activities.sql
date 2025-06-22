CREATE TYPE customer_activity_type_enum AS ENUM (
 'invoice_sent',
  'invoice_paid',
  'invoice_viewed',
  'invoice_overdue',
  'invoice_link_clicked',
  'receipt_sent',
  'receipt_link_clicked',
  'receipt_viewed',
  'project_started',
  'project_completed',
  'project_link_clicked',
  'agreement_sent',
  'agreement_signed',
  'agreement_viewed',
  'agreement_link_clicked',
  'feedback_requested',
  'feedback_received',
  'feedback_viewed',
  'feedback_link_clicked',
  'email_opened',
  'project_sent',
  'project_viewed'
);

CREATE TYPE customer_activity_reference_enum AS ENUM (
  'invoice',
  'receipt',
  'project',
  'agreement',
  'feedback'
);

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