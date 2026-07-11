"use client";

import { useActionState, useEffect, useState } from "react";
import { listIcps, setDefaultIcp, saveIcp, type SaveIcpResult } from "@/lib/actions/icp";
import type { Icp } from "@/lib/supabase/types";

const initialState: SaveIcpResult = { ok: false };

export function IcpPanel({ defaultIcp }: { defaultIcp: Icp | null }) {
  const [mode, setMode] = useState<"view" | "edit" | "browse">(defaultIcp ? "view" : "edit");
  const [state, formAction, pending] = useActionState(saveIcp, initialState);
  const [savedIcps, setSavedIcps] = useState<Icp[] | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok) setMode("view");
  }, [state]);

  useEffect(() => {
    if (mode === "browse") {
      listIcps().then(setSavedIcps);
    }
  }, [mode]);

  async function handleUseAsDefault(icpId: string) {
    setSwitching(icpId);
    try {
      await setDefaultIcp(icpId);
      setMode("view");
    } finally {
      setSwitching(null);
    }
  }

  if (mode === "browse") {
    return (
      <section className="rounded-2xl border border-neutral-200/70 bg-paper-raised p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Section 1 · Saved Ideal Client Profiles
          </p>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-ink hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {savedIcps === null && <p className="text-sm text-neutral-400">Loading…</p>}
          {savedIcps?.length === 0 && (
            <p className="text-sm text-neutral-400">No saved ICPs yet.</p>
          )}
          {savedIcps?.map((icp) => (
            <div
              key={icp.id}
              className={`rounded-lg border p-3.5 ${
                icp.is_default ? "border-gold-400/50 bg-gold-100/50" : "border-neutral-100 bg-neutral-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ink/80 line-clamp-2">{icp.chat_text}</p>
                {icp.is_default ? (
                  <span className="shrink-0 rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-600">
                    Default
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUseAsDefault(icp.id)}
                    disabled={switching === icp.id}
                    className="shrink-0 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-neutral-100 disabled:opacity-50"
                  >
                    {switching === icp.id ? "Switching…" : "Use as default"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="mt-4 text-sm font-medium text-brand-700 underline underline-offset-2"
        >
          + Create a new ICP instead
        </button>
      </section>
    );
  }

  if (mode === "view" && defaultIcp) {
    return (
      <section className="rounded-2xl border border-brand-100 bg-brand-50/60 p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
              Section 1 · Ideal Client Profile
            </p>
            <p className="mt-1.5 text-sm font-medium text-brand-700">Using your default ICP</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setMode("browse")}
              className="rounded-lg border border-brand-100 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Switch
            </button>
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="rounded-lg border border-brand-100 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Edit
            </button>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink/85">{defaultIcp.chat_text}</p>
        {defaultIcp.summary && (
          <p className="mt-3 text-xs italic text-ink-soft">AI summary: {defaultIcp.summary}</p>
        )}
        {defaultIcp.file_urls && defaultIcp.file_urls.length > 0 && (
          <p className="mt-2 text-xs text-ink-soft">
            {defaultIcp.file_urls.length} file(s) attached
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200/70 bg-paper-raised p-6 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
        Section 1 · Ideal Client Profile
      </p>
      <p className="mt-1.5 text-sm text-ink-soft">
        Describe the type of client you typically serve. This informs every proposal you generate.
      </p>
      <form
        action={(fd) => {
          formAction(fd);
        }}
        className="mt-4 space-y-3"
      >
        <textarea
          name="chat_text"
          rows={4}
          defaultValue={defaultIcp?.chat_text ?? ""}
          placeholder="e.g. My ideal client is a working professional aged 30-45, married with young children..."
          className="w-full rounded-lg border border-neutral-300 p-3 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx"
          className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-neutral-50"
        />
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            name="is_default"
            defaultChecked={true}
            className="h-4 w-4 rounded border-neutral-300 text-brand-700 focus:ring-brand-400"
          />
          Set as Default ICP
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-900 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save ICP"}
          </button>
          {defaultIcp && (
            <button
              type="button"
              onClick={() => setMode("view")}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-ink hover:bg-neutral-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
