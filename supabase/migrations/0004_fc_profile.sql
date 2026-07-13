create table if not exists fc_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text,
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table fc_profiles enable row level security;
drop policy if exists "fc_profiles_v1_read" on fc_profiles;
create policy "fc_profiles_v1_read" on fc_profiles for select using (true);
drop policy if exists "fc_profiles_v1_write" on fc_profiles;
create policy "fc_profiles_v1_write" on fc_profiles for all using (true) with check (true);
