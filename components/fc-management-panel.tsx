"use client";

import { useActionState, useEffect, useState } from "react";
import { createFc, setFcActive, type CreateFcResult, type FcRow } from "@/lib/actions/fc-management";

const initialState: CreateFcResult = { ok: false };

export function FcManagementPanel({ fcs }: { fcs: FcRow[] }) {
  const [state, formAction, pending] = useActionState(createFc, initialState);
  const [formKey, setFormKey] = useState(0);

  // Clear the name/email inputs after a successful create, but leave the
  // one-time generated password banner (rendered from `state`) on screen.
  useEffect(() => {
    if (state.ok) setFormKey((k) => k + 1);
  }, [state.ok]);

  return (
    <section className="rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold text-ink">FC Access</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Grant a financial consultant a login. They'll use the generated password once, on the login page's
        &quot;Forgot password&quot; flow, to set their own password.
      </p>

      <form key={formKey} action={formAction} className="mt-4 flex flex-wrap items-start gap-3">
        <input
          name="name"
          required
          placeholder="FC's full name"
          className="min-w-[180px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="FC's email"
          className="min-w-[220px] flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-900 disabled:opacity-50"
        >
          {pending ? "Adding…" : "+ Add FC"}
        </button>
      </form>

      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}

      {state.ok && state.created && (
        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-medium text-ink">
            Account created for {state.created.name} ({state.created.email}).
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            One-time generated password — copy it now, it won't be shown again:
          </p>
          <code className="mt-2 block w-fit rounded-lg bg-white px-3 py-1.5 font-mono text-sm text-ink">
            {state.created.password}
          </code>
          <p className="mt-2 text-xs text-ink-soft">
            Send this to the FC and have them log in, then click &quot;Forgot password?&quot; to set their own.
          </p>
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-ink-soft">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Added</th>
              <th className="py-2 pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {fcs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-sm text-neutral-400">
                  No FC accounts yet — add one above.
                </td>
              </tr>
            ) : (
              fcs.map((fc) => (
                <tr key={fc.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-4 text-ink">{fc.name ?? "—"}</td>
                  <td className="py-2 pr-4 text-ink-soft">{fc.email ?? "—"}</td>
                  <td className="py-2 pr-4 text-ink-soft">{fc.company_name ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {fc.active ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-ink-soft">{new Date(fc.created_at).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">
                    <form action={setFcActive.bind(null, fc.id, !fc.active)}>
                      <button
                        type="submit"
                        className={
                          fc.active
                            ? "text-xs font-medium text-red-600 hover:underline"
                            : "text-xs font-medium text-brand-700 hover:underline"
                        }
                      >
                        {fc.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
