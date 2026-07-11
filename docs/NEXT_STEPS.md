# NEXT_STEPS.md — fcprop

## Immediate next action (do this first, before anything else)

There are **13 uncommitted, unpushed files** in the working tree right now (a premium visual redesign — new color palette, new fonts, restyled proposal view/PDF/components). Full list and description in `docs/PROJECT_STATUS.md` §4. Before writing any new code:

1. Run `git status` and `git diff --stat` to confirm the working tree matches what's described in `docs/PROJECT_STATUS.md` §4. If it doesn't match, something changed since this handoff was written — investigate before proceeding, don't assume the docs are current.
2. Run typecheck and build against the uncommitted changes (neither was run against them in the session that made them):
   ```
   export PATH="$HOME/.bun/bin:$PATH"
   bun run typecheck
   bun run build
   ```
   Fix any errors surfaced. Remember: never run `bun run build` while a `preview`/dev server is live — it can corrupt `.next`. Sequence: stop any running dev server → `rm -rf .next` → `bun run build` → restart dev server if needed.
3. Live-verify the redesign in a browser (Claude Preview MCP: `preview_start` → `preview_screenshot` of the homepage, an ICP browse/switch, a client detail page, and a generated proposal page → `preview_stop`). Confirm nothing visually broke (font loading, color contrast, the numbered-section proposal layout, the PDF export still renders — PDF export uses a separate style system in `lib/pdf/proposal-pdf.tsx` that was also touched, so check `/api/proposals/[id]/pdf` specifically).
4. If everything checks out, commit and push:
   ```
   git add -A
   git commit -m "..."   # describe the redesign
   git push
   ```
   This triggers the Vercel auto-deploy. Confirm the live Vercel URL reflects the change afterward.

**Do not skip step 3.** This redesign touched `app/globals.css` (new `@theme` tokens), `app/layout.tsx` (two new Google Fonts), and 11 component/page files — a token name typo or a Tailwind v4 `@theme` syntax issue would not necessarily be caught by typecheck/build and would only show up visually.

## What was being worked on at context-fill time

The task in progress when the previous session ran out of context was **not** a code task — it was writing this handoff documentation itself, per an explicit user request. Sprint 4 (Change Default ICP flow) was already complete and committed (`00b9725`) before that request came in. The uncommitted redesign in the working tree predates the handoff request and was not touched during it.

So: there is no half-finished *logic* to resume. The only unfinished thread is committing/verifying the redesign described above.

## Phase 1 — Immediate (next session priorities, roughly in order)

1. **Commit and verify the pending redesign** (see above) — this is blocking; it's uncommitted work sitting in a shared dev machine's working tree, which is fragile (could be lost).
2. **Sprint 5 — Lock It Down (Auth)**. This is the last unstarted sprint in `docs/TASKS.md`:
   - Add Supabase Auth (email + magic link).
   - Replace every permissive RLS policy (`using (true)`) across all 7 tables and the storage bucket policy with `auth.uid() = user_id`-scoped policies. This requires adding a `user_id` column to every table first (new migration file, e.g. `0004_auth_lockdown.sql` — never edit `0001`).
   - Update every insert path in `lib/actions/*.ts` to set `user_id = auth.uid()`.
   - Move signed-URL generation fully server-side if not already (check `lib/supabase/storage.ts`).
   - Keep demo seed rows visible to all by setting their `user_id = null` and adding an `OR user_id IS NULL` clause to select policies — per `docs/TASKS.md` Sprint 5 DoD: "FC A cannot see FC B's clients or proposals; demo rows still visible to all."
   - This is the biggest remaining architectural change in the roadmap — budget real time for it, and read `docs/SECURITY.md` in full before starting.
3. **Fix KB embedding to be a true background job**, not synchronous-in-request (`docs/PROJECT_STATUS.md` §6 Known Issues). Low priority relative to auth, but worth doing before real users upload large KB docs.

## Phase 2 — After auth lands

1. **Remove or properly wire the Stripe scaffolding** (`app/api/stripe/*`). It currently references a `profiles`/`purchases`/`subscriptions` schema that doesn't exist in any migration. Either build that schema and wire real billing, or delete the dead scaffolding — leaving it as-is is misleading to whoever reads the codebase next.
2. **Decide and implement a real background-job strategy** if more async work accumulates (KB embedding, and potentially benefit-illustration extraction for very large PDFs) — e.g. a queue, a cron-triggered API route, or Vercel's background functions. Not urgent at current scale (single-digit demo clients) but will matter once real FCs are using this.
3. **Expand test coverage** — there is currently no automated test suite (`docs/TEST_PLAN.md` describes manual test scenarios only). Consider adding at least integration tests around the anti-hallucination extraction gate (§3 in `docs/ARCHITECTURE_DECISIONS.md`) and the proposal generation gate logic, since these are the highest-consequence code paths (real client-facing financial documents).

## Phase 3 — Polish / future roadmap

1. Chart/visualization polish in `proposal-view.tsx` and `lib/pdf/proposal-pdf.tsx` — currently bar-based approximations, not a real charting library.
2. Multi-file support for benefit illustrations (currently single-file per client).
3. Editable proposal sections before approval (currently generate → approve/regenerate only, no inline editing of AI-generated text).
4. Audit log UI (the `audit_logs` table is written to on every AI call but has no admin-facing view yet).

## What to verify is still true before trusting this document
- Confirm current `HEAD` commit matches `00b9725` via `git log -1`. If not, commits have landed since this was written — read them before proceeding.
- Confirm the 13-file uncommitted diff described above still exists via `git status`/`git diff --stat`. If it's gone (committed or discarded), Phase 1 step 1 is already done — skip to Sprint 5.
- Confirm `supabase/migrations/0003_benefit_illustration_extraction.sql` is the newest migration file (`ls supabase/migrations/`). If a `0004_*` exists, Sprint 5 or other work may already be underway.
