"use server";

import { createClient } from "@/lib/supabase/server";

export async function logEvent(
  anonId: string,
  eventType: string,
  section: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!anonId) return;
  const supabase = await createClient();
  await supabase.from("usage_events").insert({
    anon_id: anonId,
    event_type: eventType,
    section,
    metadata: metadata ?? {},
  });
}
