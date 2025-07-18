CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NULL,
  addressLine1 text NULL,
  addressLine2 text NULL,
  city text NULL,
  contactPerson text NULL,
  country text NULL,
  created_at timestamptz DEFAULT timezone('utc', now()),
  createdBy uuid NULL REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
  email text NULL,
  fullAddress text NULL,
  name text NULL,
  notes text NULL,
  organizationId uuid NULL REFERENCES public.organization(id) ON DELETE SET NULL,
  phone text NULL,
  postalCode text NULL,
  state text NULL,
  taxId text NULL,
  unitNumber text NULL,
  updated_at timestamptz NULL,
  website text NULL
);