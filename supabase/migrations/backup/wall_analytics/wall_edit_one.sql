-- Suggested uniques
alter table public.walls
  add constraint walls_org_slug_unique unique ( "organizationId", "slug" );