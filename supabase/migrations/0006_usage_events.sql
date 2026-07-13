create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  anon_id text not null,
  event_type text not null,
  section text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_anon_id_idx on usage_events (anon_id);
create index if not exists usage_events_event_type_idx on usage_events (event_type);
create index if not exists usage_events_created_at_idx on usage_events (created_at);

alter table usage_events enable row level security;

-- Write-only from the app: FCs' browsers can log events but cannot read the
-- table back. Reads are done from the admin dashboard via the service-role
-- key, which bypasses RLS entirely.
drop policy if exists "usage_events_v1_insert" on usage_events;
create policy "usage_events_v1_insert" on usage_events for insert with check (true);
