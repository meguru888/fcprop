# Intelligence Layer

## Messy Inputs
- Scanned PDFs, handwritten fact-find notes, insurer benefit illustration PDFs (varied formats)
- Free-text pain points, dreams, financial goals mixed together
- Section 4 KB docs with illustrative ages/premiums irrelevant to current client

## Auto-Structure Schema (per proposal generation call)
```json
{
  "client_name": "Sarah Tan",
  "client_age": 35,
  "pain_points": ["No critical illness cover", "Income protection gap"],
  "dreams": ["Early retirement at 55", "Kids' university fund"],
  "icp_context": "Young professional, risk-averse",
  "product_matched": "GreatLife Multiplier III",
  "product_source": "benefit_illustration_id:uuid",
  "proposal_sections": {
    "opening_story": "...",
    "problem_bridge": "...",
    "solution_reveal": "...",
    "benefit_breakdown": "...",
    "dream_outcome": "...",
    "call_to_action": "..."
  }
}
```

## Events to Track
- ICP saved / set as default
- Client profile completed
- Benefit illustration uploaded
- KB doc added + embedded
- Proposal generated (with latency)
- FC edits/approves proposal

## Scoring Rules (rule-based v1)
- Completeness score: Sections 1–4 filled = 0–4 points; gate generation at ≥ 2 (Sections 1+2)
- KB match confidence: cosine similarity ≥ 0.78 = recommended match; < 0.78 = no match found

## What Gets Ranked
- KB docs ranked by embedding similarity to client pain points → top-1 selected
- Proposal sections ordered by NLP persuasion arc: story → problem → solution → benefit → dream → CTA

## v1 vs Later
- **v1:** GPT-4o with full-context prompt; pgvector cosine search
- **Later:** Fine-tuned embeddings per FC's KB; multi-product comparison; proposal scoring feedback loop
