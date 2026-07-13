-- Locked-down archive of every document FCs upload to the product KB.
-- Deliberately separate from product_kb_docs: no anon/authenticated policies
-- are created here, so this table is reachable only via the service_role key
-- (which bypasses RLS entirely), used exclusively in server-only admin code.
create table if not exists admin_documents (
  id uuid primary key default gen_random_uuid(),
  kb_doc_id uuid references product_kb_docs(id) on delete set null,
  storage_path text not null,
  original_filename text,
  doc_type text,
  uploader_anon_id text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists admin_documents_uploader_anon_id_idx on admin_documents (uploader_anon_id);
create index if not exists admin_documents_doc_type_idx on admin_documents (doc_type);

alter table admin_documents enable row level security;
-- No policies are created for anon/authenticated on purpose — default deny.
