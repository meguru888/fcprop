# Test Plan

## v1 Success Scenario (manual)
1. Open app URL — confirm demo client "Sarah Tan" and demo KB docs are visible without login
2. Section 1: type ICP description → upload a PDF → check "Set as Default ICP" → save → confirm `icps` row in Supabase with `is_default=true`
3. Section 2: enter client fact-find notes + upload a doc → confirm `client_profiles` row saved
4. Section 3: upload a benefit illustration PDF → confirm `benefit_illustrations` row saved with `product_name`
5. Click **Generate Proposal** → loading spinner appears → proposal page renders within 3 minutes
6. Confirm proposal contains: client name, at least 2 pain points addressed, product name cited, all 6 narrative sections present, at least 1 chart/visualization
7. Click **Export PDF** → PDF downloads and renders correctly

## Gate / Empty Cases
- Skip Section 1 → click Generate → error banner: "Please complete your Ideal Client Profile first"
- Skip Section 2 → click Generate → error banner: "Please add your client's details before generating"
- Section 3 empty, KB match found → prompt: "We found a suitable product. Please upload the actual benefit illustration for [Client Name] before we generate the proposal" → Generate button disabled until upload done
- Section 3 empty, no KB match → prompt: "No matching product found in your knowledge base. Please upload a benefit illustration in Section 3 or add product documents to Section 4"

## Error Cases
- Upload a non-PDF file to Section 3 → show: "Please upload a PDF or Word document"
- AI API timeout → show: "Proposal generation timed out. Please try again." — no partial data written
- Empty KB + Section 3 empty → Generate blocked with clear message

## KB Embedding Check
- Upload a KB doc → check `product_kb_docs` row has non-null `embedding` and `concept_summary`
- Run `/api/match-kb-product` with demo client → confirm returned `product_kb_doc_id` and `confidence` ≥ 0 in response JSON

## Default ICP
- Set default ICP → refresh page → Section 1 shows "Using default ICP" banner with "View" and "Change" buttons
- Click "Change" → edit form opens → save → new ICP saved, old `is_default` set to false
