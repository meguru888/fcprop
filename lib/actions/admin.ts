"use server";

import { createAdminClient, ADMIN_BUCKET } from "@/lib/supabase/admin";
import { EVENTS } from "@/lib/analytics/events";

interface UsageEventRow {
  anon_id: string;
  event_type: string;
}

export interface UsageMetrics {
  section1: { icpTextInput: number; icpSwitchClick: number; icpEditClick: number };
  section2: { newClientClick: number; existingClientClick: number };
  section3: { benefitIllustrationUpload: number };
}

export async function getUsageMetrics(): Promise<UsageMetrics> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("usage_events").select("anon_id, event_type");
  if (error) throw new Error(error.message);
  const events = (data ?? []) as UsageEventRow[];

  const uniqueCount = (eventType: string) =>
    new Set(events.filter((e) => e.event_type === eventType).map((e) => e.anon_id)).size;

  return {
    section1: {
      icpTextInput: uniqueCount(EVENTS.ICP_TEXT_INPUT),
      icpSwitchClick: uniqueCount(EVENTS.ICP_SWITCH_CLICK),
      icpEditClick: uniqueCount(EVENTS.ICP_EDIT_CLICK),
    },
    section2: {
      newClientClick: uniqueCount(EVENTS.NEW_CLIENT_CLICK),
      existingClientClick: uniqueCount(EVENTS.EXISTING_CLIENT_CLICK),
    },
    section3: {
      benefitIllustrationUpload: uniqueCount(EVENTS.BENEFIT_ILLUSTRATION_UPLOAD),
    },
  };
}

interface AdminDocumentRow {
  uploader_anon_id: string | null;
  uploader_user_id: string | null;
  doc_type: string | null;
  created_at: string;
}

interface FcIdentity {
  name: string | null;
  companyName: string | null;
}

// Docs uploaded before Sprint 5 auth only have uploader_anon_id (uploader_user_id
// is null); key by user_id when present so those rows tie back to a real FC
// identity, falling back to the anon id for pre-auth history.
async function loadFcIdentities(): Promise<Map<string, FcIdentity>> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("fc_profiles").select("user_id, name, company_name");
  if (error) throw new Error(error.message);
  const map = new Map<string, FcIdentity>();
  for (const row of data ?? []) {
    if (!row.user_id) continue;
    map.set(row.user_id, { name: row.name, companyName: row.company_name });
  }
  return map;
}

export interface FcDocSummary {
  key: string;
  name: string | null;
  companyName: string | null;
  total: number;
  byType: Record<string, number>;
  byDay: Record<string, number>;
}

export interface DocumentMetrics {
  totalDocs: number;
  uniqueUploaders: number;
  perFc: FcDocSummary[];
}

export async function getDocumentMetrics(): Promise<DocumentMetrics> {
  const admin = createAdminClient();
  const [{ data, error }, identities] = await Promise.all([
    admin.from("admin_documents").select("uploader_anon_id, uploader_user_id, doc_type, created_at"),
    loadFcIdentities(),
  ]);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as AdminDocumentRow[];

  const perFcMap = new Map<string, FcDocSummary>();
  for (const row of rows) {
    const key = row.uploader_user_id ?? row.uploader_anon_id ?? "unknown";
    if (!perFcMap.has(key)) {
      const identity = row.uploader_user_id ? identities.get(row.uploader_user_id) : undefined;
      perFcMap.set(key, {
        key,
        name: identity?.name ?? null,
        companyName: identity?.companyName ?? null,
        total: 0,
        byType: {},
        byDay: {},
      });
    }
    const entry = perFcMap.get(key)!;
    entry.total += 1;
    const type = row.doc_type ?? "other";
    entry.byType[type] = (entry.byType[type] ?? 0) + 1;
    const day = row.created_at.slice(0, 10);
    entry.byDay[day] = (entry.byDay[day] ?? 0) + 1;
  }

  return {
    totalDocs: rows.length,
    uniqueUploaders: new Set(rows.map((r) => r.uploader_user_id ?? r.uploader_anon_id).filter(Boolean)).size,
    perFc: Array.from(perFcMap.values()).sort((a, b) => b.total - a.total),
  };
}

export interface AdminDocument {
  id: string;
  original_filename: string | null;
  doc_type: string | null;
  uploader_anon_id: string | null;
  uploader_name: string | null;
  uploader_company: string | null;
  file_size: number | null;
  created_at: string;
  download_url: string | null;
}

export async function listAdminDocuments(): Promise<AdminDocument[]> {
  const admin = createAdminClient();
  const [{ data, error }, identities] = await Promise.all([
    admin
      .from("admin_documents")
      .select(
        "id, original_filename, doc_type, uploader_anon_id, uploader_user_id, file_size, created_at, storage_path",
      )
      .order("created_at", { ascending: false }),
    loadFcIdentities(),
  ]);
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const withUrls = await Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await admin.storage
        .from(ADMIN_BUCKET)
        .createSignedUrl(row.storage_path, 300);
      const identity = row.uploader_user_id ? identities.get(row.uploader_user_id) : undefined;
      return {
        id: row.id,
        original_filename: row.original_filename,
        doc_type: row.doc_type,
        uploader_anon_id: row.uploader_anon_id,
        uploader_name: identity?.name ?? null,
        uploader_company: identity?.companyName ?? null,
        file_size: row.file_size,
        created_at: row.created_at,
        download_url: signed?.signedUrl ?? null,
      };
    }),
  );

  return withUrls;
}
