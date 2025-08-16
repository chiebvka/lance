-- Enums
create type event_entity_enum as enum ('wall', 'links_page', 'link_item', 'file');
create type event_type_enum   as enum ('page_view', 'click', 'download', 'share');