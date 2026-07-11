import Link from "next/link";
import { getDefaultIcp } from "@/lib/actions/icp";
import { listClients } from "@/lib/actions/clients";
import { listKbDocs } from "@/lib/actions/kb";
import { IcpPanel } from "@/components/icp-panel";
import { KbPanel } from "@/components/kb-panel";
import { NewClientForm } from "@/components/new-client-form";

export default async function Home() {
  const [defaultIcp, clients, kbDocs] = await Promise.all([
    getDefaultIcp(),
    listClients(),
    listKbDocs(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-14 space-y-8">
      <header className="mb-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 font-serif text-base italic text-white">
            f
          </span>
          <h1 className="font-serif text-2xl italic tracking-tight text-ink">fcprop</h1>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          Upload client info + a benefit illustration, generate a personalized proposal in minutes.
        </p>
      </header>

      <IcpPanel defaultIcp={defaultIcp} />

      <section className="rounded-2xl border border-neutral-200/70 bg-paper-raised p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
              Section 2 · Clients
            </p>
            <p className="mt-1.5 text-sm text-ink-soft">
              Pick a client to add their fact-find, upload a benefit illustration, and generate a proposal.
            </p>
          </div>
        </div>

        {clients.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-400">No clients yet — add your first one below.</p>
        ) : (
          <ul className="mt-5 divide-y divide-neutral-100">
            {clients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="group flex items-center gap-3 py-3 text-sm -mx-2 px-2 rounded-lg transition-colors hover:bg-brand-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-xs font-semibold text-gold-600">
                    {client.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex-1 font-medium text-ink group-hover:text-brand-700">{client.name}</span>
                  <span className="text-xs text-neutral-400">
                    {client.age ? `Age ${client.age}` : ""} {client.email ?? ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <NewClientForm />
        </div>
      </section>

      <KbPanel docs={kbDocs} />
    </main>
  );
}
