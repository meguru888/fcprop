-- Structured figure extraction for uploaded benefit illustrations.
-- extracted_data holds ONLY figures actually found in the source document's text layer
-- (see lib/ai/tools.ts extractBenefitIllustrationFigures) — never LLM-estimated or invented numbers.
-- extraction_status distinguishes real success from the cases where we deliberately
-- withheld extraction rather than risk fabricating a figure:
--   'ok'                 real figures extracted from a text layer
--   'partial'            some figures extracted, others not found in the document
--   'no_text_layer'      scanned/image-only PDF, no extractable text — nothing invented
--   'unsupported_format' e.g. .doc/.docx, no parser wired up yet
--   'failed'             parser error
alter table benefit_illustrations
  add column if not exists extracted_data jsonb,
  add column if not exists extraction_status text,
  add column if not exists extraction_notes text,
  add column if not exists extraction_source text,
  add column if not exists extraction_confidence numeric,
  add column if not exists extraction_review_status text default 'unreviewed';
