-- Optional: child table for per-link items
create table if not exists link_items (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.links(id) on delete cascade,
  title text not null,
  url   text not null,
  icon  text,
  color text,
  position int default 0,
  click_count int default 0,
  created_at timestamptz default now()
);