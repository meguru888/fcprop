# ARCHITECTURE_DECISIONS.md — fcprop

Why the codebase is shaped the way it is. Each decision below was made deliberately; don't "fix" these without understanding the reasoning first.

## 1. GPT-5.4-mini as the single model for everything (chat + JSON generation)
`lib/openai/client.ts` defines one `CHAT_MODEL` constant used for ICP summarization, pain-point extraction, KB concept summaries, benefit-illustration figure extraction, and full proposal generation. Originally `gpt-4o` (Sprint 2 commit `11f3937`), switched in commit `534f47a` ("Switch chat model to gpt-5.4-mini"). Single-constant design means a future model swap is a one-line change — this was intentional, not an oversight, so do not hardcode model names anywhere else in the codebase.

## 2. `getOpenAI()` returns `null`, not throws, when `OPENAI_API_KEY` is unset
Every AI function in `lib/ai/tools.ts` checks `getOpenAI()` for `null` and falls back to a deterministic templated/truncated result instead of crashing. This exists so the core CRUD flow (Sprint 1's "database-first" requirement per `CLAUDE.md`) keeps working even if the API key is missing or OpenAI is down — a proposal can still be generated (with generic template text) rather than the whole feature being unusable. Do not change these fallback branches to throw; that would violate the "every button must work" rule in `CLAUDE.md`.

## 3. Anti-hallucination extraction is gated at the text-layer, not just the prompt
`lib/pdf/extract-text.ts` → `extractPdfText()` checks for a real text layer (`MIN_MEANINGFUL_CHARS = 40`) *before* any LLM call happens. If the PDF is scanned/image-only or fails to parse, `extractBenefitIllustrationFigures()` in `lib/ai/tools.ts` is **never invoked** — the extraction is short-circuited to `status: "no_text_layer"` or `"failed"` with zero LLM involvement.

**Why this matters**: a prompt saying "don't hallucinate" is not a hard guarantee — models can still fabricate numbers from a garbled OCR-less extraction. Gating at the code level (no text → no LLM call, period) is a structural guarantee, not a prompt-level hope. This is the single most safety-critical design decision in the codebase, because fabricated premium/coverage figures in a real client-facing financial proposal would be a serious real-world harm, not just a UX bug. Any future change to the extraction pipeline must preserve this gate.

The LLM call itself (when it does run) additionally uses `temperature: 0`, `response_format: { type: "json_object" }`, and a system prompt with explicit hard rules: never calculate/estimate/infer/round; always include `null` for absent fields rather than guessing; extract scenario labels and currency exactly as printed. Confidence scoring (`0.85`/`0.6`/`0.2`) reflects how much of the expected schema was actually found, not model confidence — it's a deterministic function of `foundAnything`/`foundEverythingCore`, not something the LLM self-reports (self-reported confidence from an LLM is not trustworthy).

## 4. `real_figures` is a verbatim copy field, documented as never LLM-generated at proposal time
When `generateProposal()` builds the final proposal, `real_figures` on `ProposalContent` is populated directly from `illustration.extracted_data` (already-extracted, already-anti-hallucination-checked data) — never regenerated or paraphrased by the proposal-writing LLM call. The type definition in `lib/supabase/types.ts` carries an explicit code comment stating this. The proposal-generation prompt itself is instructed to cite `real_figures` verbatim if present, or to avoid stating specific dollar figures at all if absent — it is never allowed to invent a number to fill the gap.

## 5. Storage buckets are private, accessed via the anon key + permissive RLS, not `public: true`
All 4 buckets (`icp-docs`, `client-docs`, `benefit-illustrations`, `product-kb`) use RLS-gated access (`0002_storage_policies.sql`, one permissive `for all using (true)` policy per the v1 demo phase) rather than being marked public buckets. This was chosen even though v1 has no auth, specifically so that flipping to real per-user isolation in Sprint 5 is a *policy change* (`using (true)` → `using (auth.uid() = user_id)`), not an architecture change (never having to migrate from public bucket URLs to signed URLs later, which would break every existing stored URL reference).

## 6. RLS v1 is permissive (`using (true)`) everywhere, on both tables and storage — by design, not an accident
Every table and bucket has a working RLS policy that allows all access. This is **not** "RLS forgotten" — `docs/SECURITY.md` documents this as the deliberate v1 posture, matching `CLAUDE.md` build rule #6 ("Demo-first — no login wall in v1... Login/signup + per-user lockdown is a LATER 'Lock it down' sprint"). RLS is *enabled* (not disabled) on every table specifically so that Sprint 5 only needs to replace policy bodies, not add RLS from scratch retroactively (which is riskier and easier to get wrong under time pressure). Do not "tighten" RLS piecemeal outside of a dedicated Sprint 5 effort — a half-locked-down app with inconsistent policies across tables is worse than a fully-open demo app.

## 7. Demo-first, no auth wall, seeded rows visible to everyone
Per `CLAUDE.md`: the homepage IS the working app, reachable without login, seeded with 3 demo clients + KB docs + a completed example proposal. This exists so the app is immediately screenshot-able/demoable to stakeholders without needing to create an account first. When Sprint 5 lands, `docs/TASKS.md` specifies demo seed rows should get `user_id = null` and remain visible to all — i.e. auth should ADD isolation for real user data, not remove the always-visible demo.

## 8. Server Actions callable both as form actions and as direct client-invoked functions
Functions in `lib/actions/*.ts` are marked `"use server"` but are not exclusively `useActionState` form targets — e.g. `listIcps()` and `setDefaultIcp()` in `lib/actions/icp.ts` are called directly from `components/icp-panel.tsx` as plain async functions from `onClick` handlers. This is why Sprint 4's "Change Default ICP" gap was a pure UI wiring gap, not a backend gap — the backend functions already existed and worked; they just had no caller. When auditing for missing features, check for unwired existing Server Actions before assuming backend work is needed.

## 9. Bridge storytelling framework — second person, no fictional framing
The proposal-generation system prompt (in `generateProposal()`, `lib/ai/tools.ts`) explicitly forbids storybook devices ("Picture this...", "Imagine...", invented scene details) and requires second-person voice grounded only in the real fact-find data actually on file. This was tightened across two follow-up commits after Sprint 3 (`7e68c7d`, `2021dd1`) — the first pass toward emotional resonance apparently drifted toward fictionalized narration, and the fix was to constrain it back to only real, on-file facts while keeping the emotional arc (opening_story → problem_bridge → solution_reveal → benefit_breakdown → dream_outcome → call_to_action). The underlying principle is the same anti-hallucination stance as figure extraction, applied to narrative prose instead of numbers: emotionally resonant is fine, invented is not.

## 10. KB matching threshold of 0.78 cosine similarity
`KB_MATCH_THRESHOLD = 0.78` in `lib/ai/tools.ts` gates whether a KB-matched product is considered confident enough to auto-select for a proposal. Below this threshold, `generateProposal()` returns `needs_illustration` instead of guessing at a product — pushing the FC to either upload a real benefit illustration or pick a better-matching KB doc, rather than the AI silently proposing a possibly-wrong product for a real client. This is the same "don't guess, ask" philosophy as the other anti-hallucination decisions, applied to product selection.

## 11. Signed URLs / no public bucket URLs baked into stored rows
Because buckets are private (see #5), any file reference persisted to the DB is a storage *path*, not a public URL — URLs are generated on demand server-side. This keeps the door open for real per-user access control in Sprint 5 without a data migration.

## 12. Single migration file per schema change, never editing `0001_init.sql`
Per `CLAUDE.md`: "To change the schema, add a NEW migration file... never edit `0001`." This is why extraction fields landed in `0003_benefit_illustration_extraction.sql` rather than being added to the original table definition — the migration history is the audit trail of how the schema evolved, and `0001` must remain a faithful record of what Sprint 1 actually shipped.

## 13. Deploy by git push only, never `vercel deploy`/`vercel --prod` with local files
Per `CLAUDE.md`: this avoids desyncing the Vercel deployment from the git history, which would cause the next push to silently overwrite whatever was manually deployed. This is why the very next action after any code change should be a commit + push, not a manual deploy command — see `docs/NEXT_STEPS.md`.
