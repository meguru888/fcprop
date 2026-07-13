-- Repair pass for 0009_auth_lockdown.sql.
--
-- Live-verification after 0009 was applied found that any authenticated FC
-- could still read (and write) every other FC's clients/profiles/etc. The
-- 0009 script's large `do $$ ... $$` block (which drops the old v1
-- "using (true)" policies and replaces them with strict auth.uid()-scoped
-- ones) appears to not have run — likely lost in the same copy/paste
-- truncation that dropped admin_documents.uploader_user_id earlier in this
-- session. Since Postgres OR's multiple permissive policies together, the
-- old "_v1_read"/"_v1_write" (using (true)) policies staying in place
-- silently defeats the new stricter policies sitting alongside them.
--
-- This migration re-asserts every policy from 0009 sections 2-5. Every
-- statement here is written to be safely re-runnable (drop-if-exists /
-- create-or-replace before create), so it's harmless to run even against a
-- database where 0009 did fully apply.
--
-- Confirmed by a second failed apply attempt: `public.fc_is_active()` also
-- doesn't exist yet, meaning section 2 of 0009 (the helper function itself)
-- never ran either — not just section 4's policy-rewrite DO block. So this
-- repair re-creates the function too, before anything that depends on it.

-- ---------------------------------------------------------------------------
-- Helper: is the currently-authenticated user an active FC?
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
-- fc_profiles: self-row-only read/update.
-- ---------------------------------------------------------------------------
drop policy if exists "fc_profiles_v1_read" on fc_profiles;
drop policy if exists "fc_profiles_v1_write" on fc_profiles;
drop policy if exists "fc_profiles_self_read" on fc_profiles;
drop policy if exists "fc_profiles_self_update" on fc_profiles;

create policy "fc_profiles_self_read" on fc_profiles
  for select using (user_id = auth.uid());

create policy "fc_profiles_self_update" on fc_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke update on fc_profiles from authenticated;
grant update (name, company_name, title_credentials, updated_at) on fc_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Core data tables: own rows + read-only demo rows (user_id is null).
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
-- Storage.
-- ---------------------------------------------------------------------------
drop policy if exists "fcprop_buckets_v1_all" on storage.objects;
drop policy if exists "fcprop_buckets_select" on storage.objects;
drop policy if exists "fcprop_buckets_write" on storage.objects;
drop policy if exists "fcprop_buckets_modify" on storage.objects;
drop policy if exists "fcprop_buckets_delete" on storage.objects;

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
