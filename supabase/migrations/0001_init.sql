create extension if not exists vector;

create table if not exists icps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  is_default boolean not null default false,
  chat_text text,
  file_urls text[],
  summary text,
  summary_source text,
  summary_confidence numeric,
  summary_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);

alter table icps enable row level security;
drop policy if exists "icps_v1_read" on icps;
create policy "icps_v1_read" on icps for select using (true);
drop policy if exists "icps_v1_write" on icps;
create policy "icps_v1_write" on icps for all using (true) with check (true);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  age integer,
  email text,
  created_at timestamptz not null default now()
);

alter table clients enable row level security;
drop policy if exists "clients_v1_read" on clients;
create policy "clients_v1_read" on clients for select using (true);
drop policy if exists "clients_v1_write" on clients;
create policy "clients_v1_write" on clients for all using (true) with check (true);

create table if not exists client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  client_id uuid references clients(id),
  notes_text text,
  file_urls text[],
  pain_points text,
  pain_points_source text,
  pain_points_confidence numeric,
  pain_points_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);

alter table client_profiles enable row level security;
drop policy if exists "client_profiles_v1_read" on client_profiles;
create policy "client_profiles_v1_read" on client_profiles for select using (true);
drop policy if exists "client_profiles_v1_write" on client_profiles;
create policy "client_profiles_v1_write" on client_profiles for all using (true) with check (true);

create table if not exists benefit_illustrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  client_id uuid references clients(id),
  file_url text,
  product_name text,
  created_at timestamptz not null default now()
);

alter table benefit_illustrations enable row level security;
drop policy if exists "benefit_illustrations_v1_read" on benefit_illustrations;
create policy "benefit_illustrations_v1_read" on benefit_illustrations for select using (true);
drop policy if exists "benefit_illustrations_v1_write" on benefit_illustrations;
create policy "benefit_illustrations_v1_write" on benefit_illustrations for all using (true) with check (true);

create table if not exists product_kb_docs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  file_url text,
  original_filename text,
  concept_summary text,
  concept_summary_source text,
  concept_summary_confidence numeric,
  concept_summary_review_status text default 'unreviewed',
  embedding vector(1536),
  created_at timestamptz not null default now()
);

alter table product_kb_docs enable row level security;
drop policy if exists "product_kb_docs_v1_read" on product_kb_docs;
create policy "product_kb_docs_v1_read" on product_kb_docs for select using (true);
drop policy if exists "product_kb_docs_v1_write" on product_kb_docs;
create policy "product_kb_docs_v1_write" on product_kb_docs for all using (true) with check (true);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  client_id uuid references clients(id),
  status text not null default 'draft',
  content_json jsonb,
  product_used text,
  content_source text,
  content_confidence numeric,
  content_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);

alter table proposals enable row level security;
drop policy if exists "proposals_v1_read" on proposals;
create policy "proposals_v1_read" on proposals for select using (true);
drop policy if exists "proposals_v1_write" on proposals;
create policy "proposals_v1_write" on proposals for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  tool_name text,
  input_ref_id uuid,
  output_ref_id uuid,
  triggered_by text,
  status text,
  latency_ms integer,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into icps (id, user_id, is_default, chat_text, summary, summary_source, summary_confidence, summary_review_status)
values
  (gen_random_uuid(), null, true, 'My ideal client is a working professional aged 30–45, married with young children, focused on protecting their family income and planning for retirement. They are risk-averse and value clear, transparent advice.', 'Young to mid-career professional, family-oriented, risk-averse, primary concerns: income protection and retirement planning.', 'seed', 1.0, 'approved');

insert into clients (id, user_id, name, age, email)
values
  ('a1000000-0000-0000-0000-000000000001', null, 'Sarah Tan', 35, 'sarah.tan@email.com'),
  ('a1000000-0000-0000-0000-000000000002', null, 'Marcus Lim', 42, 'marcus.lim@email.com'),
  ('a1000000-0000-0000-0000-000000000003', null, 'Priya Nair', 29, 'priya.nair@email.com');

insert into client_profiles (id, user_id, client_id, notes_text, pain_points, pain_points_source, pain_points_confidence, pain_points_review_status)
values
  (gen_random_uuid(), null, 'a1000000-0000-0000-0000-000000000001', 'Sarah is a nurse with two kids aged 4 and 7. Her husband is self-employed. She worries about what happens to the family if she falls critically ill. She dreams of retiring at 58 and funding her children''s university education overseas.', 'No critical illness cover; insufficient emergency savings; income protection gap for self-employed spouse; education funding shortfall.', 'seed', 1.0, 'approved'),
  (gen_random_uuid(), null, 'a1000000-0000-0000-0000-000000000002', 'Marcus is a regional sales director. He has an existing term plan but it expires at 65. He is concerned about outliving his savings and has no legacy plan. His dream is to travel extensively in retirement without financial worry.', 'Term plan expiry risk; longevity risk; no legacy or estate plan; retirement income gap.', 'seed', 1.0, 'approved'),
  (gen_random_uuid(), null, 'a1000000-0000-0000-0000-000000000003', 'Priya just started her first job as a data analyst. She has no insurance and no savings plan. She wants to buy a flat in 5 years and is worried about student loan debt. She dreams of financial independence by 45.', 'Zero insurance coverage; no savings discipline; student debt burden; short-term property goal conflicting with long-term FIRE target.', 'seed', 1.0, 'approved');

insert into product_kb_docs (id, user_id, original_filename, concept_summary, concept_summary_source, concept_summary_confidence, concept_summary_review_status)
values
  (gen_random_uuid(), null, 'GreatLife_Multiplier_III_Sample.pdf', 'Whole life plan with critical illness multiplier payout up to age 70; premiums payable over 20 years; cash value accumulates for retirement top-up.', 'seed', 1.0, 'approved'),
  (gen_random_uuid(), null, 'IncomeSure_Endowment_Sample.pdf', 'Short-to-mid term endowment providing guaranteed maturity benefit and annual cash coupons; suitable for mid-term savings goals like property down payment or education fund.', 'seed', 1.0, 'approved'),
  (gen_random_uuid(), null, 'PRUActive_Retirement_Sample.pdf', 'Retirement income annuity that provides monthly payouts from chosen retirement age for life; includes a capital guarantee and a death benefit for estate planning.', 'seed', 1.0, 'approved');

insert into proposals (id, user_id, client_id, status, product_used, content_source, content_confidence, content_review_status, content_json)
values
  (gen_random_uuid(), null, 'a1000000-0000-0000-0000-000000000001', 'ready', 'GreatLife Multiplier III', 'seed', 1.0, 'approved', '{"opening_story":"Sarah, imagine a Tuesday morning when everything changes...","problem_bridge":"Today, a critical illness diagnosis could cost your family SGD 300,000 in lost income alone.","solution_reveal":"The GreatLife Multiplier III gives you a 3× payout exactly when you need it most.","benefit_breakdown":{"critical_illness_payout":"SGD 450,000","premium_term":"20 years","cash_value_at_58":"SGD 82,000"},"dream_outcome":"By 58, with your plan fully paid up, you retire on your terms — kids through university, holidays booked, legacy secured.","call_to_action":"Let us take the next step together. Your family''s protection starts with one signature."}');