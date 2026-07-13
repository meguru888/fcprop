import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Reads the authenticated FC's id off the request-scoped Supabase client.
 * Every insert into an owned table (icps, clients, client_profiles,
 * benefit_illustrations, product_kb_docs, proposals, audit_logs) must stamp
 * user_id with this value — RLS's write policy requires user_id = auth.uid(),
 * so an insert with a null/mismatched user_id is silently rejected.
 */
export async function getUserId(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
