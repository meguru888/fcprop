-- v1 demo-first: no login wall yet, so uploads/reads happen via the anon key.
-- Buckets are private (docs/SECURITY.md: "authenticated read only, signed URLs
-- served server-side"); these policies grant the anon/authenticated roles the
-- same permissive v1 access already used for the DB tables in 0001_init.sql.
drop policy if exists "fcprop_buckets_v1_all" on storage.objects;
create policy "fcprop_buckets_v1_all" on storage.objects
  for all
  using (bucket_id in ('icp-docs', 'client-docs', 'benefit-illustrations', 'product-kb'))
  with check (bucket_id in ('icp-docs', 'client-docs', 'benefit-illustrations', 'product-kb'));
