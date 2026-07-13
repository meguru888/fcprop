"use client";

import { getAnonId } from "@/lib/analytics/anon-id";
import { logEvent } from "@/lib/actions/analytics";

export function track(eventType: string, section: string, metadata?: Record<string, unknown>): void {
  const anonId = getAnonId();
  if (!anonId) return;
  logEvent(anonId, eventType, section, metadata).catch(() => {
    // Best-effort — never block the UI on analytics failures.
  });
}
