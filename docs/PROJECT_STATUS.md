# PROJECT_STATUS.md — fcprop

Last updated: 2026-07-11 (end of session that produced commit `00b9725`, plus one uncommitted working-tree change — see "Uncommitted Work" below).

## 1. What this app is

fcprop is an AI-powered proposal builder for Singapore financial consultants (FCs). An FC records their Ideal Client Profile (ICP) once, adds a client with fact-find notes, optionally uploads a real benefit-illustration PDF (or lets the app match a product from an uploaded Knowledge Base), and generates a personalized, story-driven proposal document that can be reviewed, approved, and exported to PDF.

Full spec lives in `docs/PRD.md`. Data model in `docs/DATA_MODEL.md`. Build sequence in `docs/TASKS.md`.

## 2. Sprint-by-sprint status

### Sprint 1 — DB + File Intake — **DONE**
Commit: `64cce08` (`Sprint 1: DB-backed 4-section intake UI`), schema in `db278b7`.

- All 7 tables created and seeded (`0001_init.sql`).
- 4 storage buckets created (`icp-docs`, `client-docs`, `benefit-illustrations`, `product-kb`), permissive v1 RLS applied in `0002_storage_policies.sql`.
- Section 1 (ICP), Section 2 (client fact-find), Section 3 (benefit illustration), Section 4 (KB) all persist to DB/Storage via Server Actions in `lib/actions/`.
- DoD met: visiting the app with no login shows seeded demo client + KB docs; uploads in each section create rows.

### Sprint 2 — Proposal Generation Engine — **DONE**
Commit: `11f3937` (`Sprint 2: Proposal generation engine (GPT-4o + KB matching)`). Model later switched to GPT-5.4-mini in `534f47a`.

- `lib/ai/tools.ts` implements the full pipeline: `summarizeIcp`, `extractPainPoints`, `embedKbDoc`, `matchKbProduct`, `generateProposal`.
- `/api/generate-proposal` and sibling routes in `app/api/` wrap these as thin HTTP handlers (not used by the UI directly — the UI calls the `lib/actions/proposals.ts` Server Action, which calls `lib/ai/tools.ts` directly; the API routes exist as a secondary/testable surface).
- Gate logic implemented: blocks if no default ICP or no client fact-find; if no benefit illustration and KB match confidence < 0.78, returns `needs_illustration` state prompting an upload instead of generating.
- Proposal page renders `content_json` section by section.
- DoD met live: seed client "Sarah Tan" has a full generated proposal with all 6 sections, product named, pain points addressed.

### Sprint 3 — Proposal Presentation Polish — **DONE**, plus a **second, larger, uncommitted visual pass**
Commit: `a2ed7d1` (`Sprint 3: Proposal polish, FC review, and PDF export`).

- Branded layout, FC review panel (`proposal-approve-button.tsx`, sets `status: "ready"`), two-step "Regenerate" confirmation, PDF export via `@react-pdf/renderer` (`lib/pdf/proposal-pdf.tsx`, served from `app/api/proposals/[id]/pdf/route.tsx`).
- Two follow-up storytelling passes landed after the sprint commit: `7e68c7d` ("Make proposal storytelling emotionally resonant with a real Bridge arc") and `2021dd1` ("Ground proposal opening in real life, not storybook narration") — these are prompt-only changes to `lib/ai/tools.ts`, not visual changes.
- **Not yet committed**: a full premium visual redesign is sitting in the working tree right now (see "Uncommitted Work" section below) — new color palette, new fonts, restyled `proposal-view.tsx` and `proposal-pdf.tsx`, and matching restyles across nearly every component. This is further along than what's in git.

### Sprint 4 — Default ICP Memory + KB Background Processing — **DONE**
Commit: `00b9725` (`Complete Sprint 4: wire up Change Default ICP flow`) — this is the current `HEAD`.

- Default ICP auto-loads on page load (`getDefaultIcp()` called in `app/page.tsx`, passed to `IcpPanel`).
- **Gap found and fixed this session**: `setDefaultIcp()`/`listIcps()` Server Actions already existed in `lib/actions/icp.ts` but had zero UI call sites. Added a `"browse"` mode to `components/icp-panel.tsx` with a "Switch" button, a list of saved ICPs, and a "Use as default" action per non-default row.
- **Bug found and fixed this session**: the ICP edit form used `defaultChecked={!defaultIcp}` on the "Set as Default ICP" checkbox. Editing an existing default ICP without manually re-checking the box would silently save the edit as a new, non-default row — orphaning the visible default with stale text. Fixed to `defaultChecked={true}` unconditionally, since in practice an FC editing their ICP almost always wants the edited version to remain the default.
- KB docs auto-embed on upload: `lib/actions/kb.ts` → `uploadKbDoc()` calls `embedKbDoc()` synchronously (best-effort, not fire-and-forget background job — see Known Issues).
- `concept_summary` written on upload (part of `embedKbDoc`).
- Audit log (`lib/ai/audit.ts` → `writeAuditLog()`) wired into all 6 AI tool call sites: `summarizeIcp`, `extractPainPoints`, `embedKbDoc`, `matchKbProduct`, `generateProposal`, and the benefit-illustration extraction path in `lib/actions/benefit-illustrations.ts`.
- Live-tested: created a second ICP ("Test ICP #2"), unchecked its default box, switched default back and forth via the new "Use as default" button, confirmed AI summary regenerated on switch, then cleaned up test data via direct Supabase REST calls (deleted the test row, restored original default).
- DoD met: set default ICP → refresh → Section 1 shows "Using your default ICP" with working view/switch/edit.

### Sprint 5 — Lock It Down (Auth) — **NOT STARTED**
No auth work has begun. All RLS policies are still the permissive v1 policies from `0001_init.sql`/`0002_storage_policies.sql` (`using (true) with check (true)`). This is intentional per `CLAUDE.md` build rule #6 ("Demo-first — no login wall in v1") but is the single biggest piece of unfinished roadmap work — see `docs/NEXT_STEPS.md`.

## 3. Feature not in TASKS.md: Benefit-Illustration Figure Extraction — **DONE**
Commit: `9e93698` (`Add real benefit-illustration figure extraction with anti-hallucination guardrails`). Migration: `0003_benefit_illustration_extraction.sql` (confirmed applied live by user — "Success. No rows returned" in Supabase SQL Editor).

This was not in the original 5-sprint plan; it was added because Sprint 2's benefit-illustration handling only stored the raw uploaded file without extracting any numbers from it, so proposals could not cite real premium/coverage figures — they either used vague KB-matched language or nothing. See `docs/ARCHITECTURE_DECISIONS.md` for the full anti-hallucination design rationale and `docs/HANDOFF.md` section 7 for the complete pipeline documentation.

## 4. Uncommitted Work — READ THIS BEFORE DOING ANYTHING ELSE

As of this document's timestamp, `git status` shows 13 modified, unstaged, uncommitted files:

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

This is a **premium visual redesign** applied across nearly the entire UI:
- `app/globals.css` gained a full `@theme` block: new `paper`/`paper-raised`/`ink`/`ink-soft` neutral tokens, a `brand` blue scale (`50/100/400/600/700/900`), a `gold` accent scale (`100/400/600`), two shadow tokens (`--shadow-card`, `--shadow-card-hover`), and a subtle radial-gradient body background.
- `app/layout.tsx` now loads two Google Fonts via `next/font/google`: `Manrope` (`--font-sans-ui`) for UI text and `Fraunces` (`--font-serif-display`, italic-capable, `opsz` axis) for display/heading text — replacing the previous default sans-only look.
- Every listed component/page was restyled to use the new tokens (e.g. `icp-panel.tsx` default-ICP card went from a plain emerald box to a `brand-50`/`shadow-card` card with gold "Default" pills; `proposal-view.tsx` and `lib/pdf/proposal-pdf.tsx` both got numbered-section (01–06) serif-italic headers and richer chart/stat-card styling).
- No new logic changed in this pass — it is purely visual/styling. `git diff --stat` confirms: 324 insertions, 208 deletions, no files added or removed.

**This has NOT been committed, NOT been pushed, and therefore NOT deployed to Vercel.** It has also not been re-verified live in a browser since these edits were made (the last live verification in this session was of the Sprint 4 ICP-switching logic, using the pre-redesign styling). See `docs/NEXT_STEPS.md` for exactly what to do next.

## 5. Testing performed this session
- Live browser verification (Claude Preview MCP) of the Sprint 4 ICP browse/switch flow: create second ICP → uncheck default → switch default via new UI → confirm AI summary regenerates → clean up via Supabase REST DELETE.
- No `bun run build` or `bun run typecheck` was run against the currently-uncommitted redesign changes in this session — this must be done before committing.

## 6. Known issues (see `docs/HANDOFF.md` §16 for the full list)
- KB embedding on upload (`embedKbDoc` inside `uploadKbDoc()`) runs synchronously in the request path, not as a background job — an FC uploading a large KB doc will wait for the embedding call before the upload "completes" in the UI. `docs/TASKS.md` describes this as "KB docs auto-embedded on upload (not only on generate click)", which is technically satisfied, but it is not truly a background job.
- Stripe integration (`app/api/stripe/*`) is scaffolded against a `profiles`/`purchases`/`subscriptions` schema that does not exist in any applied migration. It is unused dead code relative to the actual fcprop data model — do not assume it works.
- No auth — Sprint 5 not started, see above.
- The redesign described in §4 is uncommitted and unverified.
