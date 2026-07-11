# Architecture

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (Postgres + Storage + RLS)
- **AI:** OpenAI GPT-4o via server-side API route (never exposed to client)
- **File storage:** Supabase Storage buckets (icp-docs, client-docs, benefit-illustrations, product-kb)
- **PDF rendering:** React-PDF or Puppeteer serverless for proposal export
- **Deploy:** Vercel

## Build Sequence (own feature terms)
**Now:** DB schema → file upload → 4-section intake UI → proposal generation engine → rendered proposal page
**Next:** Default ICP memory → Section 4 KB digestion + product matching → auth + per-FC data isolation
**Later:** Proposal PDF export, version history, analytics dashboard

## Key User Action — Step-by-Step
1. FC opens app (no login required in v1 demo)
2. Fills/uploads ICP (Section 1) → saved to `icps` table + Storage
3. Enters client fact-find text + uploads docs (Section 2) → saved to `client_profiles`
4. Optionally uploads benefit illustration (Section 3) → saved to `benefit_illustrations`
5. (Background) Section 4 KB docs are chunked + embedded for similarity search
6. FC clicks **Generate Proposal** → server validates Sections 1 & 2 complete
7. If Section 3 empty → AI searches Section 4 KB → if match found, prompts FC to upload actual illustration
8. Server calls GPT-4o with all context → returns structured proposal JSON
9. Proposal rendered as branded, visual page; FC can export PDF

## Layer Plan
- **Data layer:** tables + RLS → works without AI
- **App logic:** validation gates, file routing, status transitions
- **Intelligence:** GPT-4o summarization, KB embedding search, proposal narrative generation

## Core Without AI
All 4 sections capture and store data; proposal page shows a structured template populated with raw inputs if AI is unavailable.
