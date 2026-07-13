"use client";

import { useActionState, useEffect, useState } from "react";
import { saveFcProfile, type SaveFcProfileResult } from "@/lib/actions/fc-profile";
import { logout } from "@/lib/actions/auth";
import type { FcProfile } from "@/lib/supabase/types";

const initialState: SaveFcProfileResult = { ok: false };

export function FcProfilePanel({ profile }: { profile: FcProfile | null }) {
  const [mode, setMode] = useState<"view" | "edit">(profile ? "view" : "edit");
  const [state, formAction, pending] = useActionState(saveFcProfile, initialState);

  useEffect(() => {
    if (state.ok) setMode("view");
  }, [state]);

  if (mode === "view" && profile) {
    const titleLines = (profile.title_credentials ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return (
      <section className="rounded-[18px] border border-neutral-200/70 bg-paper-raised p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">Your Profile</p>
            <p className="mt-2 font-serif text-lg text-ink">{profile.name}</p>
            {titleLines.map((line, i) => (
              <p key={i} className="text-sm text-ink-soft">
                {line}
              </p>
            ))}
            <p className="mt-2.5 text-sm italic text-brand-700">Representing {profile.company_name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-ink hover:bg-neutral-50"
            >
              Edit
            </button>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full px-2 py-1.5 text-xs font-medium text-ink-soft hover:text-red-600 hover:underline"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[18px] border border-neutral-200/70 bg-paper-raised p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">Your Profile</p>
        <form action={logout}>
          <button
            type="submit"
            className="shrink-0 rounded-full px-2 py-1.5 text-xs font-medium text-ink-soft hover:text-red-600 hover:underline"
          >
            Log out
          </button>
        </form>
      </div>
      <p className="mt-1.5 text-sm text-ink-soft">
        This appears on every proposal you generate. A one-time setup — you can update your company later if you
        switch firms.
      </p>
      <form action={formAction} className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            name="name"
            defaultValue={profile?.name ?? ""}
            placeholder="Your name"
            className="min-w-[180px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
          <input
            name="company_name"
            defaultValue={profile?.company_name ?? ""}
            placeholder="Your company"
            className="min-w-[180px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="title_credentials">
            Title &amp; credentials <span className="text-neutral-400">(optional — shown exactly as typed)</span>
          </label>
          <textarea
            id="title_credentials"
            name="title_credentials"
            defaultValue={profile?.title_credentials ?? ""}
            placeholder={"Financial Consultant\nChFC, B.A (NTU)"}
            rows={3}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-900 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          {profile && (
            <button
              type="button"
              onClick={() => setMode("view")}
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-ink hover:bg-neutral-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
