-- Site visits table: one row per unique visitor (token/cookie id).
-- Used for real-time site visit count on the home page.
-- Run this in Supabase SQL Editor, then enable Realtime for this table in Dashboard.

create table if not exists public.unora_site_visits (
  visitor_id text primary key,
  last_visited_at timestamptz not null default now()
);

-- RLS: allow anonymous read (for count) and upsert (so visitors can record themselves)
alter table public.unora_site_visits enable row level security;

create policy "Allow read for count"
  on public.unora_site_visits for select
  using (true);

create policy "Allow insert for visitors"
  on public.unora_site_visits for insert
  with check (true);

create policy "Allow update for visitors"
  on public.unora_site_visits for update
  using (true)
  with check (true);

-- Enable Realtime so the frontend can subscribe to changes and refresh the count.
-- If this errors with "already member of publication", table is already enabled (or enable via Dashboard → Realtime).
alter publication supabase_realtime add table public.unora_site_visits;
