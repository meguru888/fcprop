-- Sprint 5 (beta-ready): real Supabase Auth accounts + per-FC data isolation.
-- Replaces the permissive v1 "using (true)" policies from 0001_init.sql /
-- 0002_storage_policies.sql with auth.uid()-scoped ownership, while keeping
-- demo/seed rows (user_id is null) visible-but-read-only to every active FC.

-- ---------------------------------------------------------------------------
-- 1. fc_profiles becomes the FC account record: link to auth.users, add
--    email + active (admin-controlled access gate).
-- ---------------------------------------------------------------------------
alter table fc_profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists email text,
  add column if not exists active boolean not null default true;

create unique index if not exists fc_profiles_user_id_key on fc_profiles (user_id);

-- ---------------------------------------------------------------------------
-- 2. Helper: is the currently-authenticated user an active FC?
--    security definer so it can read fc_profiles regardless of the caller's
--    own RLS visibility (avoids recursive-policy issues).
-- ---------------------------------------------------------------------------
create or replace function public.fc_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select active from fc_profiles where user_id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. fc_profiles RLS: an FC can see and edit only their own profile row.
--    Column-level grants (below) stop an FC from ever writing their own
--    "active" flag or "email" even if application code has a bug — only the
--    service-role key (used by admin server actions) can touch those.
-- ---------------------------------------------------------------------------
drop policy if exists "fc_profiles_v1_read" on fc_profiles;
drop policy if exists "fc_profiles_v1_write" on fc_profiles;

create policy "fc_profiles_self_read" on fc_profiles
  for select using (user_id = auth.uid());

create policy "fc_profiles_self_update" on fc_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke update on fc_profiles from authenticated;
grant update (name, company_name, title_credentials, updated_at) on fc_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Core data tables: own rows + read-only demo rows (user_id is null).
--    Deactivated FCs (fc_is_active() = false) lose all access immediately,
--    not just on next login.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['icps', 'clients', 'client_profiles', 'benefit_illustrations', 'product_kb_docs', 'proposals', 'audit_logs']
  loop
    execute format('drop policy if exists "%s_v1_read" on %I', t, t);
    execute format('drop policy if exists "%s_v1_write" on %I', t, t);
    execute format('drop policy if exists "%s_select" on %I', t, t);
    execute format('drop policy if exists "%s_write" on %I', t, t);

    execute format(
      'create policy "%s_select" on %I for select using (public.fc_is_active() and (user_id is null or user_id = auth.uid()))',
      t, t
    );
    execute format(
      'create policy "%s_write" on %I for all using (public.fc_is_active() and user_id = auth.uid()) with check (public.fc_is_active() and user_id = auth.uid())',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Storage: rely on Supabase Storage's built-in "owner" column, which the
--    storage API sets automatically to auth.uid() on upload when the caller
--    is an authenticated session (not the anon key). No path-format change
--    needed, so pre-auth-era stored paths keep working.
-- ---------------------------------------------------------------------------
drop policy if exists "fcprop_buckets_v1_all" on storage.objects;

create policy "fcprop_buckets_select" on storage.objects
  for select using (
    bucket_id in ('icp-docs', 'client-docs', 'benefit-illustrations', 'product-kb')
    and public.fc_is_active()
    and (owner is null or owner = auth.uid())
  );

create policy "fcprop_buckets_write" on storage.objects
  for insert with check (
    bucket_id in ('icp-docs', 'client-docs', 'benefit-illustrations', 'product-kb')
    and public.fc_is_active()
  );

create policy "fcprop_buckets_modify" on storage.objects
  for update using (
    bucket_id in ('icp-docs', 'client-docs', 'benefit-illustrations', 'product-kb')
    and public.fc_is_active()
    and owner = auth.uid()
  );

create policy "fcprop_buckets_delete" on storage.objects
  for delete using (
    bucket_id in ('icp-docs', 'client-docs', 'benefit-illustrations', 'product-kb')
    and public.fc_is_active()
    and owner = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 6. admin_documents: add a real user_id column alongside the existing
--    anon_id, so the admin dashboard's Section 4 breakdown can join to
--    fc_profiles for the FC's actual name + company (this table stays
--    service-role-only; no new anon/authenticated policy is added).
-- ---------------------------------------------------------------------------
alter table admin_documents
  add column if not exists uploader_user_id uuid references auth.users(id) on delete set null;

create index if not exists admin_documents_uploader_user_id_idx on admin_documents (uploader_user_id);
