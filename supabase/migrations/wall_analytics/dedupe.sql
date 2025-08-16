-- De-dupe "unique per day" fast path
create unique index if not exists ae_unique_daily
  on analytics_events(entity_type, entity_id, event_type, viewer_hash, day_key);