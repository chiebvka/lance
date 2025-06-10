CREATE TYPE customer_activity_type_enum AS ENUM (
  'invoice_sent',
  'invoice_paid',
  'invoice_overdue',
  'invoice_link_clicked',
  'receipt_sent',
  'receipt_link_clicked',
  'project_started',
  'project_completed',
  'project_link_clicked',
  'agreement_sent',
  'agreement_signed',
  'agreement_link_clicked',
  'feedback_requested',
  'feedback_received',
  'feedback_link_clicked',
  'email_opened'
);




CREATE TYPE customer_activity_reference_enum AS ENUM (
  'invoice',
  'receipt',
  'project',
  'agreement',
  'feedback'
);



ALTER TABLE customer_activities
ALTER COLUMN type
TYPE customer_activity_type_enum
USING type::customer_activity_type_enum;

ALTER TABLE customer_activities
ALTER COLUMN referenceType
TYPE customer_activity_reference_enum
USING referenceType::customer_activity_reference_enum;