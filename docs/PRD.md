# fcprop — Product Requirements

## Problem
Financial consultants (FCs) in Singapore spend significant time manually crafting personalized proposals for prospects. Assembling client context, product benefit illustrations, and a compelling narrative is slow, inconsistent, and rarely emotionally resonant.

## Target User
Independent or firm-based financial consultants in Singapore who generate benefit-illustration-backed proposals for clients.

## Core Objects
- **ICP** (Ideal Client Profile) — FC's default client persona; one per FC
- **Client** — individual prospect record
- **ClientProfile** — fact-find uploads + free-text notes for a specific client
- **BenefitIllustration** — uploaded PDF/doc attached to a specific client (Section 3)
- **ProductKnowledgeBase** — library of product PDFs/docs for AI training (Section 4)
- **Proposal** — generated output document for a client

## MVP Must-Haves (v1)
- [ ] Section 1: ICP chat + upload, "Set as Default ICP" checkbox, view/edit default ICP
- [ ] Section 2: Client fact-find — free-text + document upload (mandatory)
- [ ] Section 3: Benefit illustration upload per client (optional; AI uses Section 4 if absent)
- [ ] Section 4: Product knowledge base — multi-upload, persistent, AI-digested
- [ ] Proposal generation: AI assembles narrative proposal (NLP/story-driven, visualizations, color)
- [ ] Gating: block proposal generation if Sections 1 or 2 are incomplete
- [ ] If Section 3 empty + Section 4 match found → prompt FC to upload actual illustration before generating
- [ ] Proposal names the specific product/illustration used
- [ ] Demo-viewable without login

## Non-Goals (v1)
- Multi-FC team accounts / firm admin
- CRM pipeline, scheduling, e-signature
- Direct insurer API integration
- Mobile-native app

## Success Criterion
FC uploads client info + benefit illustration → clicks Generate → receives a visually rich, story-driven, personalized proposal PDF/page within 3 minutes.
