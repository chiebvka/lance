create extension if not exists citext;

alter table public.walls
  alter column slug type citext;

create unique index if not exists walls_org_slug_unique
  on public.walls ("organizationId", slug)
  where slug is not null;