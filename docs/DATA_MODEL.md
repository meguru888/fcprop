# Data Model

## icps
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | owner FC (null = demo) |
| is_default | boolean | FC's pinned ICP |
| chat_text | text | free-text ICP description |
| file_urls | text[] | Storage paths |
| summary | text | AI-generated |
| summary_source | text | 'gpt-4o' |
| summary_confidence | numeric | 0–1 |
| summary_review_status | text | 'unreviewed'/'approved' |
| created_at | timestamptz | |

## clients
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| name | text | |
| age | integer | |
| email | text | |
| created_at | timestamptz | |

## client_profiles
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| client_id | uuid → clients | |
| notes_text | text | fact-find free text |
| file_urls | text[] | uploaded docs |
| pain_points | text | AI-extracted |
| pain_points_source | text | |
| pain_points_confidence | numeric | |
| pain_points_review_status | text | default 'unreviewed' |
| created_at | timestamptz | |

## benefit_illustrations
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| client_id | uuid → clients | |
| file_url | text | |
| product_name | text | FC-entered or AI-detected |
| created_at | timestamptz | |

## product_kb_docs
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| file_url | text | |
| original_filename | text | |
| concept_summary | text | AI-digested concept |
| concept_summary_source | text | |
| concept_summary_confidence | numeric | |
| concept_summary_review_status | text | default 'unreviewed' |
| embedding | vector(1536) | pgvector for similarity search |
| created_at | timestamptz | |

## proposals
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| client_id | uuid → clients | |
| status | text | 'draft'/'ready'/'exported' |
| content_json | jsonb | structured proposal sections |
| product_used | text | named product from BI or KB |
| content_source | text | 'gpt-4o' |
| content_confidence | numeric | |
| content_review_status | text | default 'unreviewed' |
| created_at | timestamptz | |

## RLS
All tables: `enable row level security` + permissive v1 read/write policies (see migration SQL). Lock-down sprint replaces with `auth.uid() = user_id`.
