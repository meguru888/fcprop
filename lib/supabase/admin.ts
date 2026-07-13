import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely. Never import this into
 * client components or expose its result to the browser; server-only
 * admin code paths (e.g. the locked-down document archive) only.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export const ADMIN_BUCKET = "admin-doc-archive";
