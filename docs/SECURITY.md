# Security

## Secret Handling
- `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` stored in Vercel environment variables only
- Never referenced in client-side code or exposed in API responses
- All AI calls made from Next.js server-side API routes (`/api/...`)

## Permission Model (v1 demo)
- RLS enabled on all tables with permissive read/write policies — demo works without login
- No sensitive real client data should be entered until the lock-down sprint is complete
- Storage buckets: authenticated read only (signed URLs served server-side)

## Lock-Down Sprint (scheduled — not v1)
- Replace permissive RLS policies with `auth.uid() = user_id` owner-scoped policies
- Supabase Auth (email/password or magic link)
- Signed URL generation moves fully server-side with user session check
- Default ICP scoped to `auth.uid()` only

## Approved Tools Rule
- Agent may only call the five named tools in AGENTIC_LAYER.md
- No `eval`, no dynamic function construction, no raw shell access
- Every tool invocation writes an audit log row before returning

## Audit Principle
- Every meaningful action (file upload, proposal generated, KB doc embedded, policy matched) writes to `audit_logs`
- Audit rows are append-only; no update or delete permissions on `audit_logs` table

## Human Stop Points
- If a tool errors on a PDF parse, surface the error to FC — do not silently skip
- Data-loss operations (record delete) require confirmation UI + audit entry; plan says: if uncertain, do not automate
