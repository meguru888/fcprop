# Agentic Layer

## Risk Classification

### Low Risk — Auto-executed
- Summarize ICP text + uploaded docs → `icps.summary`
- Extract pain points from client profile → `client_profiles.pain_points`
- Embed new KB doc → `product_kb_docs.embedding`
- Digest KB doc concept → `product_kb_docs.concept_summary`
- Draft proposal JSON → `proposals.content_json` (status = 'draft')

### Medium Risk — FC confirms before finalizing
- Set proposal status to 'ready' after FC reviews draft
- Identify and name matched KB product → FC sees "We matched GreatLife Multiplier III — does this look right?"
- Prompt FC to upload actual benefit illustration when KB match found but Section 3 is empty

### High Risk — FC explicit approval required
- Overwrite an existing 'ready' proposal with a regenerated version
- Delete a KB doc (and its embedding)

### Critical — Human only
- Sending proposal to client (no automated send in v1)
- Deleting client records

## Named Tools (server-side only)
- `summarize_icp(icp_id)` — reads storage, calls GPT-4o, writes summary fields
- `extract_pain_points(client_profile_id)` — reads text + docs, writes pain_points fields
- `embed_kb_doc(product_kb_doc_id)` — chunks PDF, generates embeddings, stores via pgvector
- `match_kb_product(client_profile_id)` — cosine search, returns top match + confidence
- `generate_proposal(client_id)` — orchestrates all context, calls GPT-4o, writes proposals row

## Audit Log Fields
`tool_name | input_ref_id | output_ref_id | triggered_by | status | latency_ms | created_at`

## v1 vs Later
- **v1:** All tools triggered by explicit FC button click
- **Later:** Background KB digestion on upload; webhook-triggered re-ranking when new KB doc added
