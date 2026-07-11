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
      <section className="rounded-xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Section 1 · Saved Ideal Client Profiles
          </p>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700"
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
              className={`rounded-md border p-3 ${
                icp.is_default ? "border-emerald-200 bg-emerald-50" : "border-neutral-100 bg-neutral-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-neutral-700 line-clamp-2">{icp.chat_text}</p>
                {icp.is_default ? (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    Default
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUseAsDefault(icp.id)}
                    disabled={switching === icp.id}
                    className="shrink-0 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
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
          className="mt-4 text-sm font-medium text-neutral-700 underline"
        >
          + Create a new ICP instead
        </button>
      </section>
    );
  }

  if (mode === "view" && defaultIcp) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Section 1 · Ideal Client Profile
            </p>
            <p className="mt-1 text-sm text-emerald-900">Using your default ICP</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setMode("browse")}
              className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
            >
              Switch
            </button>
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
            >
              Edit
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-700">{defaultIcp.chat_text}</p>
        {defaultIcp.summary && (
          <p className="mt-2 text-xs italic text-neutral-500">AI summary: {defaultIcp.summary}</p>
        )}
        {defaultIcp.file_urls && defaultIcp.file_urls.length > 0 && (
          <p className="mt-2 text-xs text-neutral-500">
            {defaultIcp.file_urls.length} file(s) attached
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Section 1 · Ideal Client Profile
      </p>
      <p className="mt-1 text-sm text-neutral-600">
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
          className="w-full rounded-md border border-neutral-300 p-3 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx"
          className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="is_default"
            defaultChecked={true}
            className="h-4 w-4 rounded border-neutral-300"
          />
          Set as Default ICP
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save ICP"}
          </button>
          {defaultIcp && (
            <button
              type="button"
              onClick={() => setMode("view")}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
