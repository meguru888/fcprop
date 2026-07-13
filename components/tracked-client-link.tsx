"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics/track";
import { EVENTS, SECTIONS } from "@/lib/analytics/events";

export function TrackedClientLink({
  clientId,
  className,
  children,
}: {
  clientId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/clients/${clientId}`}
      className={className}
      onClick={() => track(EVENTS.EXISTING_CLIENT_CLICK, SECTIONS.SECTION_2, { client_id: clientId })}
    >
      {children}
    </Link>
  );
}
