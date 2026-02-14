-- Allow multiple rows per visitor (each load/reload = new row).
-- Run in Supabase SQL Editor after the initial unora_site_visits table exists.

-- Drop the primary key on visitor_id so we can insert many rows
alter table public.unora_site_visits drop constraint if exists unora_site_visits_pkey;

-- Add id as new primary key (existing rows get id 1, 2, 3...; new rows auto-increment)
alter table public.unora_site_visits add column if not exists id bigserial primary key;
