-- Core events table
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  entity_type event_entity_enum not null,
  entity_id   text not null,                         -- uuid/text of the target (wall id, links page id, link item id, file key, etc.)
  event_type  event_type_enum not null,
  url         text,
  referrer    text,
  session_id  text,                                  -- client-side UUID (localStorage)
  viewer_hash text,                                  -- sha256(ip|ua|session) for uniqueness
  country     text,
  region      text,
  city        text,
  user_agent  text,
  is_bot      boolean default false,
  metadata    jsonb,                                 -- { blockId, fileKey, linkItemId, utm: {...} }
  created_at  timestamptz default now(),
  day_key     date generated always as ((created_at at time zone 'utc')::date) stored
);

create index if not exists ae_entity_time_idx on analytics_events(entity_type, entity_id, created_at);
create index if not exists ae_event_time_idx  on analytics_events(event_type, created_at);
create index if not exists ae_day_idx         on analytics_events(day_key);
create index if not exists ae_session_idx     on analytics_events(session_id);