CREATE TABLE IF NOT EXISTS public.organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baseCurrency text NULL,
  country text NULL,
  created_at timestamptz DEFAULT timezone('utc', now()),
  createdBy uuid NULL REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
  email text NULL,
  logoUrl text NULL,
  name text NULL,
  updated_at timestamptz NULL
); 