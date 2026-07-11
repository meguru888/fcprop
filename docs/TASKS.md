# Sprints & Tasks

## Sprint 1 — DB + File Intake (no login wall)
**Goal:** All 4 sections capture and persist data; demo rows visible on load.
- [ ] Run migration SQL (all tables, RLS v1 policies, seed data)
- [ ] Supabase Storage buckets: icp-docs, client-docs, benefit-illustrations, product-kb
- [ ] Section 1 UI: ICP chat textarea + file upload + "Set as Default ICP" checkbox
- [ ] Section 2 UI: client fact-find textarea + file upload (mandatory gate)
- [ ] Section 3 UI: benefit illustration upload (optional, with clear label)
- [ ] Section 4 UI: KB multi-upload list with filenames
- [ ] All uploads persist to Storage + DB; all text fields save to DB
- [ ] View Default ICP panel (read + edit)
- [ ] Empty/loading/error states on all upload components
**DoD:** Visit app URL (no login) → see demo client + KB docs → upload a test file in each section → confirm row appears in Supabase table.

## Sprint 2 — Proposal Generation Engine ✦ v1 functional milestone
**Goal:** End-to-end: FC fills sections → clicks Generate → proposal appears.
- [ ] `/api/summarize-icp` — GPT-4o summarizes ICP, writes `icps.summary`
- [ ] `/api/extract-pain-points` — GPT-4o extracts pain points from Section 2
- [ ] `/api/embed-kb-doc` — pgvector embedding on KB upload
- [ ] `/api/match-kb-product` — cosine similarity search, returns top match
- [ ] `/api/generate-proposal` — orchestrates all context, generates structured JSON
- [ ] Gate logic: block Generate if Section 1 or 2 empty; show clear error message
- [ ] If Section 3 empty + KB match ≥ 0.78 → show "Upload actual illustration" prompt before generating
- [ ] Proposal page: renders `content_json` as branded, colorful, section-by-section layout
- [ ] Proposal names the product used (from Section 3 or KB match)
- [ ] Loading spinner + error state on generation
**DoD:** Upload demo client info + benefit illustration → Generate → proposal page renders with client name, pain points addressed, product named, all 6 narrative sections visible.

## Sprint 3 — Proposal Presentation Polish
**Goal:** Proposal looks professionally beautiful and emotionally compelling.
- [ ] Branded color palette, typography, section icons
- [ ] Charts/visualizations: coverage gap bar, benefit timeline, dream milestone graphic
- [ ] Story arc layout: Opening Story → Problem Bridge → Solution Reveal → Benefit Breakdown → Dream Outcome → CTA
- [ ] FC review panel: approve draft → status = 'ready'
- [ ] "Regenerate" button with confirmation dialog (medium-risk approval)
- [ ] PDF export (Puppeteer or react-pdf)
**DoD:** Generated proposal screenshot looks like a polished client-facing document; PDF download works.

## Sprint 4 — Default ICP Memory + KB Background Processing
**Goal:** Returning FC experience smooth; KB always digested.
- [ ] On login (pre-auth: session cookie), load default ICP and skip Section 1 prompt
- [ ] "Change Default ICP" flow works and updates `is_default`
- [ ] KB docs auto-embedded on upload (not only on generate click)
- [ ] Concept summary written to `product_kb_docs.concept_summary` on upload
- [ ] Audit log table wired to all tool calls
**DoD:** Set default ICP → refresh page → Section 1 shows "Using your default ICP" with view/change option.

## Sprint 5 — Lock It Down (Auth + Per-FC Isolation)
**Goal:** Real FCs can sign in; data scoped to owner.
- [ ] Supabase Auth: email + magic link
- [ ] Replace permissive RLS policies with `auth.uid() = user_id`
- [ ] All inserts set `user_id = auth.uid()`
- [ ] Signed URL generation server-side only
- [ ] Demo seed rows marked `user_id = null` (remain visible to all)
**DoD:** FC A cannot see FC B's clients or proposals; demo rows still visible to all.

## Text Gantt
```
Sprint 1  |████████| DB + 4-section intake UI
Sprint 2  |████████| Proposal generation engine  ← v1 functional
Sprint 3  |████████| Proposal visual polish + PDF export
Sprint 4  |████████| Default ICP memory + KB auto-embed
Sprint 5  |████████| Auth + per-FC data lock-down
```
