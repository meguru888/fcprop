import { getDefaultIcp } from "@/lib/actions/icp";
import { listClients } from "@/lib/actions/clients";
import { listKbDocs } from "@/lib/actions/kb";
import { getBenefitIllustration } from "@/lib/actions/benefit-illustrations";
import { getFcProfile } from "@/lib/actions/fc-profile";
import { IcpPanel } from "@/components/icp-panel";
import { KbPanel } from "@/components/kb-panel";
import { NewClientForm } from "@/components/new-client-form";
import { HomeBenefitIllustrationSection } from "@/components/home-benefit-illustration-section";
import { FcProfilePanel } from "@/components/fc-profile-panel";
import { TrackedClientLink } from "@/components/tracked-client-link";
import type { BenefitIllustration } from "@/lib/supabase/types";

export default async function Home() {
  const [fcProfile, defaultIcp, clients, kbDocs] = await Promise.all([
    getFcProfile(),
    getDefaultIcp(),
    listClients(),
    listKbDocs(),
  ]);

  const illustrationEntries = await Promise.all(
    clients.map(async (client) => [client.id, await getBenefitIllustration(client.id)] as const),
  );
  const illustrations = Object.fromEntries(illustrationEntries) as Record<string, BenefitIllustration | null>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 space-y-6">
      <header className="mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-[28px] font-medium tracking-tight text-ink">
            Proposal<span className="text-gold-600">OS</span>
          </h1>
        </div>
        <div className="mt-3 h-[2px] w-9 bg-gold-400" />
        <p className="mt-3 text-sm text-ink-soft">
          Upload client info + a benefit illustration, generate a personalized proposal in minutes.
        </p>
      </header>

      <FcProfilePanel profile={fcProfile} />

      <IcpPanel defaultIcp={defaultIcp} />

      <section className="rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
              Section 2 · Clients
            </p>
            <p className="mt-1.5 text-sm text-ink-soft">
              Pick a client to add their fact-find, upload a benefit illustration, and generate a proposal.
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              The fact-find and full proposal continue once you open a client below.
            </p>
          </div>
        </div>

        {clients.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-400">No clients yet — add your first one below.</p>
        ) : (
          <ul className="mt-5 divide-y divide-neutral-100">
            {clients.map((client) => (
              <li key={client.id}>
                <TrackedClientLink
                  clientId={client.id}
                  className="group flex items-center gap-3.5 py-3.5 text-sm -mx-2.5 px-2.5 rounded-xl transition-colors hover:bg-brand-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-100 to-gold-400 text-[13px] font-semibold text-gold-700 shadow-sm ring-2 ring-white">
                    {client.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex-1 font-medium text-[15px] text-ink group-hover:text-brand-700">{client.name}</span>
                  <span className="text-xs text-neutral-400">
                    {client.age ? `Age ${client.age}` : ""} {client.email ?? ""}
                  </span>
                </TrackedClientLink>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          <NewClientForm />
        </div>
      </section>

      <HomeBenefitIllustrationSection clients={clients} illustrations={illustrations} />

      <KbPanel docs={kbDocs} />
    </main>
  );
}
