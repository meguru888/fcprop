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
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">fcprop</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Upload client info + a benefit illustration, generate a personalized proposal in minutes.
        </p>
      </header>

      <IcpPanel defaultIcp={defaultIcp} />

      <section className="rounded-xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Section 2 · Clients
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Pick a client to add their fact-find, upload a benefit illustration, and generate a proposal.
            </p>
          </div>
        </div>

        {clients.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-400">No clients yet — add your first one below.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-100">
            {clients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between py-3 text-sm hover:bg-neutral-50 -mx-2 px-2 rounded-md"
                >
                  <span className="font-medium text-neutral-800">{client.name}</span>
                  <span className="text-neutral-400">
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
