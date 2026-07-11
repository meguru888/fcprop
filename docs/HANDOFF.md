# HANDOFF.md — fcprop complete project handoff

Written 2026-07-11, at `HEAD = 00b9725` with 13 uncommitted working-tree files (see §17). This is the master handoff document. Companion documents: `docs/PROJECT_STATUS.md` (current state, testing, known issues), `docs/ARCHITECTURE_DECISIONS.md` (why things are built this way), `docs/NEXT_STEPS.md` (what to do next). Read all four before touching code.

---

## 1. Project Overview

fcprop is an AI-powered proposal builder for Singapore financial consultants (FCs). Core objects: **ICP** (Ideal Client Profile — one per FC, describes their typical client, has exactly one `is_default`), **Client** (a real client of the FC — name, age), **ClientProfile** (fact-find notes + AI-extracted pain points for a client), **BenefitIllustration** (an uploaded insurance product illustration PDF, with AI-extracted real figures), **ProductKbDoc** (a knowledge-base product document, embedded for semantic matching), **Proposal** (the generated output — six narrative sections, charts, real figures, a status of `draft`/`ready`/`exported`).

The core workflow (PRD success scenario): FC sets a default ICP once → adds a client with fact-find notes → either uploads a real benefit illustration OR lets the app semantic-match a KB product → clicks Generate → gets a six-section, emotionally resonant, fact-grounded proposal citing real figures where available → reviews and approves it → exports to PDF.

Full spec: `docs/PRD.md`. Data model: `docs/DATA_MODEL.md`. Build sequence: `docs/TASKS.md`. Intelligence design: `docs/INTELLIGENCE_LAYER.md`. Agentic/tool-risk design: `docs/AGENTIC_LAYER.md`. Security posture: `docs/SECURITY.md`. Manual test scenarios: `docs/TEST_PLAN.md`.

Stack: Next.js 15 (App Router) + React 19, Supabase (Postgres + pgvector + Storage + RLS), Bun runtime (`bun@1.1.30`), Vercel (deploy by git push only — see §14), Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config.js`), OpenAI SDK (`openai@^6.46.0`), `@react-pdf/renderer` for PDF export, `pdf-parse@2.4.5` for text extraction.

---

## 2. Current Implementation Status

See `docs/PROJECT_STATUS.md` for the full sprint-by-sprint breakdown with objectives, approach, files touched, and DoD verification for Sprints 1–4 (all done), the benefit-illustration extraction feature (done, not in original plan), and Sprint 5/auth (not started). Summary table:

| Sprint | Status | Commit |
|---|---|---|
| 1 — DB + File Intake | Done | `64cce08` |
| 2 — Proposal Generation Engine | Done | `11f3937` |
| 3 — Presentation Polish | Done (+ uncommitted 2nd visual pass, see §17) | `a2ed7d1` |
| 4 — Default ICP Memory + KB Background | Done | `00b9725` |
| 5 — Lock It Down (Auth) | Not started | — |
| (extra) Benefit-illustration figure extraction | Done | `9e93698` |

---

## 3. Complete File Inventory

### `app/` — pages and API routes
- `app/page.tsx` — home page. Fetches `getDefaultIcp()`, `listClients()`, `listKbDocs()` in parallel (Server Component). Renders `IcpPanel`, client list, `NewClientForm`, `KbPanel`. Safe to modify.
- `app/layout.tsx` — root layout. Loads `Manrope`/`Fraunces` Google Fonts (uncommitted change, see §17), sets page metadata. Safe to modify.
- `app/globals.css` — Tailwind v4 theme tokens (uncommitted redesign, see §17). Safe to modify but understand the `@theme` block before touching — it's the single source of truth for the color/shadow system.
- `app/clients/[id]/page.tsx` — client detail page. Fetches client + profile + illustration + proposal in parallel. Renders `ClientProfileForm`, `BenefitIllustrationForm`, `GenerateProposalSection`, conditionally `ProposalView`, and `DeleteClientButton`. Safe to modify.
- `app/api/summarize-icp/route.ts`, `extract-pain-points/route.ts`, `embed-kb-doc/route.ts`, `match-kb-product/route.ts`, `generate-proposal/route.ts` — thin JSON wrappers around the corresponding `lib/ai/tools.ts` functions. **Not used by the UI** (the UI calls Server Actions in `lib/actions/` which call `lib/ai/tools.ts` directly). These exist as a secondary/testable HTTP surface. Safe to modify, but changing behavior here does NOT affect the UI — check `lib/actions/` too.
- `app/api/health/route.ts` — returns `{status:"ok", timestamp}`. Leave as-is.
- `app/api/proposals/[id]/pdf/route.tsx` — streams a PDF via `@react-pdf/renderer` using `lib/pdf/proposal-pdf.tsx`. Safe to modify.
- `app/api/stripe/checkout/route.ts`, `portal/route.ts`, `webhooks/route.ts` — **dead scaffolding**. References a `profiles`/`purchases`/`subscriptions` schema that does not exist in any applied migration. Do not assume this works; do not build on top of it without first deciding whether to properly wire it or delete it (see `docs/NEXT_STEPS.md` Phase 2).

### `components/` — the premium UI system
All 9 components below were touched by the uncommitted redesign (§17) except `delete-client-button.tsx`, which was not modified this session.
- `icp-panel.tsx` — **modified this session (committed, part of `00b9725`), then further restyled (uncommitted)**. Three modes: `view`/`edit`/`browse`. `browse` mode (new this session) lists all ICPs via `listIcps()` and lets the FC pick a new default via `setDefaultIcp()`. Fixed bug: `defaultChecked={true}` on the "Set as Default" checkbox (was `!defaultIcp`, which silently orphaned the default on edit — see `docs/PROJECT_STATUS.md` §2 Sprint 4). Safe to modify.
- `kb-panel.tsx` — KB doc list with inline delete (`deleteKbDoc.bind(null, doc.id)`), shows `concept_summary` or "Not yet digested". Safe to modify.
- `new-client-form.tsx` — collapsible "+ New client" form. Safe to modify.
- `client-profile-form.tsx` — fact-find textarea + file upload, shows AI pain points inline. Safe to modify.
- `benefit-illustration-form.tsx` — upload form + `ExtractionStatusBadge` sub-component with a `STATUS_COPY` map covering all 5 `ExtractionStatus` values (color-coded pills: `ok`=emerald, `partial`=amber, `no_text_layer`/`unsupported_format`=neutral, `failed`=red). Safe to modify, but if you change `ExtractionStatus` values you must update `STATUS_COPY` and the DB check (there is no DB-level enum constraint — see §4).
- `generate-proposal-section.tsx` — gradient CTA section. Handles `blocked`/`needs_illustration`/`error`/success states from `runGenerateProposal()`. Two-step "Regenerate" confirmation (`confirmingRegenerate` state) — only shown when `proposalStatus === "ready"`, per the medium-risk-action pattern in `docs/AGENTIC_LAYER.md`. Safe to modify.
- `proposal-approve-button.tsx` — sets proposal `status: "ready"` via `runApproveProposal()`. Safe to modify.
- `proposal-view.tsx` — full proposal rendering: numbered sections (01–06, serif italic index numbers), pain point pills, `real_figures` box (only rendered if present — never fabricates a display for absent figures), `before_after`/`benefit_timeline` chart visualizations (bar-based, not a charting library), status pill, Approve button, Export PDF link. Safe to modify.
- `delete-client-button.tsx` — two-step confirm pattern. Not touched this session. Safe to modify.

### `lib/actions/` — Server Actions (the actual backend surface the UI calls)
- `icp.ts` — `getDefaultIcp()`, `listIcps()`, `saveIcp()` (useActionState-compatible), `setDefaultIcp(icpId)`. `listIcps`/`setDefaultIcp` are called directly (not as form actions) from `icp-panel.tsx`'s browse mode. Safe to modify.
- `kb.ts` — `listKbDocs()`, `uploadKbDoc()` (uploads to `product-kb` bucket, inserts row, calls `embedKbDoc()` synchronously/best-effort — see Known Issues in `docs/PROJECT_STATUS.md`), `deleteKbDoc(id)`. Safe to modify.
- `clients.ts` — `listClients()`, `getClient(id)`, `createClientRecord()` (validates, redirects to `/clients/{id}`), `deleteClient()` (cascades: `proposals` → `benefit_illustrations` → `client_profiles` → `clients`). Safe to modify, but preserve cascade order if you touch delete logic — the FK relationships require children deleted before the parent.
- `proposals.ts` — `getLatestProposal(clientId)`, `runGenerateProposal()` (wraps `generateProposal`, maps result to UI states), `approveProposal(proposalId, clientId)`, `runApproveProposal()`. Safe to modify.
- `benefit-illustrations.ts` — `getBenefitIllustration(clientId)`, `saveBenefitIllustration()` (uploads to `bi/{clientId}` path, calls `extractFigures()`, inserts row with all extraction metadata + audit log), internal `extractFigures(file)` helper (checks MIME/extension → `extractPdfText` → branches to skip-LLM or call `extractBenefitIllustrationFigures`). This is the anti-hallucination gate entry point — see §7 and `docs/ARCHITECTURE_DECISIONS.md` §3 before modifying.
- `client-profiles.ts` — `getClientProfile(clientId)`, `saveClientProfile()` (upsert: update existing or insert new, appends to existing `file_urls`, calls `extractPainPoints` best-effort). Safe to modify.

### `lib/ai/` — the intelligence core
- `tools.ts` — **the most safety-critical file in the codebase**. Contains `extractBenefitIllustrationFigures`, `summarizeIcp`, `extractPainPoints`, `embedKbDoc`, `matchKbProduct`, `generateProposal`, plus `KB_MATCH_THRESHOLD = 0.78`. Full verbatim prompts in §6 below. **Do not modify the anti-hallucination language in the extraction or proposal-generation prompts without understanding `docs/ARCHITECTURE_DECISIONS.md` §3–4 first** — these are load-bearing for the "never fabricate a financial figure" guarantee.
- `audit.ts` — `writeAuditLog(supabase, entry)`. Called from all 6 tool call sites. Safe to modify (e.g. to add fields), but don't remove call sites.
- `similarity.ts` — `cosineSimilarity()` used by `matchKbProduct`. Safe to modify.

### `lib/openai/client.ts` — model configuration
`CHAT_MODEL = "gpt-5.4-mini"`, `EMBEDDING_MODEL = "text-embedding-3-small"`, `getOpenAI()` lazy singleton returning `null` if `OPENAI_API_KEY` unset. This is the ONLY place model names should be hardcoded — see `docs/ARCHITECTURE_DECISIONS.md` §1.

### `lib/pdf/` — extraction and PDF export
- `extract-text.ts` — `MIN_MEANINGFUL_CHARS = 40`; `extractPdfText(buffer)` returns `{text, noTextLayer, failed}`. This is the anti-hallucination gate — see §7. Do not lower `MIN_MEANINGFUL_CHARS` without understanding the tradeoff (lower = more attempts on marginal PDFs, higher risk of the LLM extracting from noise).
- `proposal-pdf.tsx` — React-PDF document. Uncommitted redesign touched this file (§17) — verify PDF export still renders after that lands. Safe to modify.

### `lib/proposal-content.ts` — trivial helper
`extractContent(proposal)` casts `proposal.content_json` to `ProposalContent`. Safe to modify.

### `lib/stripe/index.ts` — Stripe SDK init, part of the dead scaffolding described above.

### `lib/supabase/` — data layer
- `client.ts` — browser client (`createBrowserClient`).
- `server.ts` — server client (`createServerClient`, wraps `cookies()`).
- `middleware.ts` — `updateSession()`, guards against missing env vars, never crashes.
- `storage.ts` — `BUCKETS` const, `ALLOWED_TYPES`, `assertUploadable()`, `uploadToBucket()`, `publicUrl()`.
- `types.ts` — all TS interfaces mirroring the DB schema. **Update this file whenever you add a migration** — it is not auto-generated from the schema in this project.

### `supabase/migrations/` — see §4.

### `docs/` — planning + this handoff set. Do not delete the original 8 planning docs (`PRD.md` through `TEST_PLAN.md`) — they are the source of truth for product intent, referenced throughout this handoff.

---

## 4. Database

Three migrations, all applied to the live Supabase DB (confirmed by user for `0003`; `0001`/`0002` confirmed working since the app has been live and functional since Sprint 1).

**`0001_init.sql`** (150 lines) — creates the `vector` extension; 7 tables:
- `icps` (id, chat_text, file_urls text[], is_default bool, summary, summary_source, summary_confidence, summary_review_status, created_at)
- `clients` (id, name, age, created_at)
- `client_profiles` (id, client_id fk, notes_text, file_urls text[], pain_points, pain_points_source, pain_points_confidence, pain_points_review_status, created_at)
- `benefit_illustrations` (id, client_id fk, file_url, product_name, created_at — extraction columns added later in `0003`)
- `product_kb_docs` (id, original_filename, file_url, concept_summary, concept_summary_source, concept_summary_confidence, concept_summary_review_status, embedding vector, created_at)
- `proposals` (id, client_id fk, status, content_json jsonb, product_used, content_source, content_confidence, content_review_status, created_at)
- `audit_logs` (id, tool_name, input_ref_id, output_ref_id, triggered_by, status, latency_ms, created_at)

Every table has RLS **enabled** with a permissive v1 policy (`for select using (true)` / `for all using (true) with check (true)`) — see `docs/ARCHITECTURE_DECISIONS.md` §6 for why this is deliberate, not an oversight. Seeds: 1 default ICP, 3 demo clients (Sarah Tan/35, Marcus Lim/42, Priya Nair/29, fixed UUIDs `a1000000-0000-0000-0000-00000000000{1,2,3}`), 3 `client_profiles` with pain points, 3 `product_kb_docs` (GreatLife_Multiplier_III_Sample.pdf, IncomeSure_Endowment_Sample.pdf, PRUActive_Retirement_Sample.pdf), 1 seed proposal (Sarah Tan, `status='ready'`, GreatLife Multiplier III, full `content_json`).

**`0002_storage_policies.sql`** (9 lines, full text):
```sql
-- v1 demo-first: no login wall yet, so uploads/reads happen via the anon key.
-- Buckets are private (docs/SECURITY.md: "authenticated read only, signed URLs
-- served server-side"); these policies grant the anon/authenticated roles the
-- same permissive v1 access already used for the DB tables in 0001_init.sql.
drop policy if exists "fcprop_buckets_v1_all" on storage.objects;
create policy "fcprop_buckets_v1_all" on storage.objects
  for all
  using (bucket_id in ('icp-docs', 'client-docs', 'benefit-illustrations', 'product-kb'))
  with check (bucket_id in ('icp-docs', 'client-docs', 'benefit-illustrations', 'product-kb'));
```

**`0003_benefit_illustration_extraction.sql`** (full text, confirmed applied):
```sql
-- Structured figure extraction for uploaded benefit illustrations.
-- extracted_data holds ONLY figures actually found in the source document's text layer
-- (see lib/ai/tools.ts extractBenefitIllustrationFigures) — never LLM-estimated or invented numbers.
-- extraction_status distinguishes real success from the cases where we deliberately
-- withheld extraction rather than risk fabricating a figure:
--   'ok'                 real figures extracted from a text layer
--   'partial'            some figures extracted, others not found in the document
--   'no_text_layer'      scanned/image-only PDF, no extractable text — nothing invented
--   'unsupported_format' e.g. .doc/.docx, no parser wired up yet
--   'failed'             parser error
alter table benefit_illustrations
  add column if not exists extracted_data jsonb,
  add column if not exists extraction_status text,
  add column if not exists extraction_notes text,
  add column if not exists extraction_source text,
  add column if not exists extraction_confidence numeric,
  add column if not exists extraction_review_status text default 'unreviewed';
```

Note `extraction_status` has no DB-level `check` constraint enumerating the 5 valid values — validity is enforced only in application code (`ExtractionStatus` TS type in `lib/supabase/types.ts` and the branches in `lib/actions/benefit-illustrations.ts`). If you add a 6th status, update both places plus `STATUS_COPY` in `components/benefit-illustration-form.tsx`.

**No admin/service-role DB credentials exist in the local dev environment** — only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is present in `.env.local`. New migrations must be applied manually via the Supabase SQL Editor by the user (as was done for `0003`), not run automatically by any tool in this repo.

---

## 5. Storage

4 buckets: `icp-docs`, `client-docs`, `benefit-illustrations`, `product-kb` (constants in `lib/supabase/storage.ts` as `BUCKETS`). All **private**, gated by the single permissive RLS policy in `0002_storage_policies.sql` (see §4) rather than `public: true` — see `docs/ARCHITECTURE_DECISIONS.md` §5 for why (so Sprint 5 auth lockdown is a policy change, not an architecture migration).

Upload flow: client selects file → form submits to a Server Action (`saveIcp`, `saveBenefitIllustration`, `saveClientProfile`, `uploadKbDoc`) → `assertUploadable()` checks empty/size (>20MB rejected)/type (`ALLOWED_TYPES` = PDF, `.doc`, `.docx`) → `uploadToBucket()` sanitizes the filename and uploads to `{Date.now()}-{safeName}` under a bucket-specific path prefix (e.g. `bi/{clientId}/...` for benefit illustrations) → the returned storage *path* (not a public URL) is persisted to the DB row.

Download/display: `publicUrl()` in `lib/supabase/storage.ts` generates a URL on demand server-side from the stored path — there is no long-lived public URL baked into any DB row, which is what keeps the door open for real signed-URL-with-auth-check access control later without a data migration.

Limitations: no virus scanning, no file-type sniffing beyond extension/MIME (a renamed malicious file would pass `ALLOWED_TYPES`), 20MB hard cap with no chunked upload for larger files, no thumbnail/preview generation. Future improvement: move to real signed URLs with short TTLs once auth lands (Sprint 5), and consider server-side content-type verification (magic-byte sniffing) rather than trusting the browser-supplied MIME type.

---

## 6. AI Architecture

**Model choice**: `gpt-5.4-mini` for all chat/JSON completions (switched from `gpt-4o` in commit `534f47a`), `text-embedding-3-small` for embeddings. Both are single constants in `lib/openai/client.ts` — see `docs/ARCHITECTURE_DECISIONS.md` §1 for the reasoning (single point of change for future model swaps).

**Config location**: `lib/openai/client.ts` (`getOpenAI()`, `CHAT_MODEL`, `EMBEDDING_MODEL`). All AI logic lives in `lib/ai/tools.ts`. `OPENAI_API_KEY` is a required env var but is deliberately absent from `.env.example` (an oversight worth fixing, but not blocking — it is present in the actual local `.env.local` and in Vercel's env, confirmed because AI features work live).

**Graceful degradation**: every function in `lib/ai/tools.ts` checks `getOpenAI()` for `null` and falls back to deterministic templated behavior rather than throwing — see `docs/ARCHITECTURE_DECISIONS.md` §2.

**Temperature strategy**: `0` for figure extraction (deterministic, anti-hallucination), `0.3` for ICP summarization and pain-point extraction (light creativity, still factual), `0.4` for KB concept summaries (filename-only inference, inherently uncertain so a bit more latitude), `0.7` for proposal narrative generation (creative/emotional writing, but still fact-gated by explicit prompt rules).

**Structured outputs**: every completion that returns JSON uses `response_format: { type: "json_object" }` plus explicit shape documentation in the prompt, and every call site defensively type-checks/filters the parsed result rather than trusting it blindly (see the `scenarios` filtering logic in `extractBenefitIllustrationFigures`, or the `Array.isArray(parsed.before_after) ? parsed.before_after : undefined` guards in `generateProposal`).

### 6.1 Verbatim prompt — `extractBenefitIllustrationFigures` (system message, `lib/ai/tools.ts:47-69`)
```
You extract ONLY figures that are literally printed in this benefit illustration document. This is a real financial document for a real client — accuracy is critical, and a fabricated number could mislead someone about their own money.

Hard rules:
1. Never calculate, estimate, infer, round, or guess any figure. Only report a number if it appears explicitly in the text.
2. If a field is not explicitly present in the text, set it to null. Do not leave it out — include the key with a null value.
3. Extract EVERY distinct projection/scenario row you find (e.g. guaranteed vs non-guaranteed, or different illustrated rates of return), using the scenario label exactly as printed in the document (e.g. 'Guaranteed', 'Non-Guaranteed at 4.25% p.a.'). Do not invent a scenario that isn't named in the text.
4. For each scenario, extract the year-by-year values exactly as tabulated (e.g. surrender value, cash value, or death benefit at each policy year) — whatever the document's own table columns show.
5. currency should be exactly as printed (e.g. 'SGD', 'S$', 'USD').
6. If you are not fully confident a number belongs in the field you're about to place it in, leave that field null instead of guessing.

Respond with ONLY valid JSON matching this shape: {"currency": string|null, "premium": number|null, "premium_term_years": number|null, "sum_assured": number|null, "scenarios": [{"label": string, "rows": [{"year": number, "value": number}]}]}.
```
Called with `temperature: 0`, `response_format: json_object`, user message = raw extracted PDF text truncated to 24000 chars.

### 6.2 Verbatim prompt — `summarizeIcp` (`lib/ai/tools.ts:154-157`)
```
You summarize a financial consultant's Ideal Client Profile into one concise, plain-English sentence capturing demographics, life stage, and top financial concerns.
```
`temperature: 0.3`, user message = raw `chat_text`.

### 6.3 Verbatim prompt — `extractPainPoints` (`lib/ai/tools.ts:212-214`)
```
Extract the client's key financial pain points and gaps from these fact-find notes. Return a short semicolon-separated list, no preamble.
```
`temperature: 0.3`, user message = raw `notes_text`.

### 6.4 Verbatim prompt — `embedKbDoc` concept summary (`lib/ai/tools.ts:270-272`)
```
You are digesting a financial product document for a knowledge base used to match products to client needs. Given only the filename, write a plausible one-sentence concept summary of what this product likely offers (coverage type, term, typical use case). Be concise.
```
`temperature: 0.4`, user message = `original_filename` (note: this is filename-only inference, not document-content-based — a real limitation, see §9).

### 6.5 Verbatim prompt — `generateProposal` (`lib/ai/tools.ts:474-515`, full system message)
```
You are a warm, perceptive Singapore financial consultant (FC) writing a proposal to read aloud to your own client. Write in direct second person — "you" and "your" — as if speaking straight to them. Never describe them in the third person (not "Sarah faces these risks" but "you're facing these risks"). You may use their first name once or twice for warmth, never as a substitute for direct address.

This must read like real talk from an FC who actually knows this client's situation from a real fact-find — not a storybook narrator. In EVERY section, never use fictional framing devices like "Picture this", "Imagine", "Once", or invented scene details (weather, rooms, moments) that aren't implied by their actual data — this applies to dream_outcome just as much as opening_story. State things plainly and specifically, using only what's in their profile, pain points, and life stage — grounded fact delivered with warmth, not invented narrative or hypotheticals dressed up as scenes.

Structure the six sections as an emotional bridge that carries the client from their life today to the life they want, with the product as the vehicle that closes the gap:
- opening_story: Ground them in their real, current situation right now — their actual life stage, what they've genuinely built so far, and the real concern underneath it, drawn directly from their pain points and profile. This is a plain, honest reflection of their actual circumstances, not a scene-setting story.
- problem_bridge: Name the specific risks concretely — what's exposed, what could go wrong. Then make the cost of doing nothing vivid and real: what happens to them and the people they love if this gap stays open, and how it widens the longer they wait. Create urgency through honest clarity, not pressure.
- solution_reveal: Introduce the named product as the bridge — the specific vehicle that carries them from where they are to where they want to be. A turning point, not a feature list.
- benefit_breakdown: Connect each benefit directly back to a specific pain point named earlier — show concretely how each worry gets resolved.
- dream_outcome: Describe the 'after' state concretely and plausibly — the peace of mind, the family protected, the milestones secured — in clear contrast to opening_story. Ground it in their real goals, not invented imagery.
- call_to_action: A warm, direct, personal invitation to take the next step together.

Each section should be 3-5 sentences, concrete and specific to this client — no filler, no clichés, no boilerplate reassurance.

Respond with ONLY valid JSON matching this shape: {"opening_story": string, "problem_bridge": string, "solution_reveal": string, "benefit_breakdown": string, "dream_outcome": string, "call_to_action": string, "before_after": [{"label": string, "before": number, "after": number}], "benefit_timeline": [{"year": number, "value": number}]}. before_after should have 2-4 items, each a protection area from the client's pain points, with 'before' = their current coverage level and 'after' = their protected level once the plan is in place (both 0-100 scale). benefit_timeline should have 3-5 illustrative points (0-100 scale) showing how the plan's protection value builds over the years of the premium term. These are directional illustrations for the narrative only, not the client's actual policy figures.

[CONDITIONAL — if real_figures present:]
The user message includes 'real_figures' — actual numbers extracted from this client's real benefit illustration document. You may cite these EXACT figures naturally in benefit_breakdown and/or dream_outcome for credibility (e.g. their real premium, sum assured, or a specific projected value at a specific year). Never alter, round, recalculate, or invent any number beyond what's given in real_figures — if a figure isn't present there, don't state a specific dollar amount as if it were their actual policy figure.

[CONDITIONAL — if real_figures absent:]
No real policy figures were available for this client (no benefit illustration was uploaded, or it couldn't be read). Do not state any specific dollar amount as if it were their actual policy figure — speak about benefits and outcomes qualitatively instead.
```
`temperature: 0.7`, `response_format: json_object`. User message: JSON `{client_name, client_age, icp_context, pain_points, product_used, real_figures}`.

**Cost optimization**: `gpt-5.4-mini` chosen over a larger model for cost at scale (many FCs, many proposals); PDF text truncated to 24000 chars before sending to the extraction call (avoids paying for/exceeding context on very long documents — a real limitation for extremely long illustrations, see §7 Limitations); ICP/pain-point summarization uses short, cheap completions with no need for a larger model.

**Embedding pipeline**: `embedText()` in `lib/ai/tools.ts` calls `openai.embeddings.create({model: EMBEDDING_MODEL, input: text})`, returns `null` if no client configured. Used by `embedKbDoc` (embeds the `concept_summary`) and `matchKbProduct` (embeds the query text — client's `pain_points` or `notes_text`).

**KB pipeline**: upload → `uploadKbDoc()` → `embedKbDoc()` (concept summary from filename + embedding), synchronous in the request. See Known Issues in `docs/PROJECT_STATUS.md` for why this should become a real background job.

**Proposal generation pipeline**: see §10 below.

---

## 7. Benefit Illustration Extraction — complete documentation

**Parser**: `lib/pdf/extract-text.ts` → `extractPdfText(buffer)`, using `pdf-parse`'s `PDFParse` class (a pdf.js wrapper). `MIN_MEANINGFUL_CHARS = 40` — if the extracted text (trimmed) is under this length, `noTextLayer: true` is returned and the LLM is never called. `parser.destroy()` always called in `finally`.

**Anti-hallucination checks**: two layers — (1) structural gate: no meaningful text layer → no LLM call, full stop (`lib/pdf/extract-text.ts`); (2) prompt-level hard rules inside the LLM call itself (§6.1) — never estimate/infer/round, null for absent fields, exact scenario labels, exact currency. See `docs/ARCHITECTURE_DECISIONS.md` §3 for the full rationale.

**Confidence scoring**: deterministic, not self-reported by the model. `foundAnything = premium !== null || sum_assured !== null || scenarios.length > 0`. `foundEverythingCore = premium !== null && sum_assured !== null && scenarios.length > 0`. If nothing found → `status: "failed"`, `confidence: 0.2`. If everything core found → `status: "ok"`, `confidence: 0.85`. Otherwise → `status: "partial"`, `confidence: 0.6`.

**Extracted data shape** (`BenefitIllustrationExtractedData` in `lib/supabase/types.ts`): `{currency, premium, premium_term_years, sum_assured, scenarios: [{label, rows: [{year, value}]}]}`. Every field nullable. Scenarios are filtered post-parse to drop malformed entries (`.filter((s) => s.rows.length > 0)`, non-finite year/value rows dropped).

**Guaranteed vs illustrated values**: not separate typed fields — captured via the `scenarios` array's free-form `label` (e.g. "Guaranteed" vs "Non-Guaranteed at 4.25% p.a."), extracted exactly as printed in the source document rather than the app imposing its own guaranteed/non-guaranteed taxonomy.

**`extraction_status` values** (5, defined in `0003` migration comment and `ExtractionStatus` TS type): `ok` (real figures from a text layer), `partial` (some found, some not), `no_text_layer` (scanned/image-only PDF), `unsupported_format` (e.g. `.doc`/`.docx` — no parser wired), `failed` (parser error or LLM found nothing / unparseable output).

**UI indicators**: `ExtractionStatusBadge` in `components/benefit-illustration-form.tsx`, a `STATUS_COPY` map rendering color-coded pills (emerald/amber/neutral/red) per status.

**DB fields** (added in `0003`, on `benefit_illustrations`): `extracted_data jsonb`, `extraction_status text`, `extraction_notes text`, `extraction_source text` (`CHAT_MODEL` or `"fallback"`), `extraction_confidence numeric`, `extraction_review_status text default 'unreviewed'`.

**Fallback behavior**: if `getOpenAI()` returns `null` (no API key), `extractBenefitIllustrationFigures` immediately returns `{data: null, status: "failed", notes: "AI unavailable", source: "fallback", confidence: 0}` — no crash, proposal generation still works but without real figures.

**Limitations**: PDF text truncated to 24000 chars — a very long/many-scenario illustration could have later scenarios silently excluded from the prompt input; `.doc`/`.docx` benefit illustrations are never processed (immediate `unsupported_format`, no parser exists for them); scanned/image-only PDFs (common for older or fax-scanned illustrations) always fail extraction since there's no OCR step; single-file only per client (a newer upload doesn't merge with a prior one, it appears to replace based on `created_at` ordering in the query — verify this is the desired behavior if multi-illustration support is ever needed).

**Future improvements**: OCR fallback for scanned PDFs (would need a different, non-text-layer-gated pipeline — careful design needed to preserve the anti-hallucination guarantee, since OCR itself can introduce errors that would then look like "printed" text to the LLM); chunking for long documents instead of truncation; a real `.doc`/`.docx` text extractor.

---

## 8. ICP Memory

Exactly one ICP per FC can have `is_default = true` at a time (enforced in application code, not a DB constraint — `saveIcp`/`setDefaultIcp` both clear the old default before setting a new one, but there's no unique partial index preventing two defaults if the clearing step ever fails between the two writes; not atomic/transactional). `getDefaultIcp()` fetches `is_default = true` ordered by `created_at desc`, limit 1 — so if two rows somehow end up `is_default = true`, the newest wins silently.

**Switching** (built this session): `IcpPanel`'s `browse` mode calls `listIcps()` (all ICPs, newest first) and renders each with a "Use as default" button (hidden for the current default, which shows a gold "Default" pill instead) calling `handleUseAsDefault(icpId)` → `setDefaultIcp(icpId)` → clears old default, sets new, `revalidatePath("/")`, returns to `view` mode.

**Editing**: `edit` mode's form always has "Set as Default ICP" checked by default (`defaultChecked={true}`, fixed this session — was `!defaultIcp` before, which caused a real bug, see §17.2 in the bug list or `docs/PROJECT_STATUS.md` §2 Sprint 4). Editing creates a **new** ICP row via `saveIcp()`, not an update to the existing one — so "editing" your ICP actually grows the `icps` table each time, with the old version's text preserved (browsable but no longer default unless explicitly re-selected).

**Summaries**: `summarizeIcp()` called best-effort (wrapped in try/catch, non-blocking) after every `saveIcp()` — writes `summary`/`summary_source`/`summary_confidence`/`summary_review_status`. Verified this session: switching default ICP correctly triggers the summary to reflect the newly-selected ICP's own text (not stale from the previous default) because `generateProposal()` always re-fetches the current default ICP's summary at generation time, not caching one.

**Storage**: file uploads on the ICP form go to `icp-docs` bucket via `uploadToBucket()`, path stored in `file_urls text[]` on the `icps` row. Currently a single-file array populated by at most one upload per save (form has one `<input type="file">`).

**Bugs fixed this session**: (1) missing UI for `setDefaultIcp`/`listIcps` — see §2; (2) `defaultChecked` orphaning bug — see above. Both verified live via Claude Preview MCP (created a second test ICP, exercised switch flow both directions, confirmed summary correctness, cleaned up test data).

---

## 9. Knowledge Base

**Upload**: `uploadKbDoc()` in `lib/actions/kb.ts` — uploads to `product-kb` bucket, inserts a `product_kb_docs` row, then calls `embedKbDoc()` synchronously (best-effort, wrapped so upload succeeds even if embedding fails).

**Embedding generation**: `embedKbDoc()` — if `concept_summary` is empty, generates one via LLM using **only the filename** (§6.4), then embeds that summary text via `embedText()` (`text-embedding-3-small`). This is a real limitation: the KB "understanding" of a product document is based on its filename, not its actual content — a poorly-named file (e.g. `doc1.pdf`) will produce a low-quality or generic concept summary and therefore a low-quality match.

**Retrieval**: `matchKbProduct(supabase, clientId)` — fetches the client's latest `client_profile`, uses `pain_points` (preferred) or `notes_text` as the query text, embeds any un-embedded KB docs on the fly, computes cosine similarity (`lib/ai/similarity.ts`) against every KB doc's embedding, returns the best match with its confidence score. Used by `generateProposal()` only when no benefit illustration exists for the client; gated at `KB_MATCH_THRESHOLD = 0.78`.

**Background jobs**: none — everything above is synchronous within the triggering request. See `docs/NEXT_STEPS.md` Phase 1 item 3.

**Limitations**: filename-only concept summaries (see above); no re-embedding if a KB doc is replaced/re-uploaded with the same filename but different content; no way to manually edit/correct a bad concept summary from the UI; single embedding per doc (no chunking for large product brochures with multiple distinct product variants in one PDF).

**Future improvements**: extract and embed actual document text (not just filename) once a KB-doc text extractor is wired up (the existing `extractPdfText` could be reused here); allow FC to manually edit `concept_summary`; move embedding to a real background job.

---

## 10. Proposal Engine

**Pipeline** (`generateProposal()`, `lib/ai/tools.ts:377-621`):
1. Fetch default ICP — if none, `{status: "blocked", reason: "Please complete your Ideal Client Profile first"}`.
2. Fetch client — throws if not found (should be unreachable from the UI since the client page already 404s).
3. Fetch latest `client_profile` — if none, `{status: "blocked", reason: "Please add your client's details before generating"}`.
4. Auto-summarize ICP / auto-extract pain points if not already done (lazy, on-demand — not required to have been done ahead of time).
5. Re-fetch ICP and profile after step 4 (to get freshly-written `summary`/`pain_points`).
6. Fetch latest `benefit_illustration` for the client.
7. **Branch**: if illustration exists → `productUsed = illustration.product_name || "Uploaded benefit illustration"`, `productSource = "benefit_illustration_id:{id}"`. If not → call `matchKbProduct()`; if no match or confidence `< 0.78` → `{status: "blocked", ...}`; otherwise → `{status: "needs_illustration", productName, confidence, clientName}` (does NOT generate — pushes the FC to upload a real illustration or improve the KB match first).
8. Build `realFigures` — only if `illustration.extraction_status` is `"ok"` or `"partial"` (never for `no_text_layer`/`unsupported_format`/`failed`, and never if no illustration at all) — verbatim copy of `extracted_data` plus the status.
9. Call GPT with the full Bridge-framework prompt (§6.5), `temperature: 0.7`.
10. Parse response into `ProposalContent` (six `proposal_sections`, `charts.before_after`, `charts.benefit_timeline`, `real_figures`).
11. Insert `proposals` row (`status: "draft"`, `content_json`, `product_used`, `content_source`, `content_confidence`, `content_review_status: "unreviewed"`).
12. Write audit log.

**Inputs**: default ICP summary, client name/age, client pain points (parsed from semicolon-separated string into an array), product name, real figures (or `null`).

**Outputs**: `GenerateProposalResult` — `{status: "blocked", reason}` | `{status: "needs_illustration", productName, confidence, clientName}` | `{status: "ok", proposalId, content}`.

**Storytelling approach / Bridge framework**: six sections forming an emotional arc — `opening_story` (ground in real current situation) → `problem_bridge` (name risks concretely + cost of inaction) → `solution_reveal` (product as the bridge) → `benefit_breakdown` (each benefit tied to a named pain point) → `dream_outcome` (concrete "after" state, contrasted with opening) → `call_to_action` (warm, direct invitation). See §6.5 for the full verbatim prompt and §9 in `docs/ARCHITECTURE_DECISIONS.md` for why this was tightened across two follow-up commits (`7e68c7d`, `2021dd1`) to remove fictional framing devices.

**Cost-of-inaction logic**: embedded in the `problem_bridge` section instructions — "make the cost of doing nothing vivid and real... how it widens the longer they wait... urgency through honest clarity, not pressure." Not a separate calculation/formula, purely a prompt-engineering instruction to the narrative-writing model.

**Pain point mapping**: `benefit_breakdown` is explicitly instructed to "Connect each benefit directly back to a specific pain point named earlier" — again, prompt-level instruction, not a structured pain-point-to-benefit lookup table.

**Real figures integration**: see §6.5 conditional block — cited verbatim only, never recalculated, never invented if absent.

**Chart generation**: `before_after` (2-4 items, `{label, before, after}`, 0-100 scale, generated by the LLM as *illustrative/directional* protection-level visualization, explicitly NOT tied to real policy figures) and `benefit_timeline` (3-5 points, `{year, value}`, 0-100 scale, showing protection value building over the premium term). Both are LLM-generated illustrative narrative aids, not derived from `real_figures` — the prompt explicitly says "These are directional illustrations for the narrative only, not the client's actual policy figures."

**Timeline generation**: same as `benefit_timeline` above — no separate mechanism.

**PDF rendering**: `app/api/proposals/[id]/pdf/route.tsx` → `lib/pdf/proposal-pdf.tsx`, a `@react-pdf/renderer` document with its own independent style system (separate from the Tailwind/CSS-token system used elsewhere — React PDF doesn't support CSS, it uses a StyleSheet API). Color palette: `INK #1c1a17`, `INK_SOFT #6b6560`, `BRAND #202d4a`, `BRAND_DARK #141c30`, `GOLD #a9813f`, `PAPER #faf8f4`. Renders numbered sections, `realFiguresBox` (green success box, only shown if `real_figures` present), `statCard` layout for premium/sum assured, scenario rows, before/after and timeline charts as horizontal bar visualizations, footer with proposal status.

**Non-AI fallback branch** (when `getOpenAI()` is `null`): fully templated section text using the client's actual name/pain points/product (not generic placeholder text) — e.g. `problem_bridge` fallback reads `` `Right now you're carrying real exposure: ${painPoints.join(", ")}. If nothing changes...` `` when pain points exist. `before_after`/`benefit_timeline` fallback uses formulaic generated numbers (`Math.max(10, 30 - i*5)` etc.) rather than LLM output. This ensures the core Generate-a-proposal action never simply fails when the API key is absent.

---

## 11. UI/UX Redesign

**Status**: two distinct passes exist. Pass 1 (committed, part of `a2ed7d1` and earlier) established the original neutral-only styling (`bg-neutral-50`, `text-neutral-900`, emerald accent for default/success states, no custom fonts). Pass 2 (**uncommitted**, in the working tree right now) is a full premium redesign — see `docs/PROJECT_STATUS.md` §4 for the file list and `docs/NEXT_STEPS.md` for what to do about it.

**Color palette (pass 2, uncommitted, defined in `app/globals.css` `@theme` block)**:
- Neutrals: `--color-paper: #faf8f4` (page background), `--color-paper-raised: #ffffff` (card background), `--color-ink: #1c1a17` (primary text), `--color-ink-soft: #6b6560` (secondary text).
- Brand blue scale: `--color-brand-50: #eef1f7`, `-100: #dbe1ee`, `-400: #4c5f8a`, `-600: #2b3b60`, `-700: #202d4a`, `-900: #141c30`.
- Gold accent scale: `--color-gold-100: #f5ecd9`, `-400: #c9a35f`, `-600: #a9813f`.
- Shadows: `--shadow-card: 0 1px 2px rgba(28,26,23,.04), 0 4px 16px -4px rgba(28,26,23,.08)`, `--shadow-card-hover` (deeper, for hover states).
- Body background: `radial-gradient(circle at top, rgba(43,59,96,.04), transparent 55%)`, `background-attachment: fixed`.

**Fonts (pass 2, uncommitted, `app/layout.tsx`)**: `Manrope` (`--font-sans-ui`, via `next/font/google`) for all UI text; `Fraunces` (`--font-serif-display`, italic-capable, `opsz` optical-size axis) for display/heading text — used for the numbered section indices (01-06) in `proposal-view.tsx` and `proposal-pdf.tsx`.

**Component system**: cards use `rounded-2xl border border-neutral-200/70 bg-paper-raised p-6 shadow-[var(--shadow-card)]`; section eyebrow labels use `text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600`; primary buttons use `bg-brand-700 hover:bg-brand-900`; the ICP "Default" state uses `border-brand-100 bg-brand-50/60`; the "Default" pill uses `bg-gold-400/20 text-gold-600`.

**Premium/financial-report styling**: most visible in `proposal-view.tsx` (numbered 01-06 sections with serif italic index numbers, gold-accented `real_figures` box, `statCard`/`statRow` layout for premium and sum assured figures) and mirrored (independently, since React-PDF has its own style system) in `lib/pdf/proposal-pdf.tsx`.

**What's redesigned vs unfinished**: all 13 files in the uncommitted diff got styling updates. `delete-client-button.tsx` was NOT touched (still uses whatever styling it had before — verify consistency once the redesign is reviewed). No dark mode. No responsive/mobile-specific breakpoints beyond whatever Tailwind's defaults provide implicitly.

**Files changed**: see `docs/PROJECT_STATUS.md` §4 for the exact 13-file list with insertion/deletion counts.

**Screenshots**: none were captured of the pass-2 redesign in this session (it was made and left uncommitted without a subsequent live-browser check — this is exactly why `docs/NEXT_STEPS.md` step 3 requires a `preview_screenshot` pass before committing).

---

## 12. Commits (all, oldest first, with purpose/major files/impact)

| Hash | Message | Major files | Impact |
|---|---|---|---|
| `f6446cc` | Initial commit | scaffold | Base Next.js/Supabase/Stripe starter template |
| `dd6f435` | chore: initialize project (bind deploy identity) | git config | Sets commit identity for Vercel author-email verification |
| `db278b7` | docs: add plan pack (PRD, architecture, sprints) + database schema migration | `docs/*`, `0001_init.sql` | Establishes the full product/data plan and initial schema |
| `64cce08` | Sprint 1: DB-backed 4-section intake UI | `app/page.tsx`, `components/*`, `lib/actions/*`, `lib/supabase/*` | Core CRUD for ICP/client/fact-find/illustration/KB, no AI yet |
| `f41dfe1` | chore: trigger deploy after connecting Vercel to GitHub | (empty/trivial) | First confirmed Vercel auto-deploy from GitHub push |
| `11f3937` | Sprint 2: Proposal generation engine (GPT-4o + KB matching) | `lib/ai/tools.ts`, `app/api/*` | First working end-to-end AI proposal generation, v1 functional milestone |
| `a2ed7d1` | Sprint 3: Proposal polish, FC review, and PDF export | `components/proposal-view.tsx`, `lib/pdf/*`, `components/proposal-approve-button.tsx` | Adds review/approve flow and PDF export |
| `07cd105` | Add storage RLS policy migration for demo-mode uploads | `0002_storage_policies.sql` | Fixes storage uploads failing under RLS (buckets had RLS enabled with no policy) |
| `7e68c7d` | Make proposal storytelling emotionally resonant with a real Bridge arc | `lib/ai/tools.ts` (prompt only) | First pass at the six-section emotional-bridge structure |
| `2021dd1` | Ground proposal opening in real life, not storybook narration | `lib/ai/tools.ts` (prompt only) | Fixes fictional-framing drift from the previous commit — added the "never use Picture this/Imagine" rules |
| `534f47a` | Switch chat model to gpt-5.4-mini | `lib/openai/client.ts` | Model swap, one-line change confirming the single-constant design works as intended |
| `9e93698` | Add real benefit-illustration figure extraction with anti-hallucination guardrails | `lib/pdf/extract-text.ts`, `lib/ai/tools.ts`, `0003_*.sql`, `lib/actions/benefit-illustrations.ts`, `components/benefit-illustration-form.tsx` | Adds the entire extraction pipeline described in §7 |
| `00b9725` | Complete Sprint 4: wire up Change Default ICP flow | `components/icp-panel.tsx` | Closes the Sprint 4 gap (browse/switch UI) and fixes the `defaultChecked` bug — **current HEAD** |

---

## 13. Environment Variables

| Variable | Purpose | Location | Required? | Sensitive? |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `.env.local`, Vercel env | Yes | No (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key, used by all client and server Supabase clients | `.env.local`, Vercel env | Yes | No (public, RLS-gated) |
| `SUPABASE_SERVICE_ROLE_KEY` | Documented in `.env.example` for admin/bypass-RLS access | `.env.example` only — **not present in local `.env.local`** | No (not currently used anywhere in the codebase) | Yes, if ever added |
| `OPENAI_API_KEY` | Powers every AI feature via `getOpenAI()` | `.env.local` (confirmed present), Vercel env (confirmed present — AI features work live) | Yes, for AI features (app degrades gracefully without it, see §6) | Yes — **missing from `.env.example`, should be added** |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY`, `NEXT_PUBLIC_STRIPE_PRICE_YEARLY`, `STRIPE_CONNECT_ACCOUNT_ID`, `STRIPE_PLATFORM_FEE_PERCENT` | Stripe billing scaffolding | `.env.example` only | No — dead scaffolding, see §3 | Yes if ever populated |
| `NEXT_PUBLIC_APP_URL` | Used for redirect URLs (Stripe checkout success/cancel) | `.env.local`, `.env.example` | Only if Stripe is wired up | No |
| `VERCEL*`, `NX_DAEMON`, `TURBO_*` | Vercel/build-tooling internals, auto-populated | `.env.local` (pulled via `vercel env pull`) | N/A — not app config | No |

No admin/service-role Supabase credentials exist locally — new migrations require the user to run them manually via the Supabase SQL Editor.

---

## 14. Deployment

**How it works**: `git push` to `main` → Vercel (already connected to the GitHub repo, confirmed by commit `f41dfe1`) auto-deploys. Per `CLAUDE.md`, deploying via `vercel deploy`/`vercel --prod` with local files is forbidden — it desyncs git from the live deployment and the next push would silently overwrite it.

**Verified working**: the app has been live and functional through Sprints 1-4 and the benefit-illustration extraction feature — confirmed via this session's live Preview-MCP testing of the ICP switch flow (though that was tested against the local dev server, not necessarily the deployed Vercel instance — see below).

**What needs verifying** (next session should check):
1. Whether `HEAD` (`00b9725`) has actually been pushed to `origin/main` and deployed — `git status` shows "Your branch is up to date with 'origin/main'", so yes, `00b9725` should be live on Vercel. Confirm by visiting the actual Vercel deployment URL.
2. The pending redesign (§17) has NOT been pushed and therefore is NOT live yet.
3. Whether `OPENAI_API_KEY` and Supabase env vars are current/valid on Vercel (last confirmed working as of this session, but Vercel env can drift from local `.env.local` if changed independently).

---

## 15. Testing

**Typecheck**: `bun run typecheck` (`tsc --noEmit`) — not run against the currently-uncommitted redesign changes.

**Production build**: `bun run build` — not run against the currently-uncommitted redesign changes. **Critical gotcha**: never run this while a Preview/dev server is live — it corrupts `.next`. Correct sequence: stop dev server → `rm -rf .next` → `bun run build` → restart dev server if needed.

**Live browser testing** (this session): used Claude Preview MCP (`preview_start`, `preview_screenshot`, `preview_eval`, `preview_click`, `preview_stop`) to verify the Sprint 4 ICP browse/switch flow end-to-end: created a second ICP ("Test ICP #2") with the default checkbox manually unchecked, verified it appeared in browse mode as non-default, clicked "Use as default" to switch, confirmed the view updated and the AI summary regenerated correctly for the new default, then cleaned up by deleting the test row via a direct Supabase REST `DELETE` call (anon key) and restoring the original ICP as default.

**PDF testing**: not performed this session (no changes to PDF logic were made this session prior to the uncommitted redesign, which does touch `lib/pdf/proposal-pdf.tsx` — needs testing per `docs/NEXT_STEPS.md`).

**Benefit-illustration extraction testing**: not performed this session (feature was completed and tested in the prior, summarized session — not re-verified here).

**Storage testing**: not performed this session beyond the ICP file-upload path implicitly exercised by the ICP test flow above (no file was actually uploaded during the switch-flow test, since "Test ICP #2" was created via text only).

**Regression testing**: not systematically performed this session beyond the specific Sprint 4 flow.

**Known failures**: none currently known, but the uncommitted redesign is entirely unverified — see §17.

**Manual test plan reference**: `docs/TEST_PLAN.md` documents the canonical v1 success scenario and edge cases (gate/empty-state cases, error cases, KB embedding check, default ICP check) — use this as the regression checklist before any future release.

---

## 16. Known Issues

**Bugs**: none currently open and known (the two found this session — missing Switch-default UI, `defaultChecked` orphaning bug — were both fixed and verified in this session).

**Tech debt**:
- KB embedding runs synchronously in the upload request path, not as a true background job (`docs/PROJECT_STATUS.md` §6).
- Stripe integration (`app/api/stripe/*`, `lib/stripe/index.ts`) references a `profiles`/`purchases`/`subscriptions` schema that doesn't exist in any migration — dead code relative to the real data model.
- No unique DB constraint enforcing "exactly one `is_default = true` ICP" — enforced only in application code across two non-atomic writes (§8).
- `extraction_status` and other enum-like text fields have no DB-level `check` constraint — validity enforced only in TypeScript.
- `.env.example` is missing `OPENAI_API_KEY` despite it being a required var.

**UI polish needed**: the premium redesign (§11) is uncommitted and unverified; chart visualizations are simple bar approximations, not a real charting library; no dark mode; `delete-client-button.tsx` was not included in the redesign pass, so may look visually inconsistent with the rest of the app once the redesign ships.

**Performance**: no pagination anywhere (`listClients()`, `listIcps()`, `listKbDocs()` all fetch everything) — fine at current demo scale, will need attention once real FCs accumulate many clients/ICPs/KB docs.

**Security**: RLS is permissive everywhere (`using (true)`) — deliberate for v1, but this means, right now, in production, any anon-key holder can read/write/delete any row in any table and any file in any bucket, since it's not behind auth. This is by design per `CLAUDE.md` but is the single biggest real-world risk in the current deployment if it were ever mistaken for "production ready" — Sprint 5 must land before this app handles real client PII/financial data for real FCs.

**Auth**: does not exist. See `docs/NEXT_STEPS.md` Phase 1 item 2.

---

## 17. Next Task — exact state at context-fill time

**What was being worked on**: the previous session's context filled while writing this exact handoff documentation, per an explicit user request. This was not a code task.

**Files modified in that session and committed**: `components/icp-panel.tsx` (Sprint 4 browse/switch UI + `defaultChecked` fix) — committed as `00b9725`, currently `HEAD`, already pushed (`git status` confirms "up to date with origin/main").

**Files modified but NOT committed** (pre-existing in the working tree, predating the handoff-writing task, untouched by it): the 13-file premium redesign —
```
app/clients/[id]/page.tsx
app/globals.css
app/layout.tsx
app/page.tsx
components/benefit-illustration-form.tsx
components/client-profile-form.tsx
components/generate-proposal-section.tsx
components/icp-panel.tsx
components/kb-panel.tsx
components/new-client-form.tsx
components/proposal-approve-button.tsx
components/proposal-view.tsx
lib/pdf/proposal-pdf.tsx
```
Full description in §11 and `docs/PROJECT_STATUS.md` §4. `git diff --stat`: 324 insertions, 208 deletions, 13 files, 0 added/removed.

**Partial work**: none — the redesign diff is not half-finished code (no syntax errors expected, it's straightforward Tailwind class swaps + two new `@theme` blocks + two new font imports), it is simply unverified and uncommitted.

**Where to resume**: `docs/NEXT_STEPS.md` "Immediate next action" — verify the working tree matches this description, typecheck, build, live-verify via Preview MCP, then commit + push.

**What command to run first**:
```
git status && git diff --stat
```
to confirm the working tree still matches what's described here, then:
```
export PATH="$HOME/.bun/bin:$PATH"
bun run typecheck
```

**What browser page should be open**: none currently (no dev/preview server was running at context-fill time). Start one fresh with `preview_start` after typecheck/build pass, then check: homepage (`/`) for the ICP panel + client list styling, a client detail page (`/clients/{id}`) for the fact-find/illustration/generate-proposal sections, and a generated proposal view for the numbered-section/chart styling — plus the PDF export endpoint specifically since `lib/pdf/proposal-pdf.tsx` uses an independent style system that could have broken silently.

---

## 18. Important Design Decisions

Full rationale for each in `docs/ARCHITECTURE_DECISIONS.md`. Index:
1. Why GPT-5.4-mini, single constant — §1.
2. Why `getOpenAI()` returns `null` instead of throwing — §2.
3. Why anti-hallucination is a structural code gate, not just a prompt — §3.
4. Why `real_figures` is a verbatim-copy field, never regenerated — §4.
5. Why private buckets + RLS instead of public buckets — §5.
6. Why RLS v1 is permissive everywhere (deliberate, not forgotten) — §6.
7. Why demo-first / auth delayed — §7.
8. Why Server Actions are called directly from client components, not only as form actions — §8.
9. Why the Bridge storytelling framework forbids fictional framing — §9.
10. Why KB match threshold is 0.78 — §10.
11. Why signed URLs / no baked-in public URLs — §11.
12. Why one migration file per schema change, never editing `0001` — §12.
13. Why deploy by git push only — §13.

---

## 19. Future Roadmap

Full detail in `docs/NEXT_STEPS.md`. Summary:

**Phase 1 (immediate)**: commit/verify the pending redesign; Sprint 5 auth + RLS lockdown (`user_id` columns, policy rewrite, insert-path updates, signed URLs, demo rows kept visible via `user_id IS NULL`); KB embedding as a true background job.

**Phase 2 (after auth)**: resolve the Stripe scaffolding (wire it for real or delete it); real background-job infrastructure if async work grows; automated test coverage, especially around the anti-hallucination extraction gate and proposal generation gate logic.

**Phase 3 (polish)**: real charting library for `before_after`/`benefit_timeline`; multi-file benefit illustration support; inline editing of generated proposal sections before approval; an audit-log admin UI.

---

## 20. New Session Prompt

Paste this into a new Claude Code session to resume work with full context:

```
Read docs/HANDOFF.md, docs/PROJECT_STATUS.md, docs/ARCHITECTURE_DECISIONS.md, and
docs/NEXT_STEPS.md in full before doing anything else — they are a complete handoff
of the fcprop project (AI proposal builder for Singapore financial consultants),
written by the previous session before its context ran out.

Then run `git status` and `git diff --stat` and compare against what HANDOFF.md §17
and NEXT_STEPS.md describe: as of the handoff, there were 13 uncommitted files (a
premium visual redesign — new color palette, new Google Fonts, restyled proposal
view/PDF/components) sitting in the working tree, on top of HEAD commit `00b9725`
("Complete Sprint 4: wire up Change Default ICP flow"), already pushed to
origin/main. If the working tree matches, follow NEXT_STEPS.md's "Immediate next
action": typecheck, build, live-verify the redesign in a browser via the Preview
MCP tools, then commit and push it. If the working tree does NOT match (commits or
further changes have landed since), read what changed first — don't assume the
docs are current, they're a snapshot.

After that, continue down the roadmap in docs/NEXT_STEPS.md — the next major piece
of unstarted work is Sprint 5 (auth + RLS lockdown, currently 100% permissive RLS
by design per CLAUDE.md).

Follow CLAUDE.md's build rules exactly: deploy by git push only (never `vercel
deploy`), commit + push after each meaningful change, never edit
supabase/migrations/0001_init.sql (add a new migration file instead), and don't
put secrets in frontend code. The git identity for this repo is already configured
(user.email 80609411+meguru888@users.noreply.github.com, user.name meguru888) —
don't change it.
```
