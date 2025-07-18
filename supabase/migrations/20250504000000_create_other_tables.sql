CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget numeric NULL,
  created_at timestamptz DEFAULT timezone('utc', now()),
  createdBy uuid NULL REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
  currency text NULL,
  currencyEnabled boolean NULL,
  customerId uuid NULL REFERENCES public.customers(id) ON DELETE SET NULL,
  customFields jsonb NULL,
  deliverables jsonb NULL,
  deliverablesEnabled boolean NULL,
  description text NULL,
  documents jsonb NULL,
  effectiveDate timestamptz NULL,
  emailToCustomer boolean NULL,
  endDate timestamptz NULL,
  hasAgreedToTerms boolean NULL,
  hasPaymentTerms boolean NULL,
  hasServiceAgreement boolean NULL,
  isArchived boolean NULL,
  isPublished boolean NULL,
  name text NULL,
  notes text NULL,
  paymentMilestones jsonb NULL,
  paymentStructure text NULL,
  projectTypeId uuid NULL,
  serviceAgreement jsonb NULL,
  signedOn timestamptz NULL,
  signedStatus text NULL,
  startDate timestamptz NULL,
  state text NULL,
  status text NULL,
  type text NULL,
  updatedOn timestamptz NULL
);

CREATE TABLE IF NOT EXISTS public.deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT timezone('utc', now()),
  createdBy uuid NULL REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
  description text NULL,
  dueDate timestamptz NULL,
  isPublished boolean NULL,
  lastSaved timestamptz NULL,
  name text NULL,
  position integer NULL,
  projectId uuid NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  status text NULL,
  updatedAt timestamptz NULL
);

CREATE TABLE IF NOT EXISTS public.paymentTerms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NULL,
  created_at timestamptz DEFAULT timezone('utc', now()),
  createdBy uuid NULL REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
  deliverableId uuid NULL REFERENCES public.deliverables(id) ON DELETE SET NULL,
  description text NULL,
  dueDate timestamptz NULL,
  hasPaymentTerms boolean NULL,
  name text NULL,
  percentage numeric NULL,
  projectId uuid NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  status text NULL,
  type text NULL,
  updatedAt timestamptz NULL
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT timezone('utc', now()),
  createdBy uuid NULL REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
  currency text NULL,
  customerId uuid NULL REFERENCES public.customers(id) ON DELETE SET NULL,
  dueDate timestamptz NULL,
  emailSentAt timestamptz NULL,
  invoiceDetails jsonb NULL,
  invoiceNumber text NULL,
  issueDate timestamptz NULL,
  notes text NULL,
  paymentDetails jsonb NULL,
  paymentLink text NULL,
  paymentType text NULL,
  projectId uuid NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  sentViaEmail boolean NULL,
  status text NULL,
  subTotalAmount numeric NULL,
  taxRate numeric NULL,
  totalAmount numeric NULL,
  updatedAt timestamptz NULL,
  vatRate numeric NULL
);

CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT timezone('utc', now()),
  createdBy uuid NULL REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
  creationMethod text NULL,
  currency text NULL,
  customerId uuid NULL REFERENCES public.customers(id) ON DELETE SET NULL,
  dueDate timestamptz NULL,
  emailSentAt timestamptz NULL,
  invoiceId uuid NULL REFERENCES public.invoices(id) ON DELETE SET NULL,
  issueDate timestamptz NULL,
  notes text NULL,
  paymentConfirmedAt timestamptz NULL,
  paymentDetails jsonb NULL,
  paymentLink text NULL,
  paymentType text NULL,
  projectId uuid NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  receiptDetails jsonb NULL,
  receiptNumber text NULL,
  sentViaEmail boolean NULL,
  status text NULL,
  subtotalAmount numeric NULL,
  taxAmount numeric NULL,
  totalAmount numeric NULL,
  updatedAt timestamptz NULL,
  vatRate numeric NULL
); 