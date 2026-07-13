import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/actions/clients";
import { getClientProfile } from "@/lib/actions/client-profiles";
import { getBenefitIllustration } from "@/lib/actions/benefit-illustrations";
import { getFcProfile } from "@/lib/actions/fc-profile";
import { getLatestProposal } from "@/lib/actions/proposals";
import { extractContent } from "@/lib/proposal-content";
import { ClientProfileForm } from "@/components/client-profile-form";
import { BenefitIllustrationForm } from "@/components/benefit-illustration-form";
import { DeleteClientButton } from "@/components/delete-client-button";
import { GenerateProposalSection } from "@/components/generate-proposal-section";
import { ProposalView } from "@/components/proposal-view";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const [profile, illustration, proposal, fcProfile] = await Promise.all([
    getClientProfile(id),
    getBenefitIllustration(id),
    getLatestProposal(id),
    getFcProfile(),
  ]);
  const proposalContent = proposal ? extractContent(proposal) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-ink-soft hover:text-brand-700 hover:underline">
          ← Back to all clients
        </Link>
        <DeleteClientButton clientId={id} />
      </div>

      <header className="mb-2 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-100 to-gold-400 font-serif text-xl text-gold-700 shadow-sm ring-2 ring-white">
          {client.name.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <h1 className="font-serif text-[26px] italic tracking-tight text-ink">{client.name}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {client.age ? `Age ${client.age}` : ""} {client.email ?? ""}
          </p>
        </div>
      </header>

      <ClientProfileForm clientId={id} profile={profile} />
      <BenefitIllustrationForm clientId={id} illustration={illustration} />

      <GenerateProposalSection
        clientId={id}
        hasIllustration={!!illustration}
        hasProposal={!!proposal}
        proposalStatus={proposal?.status ?? null}
      />

      {proposal && proposalContent && (
        <ProposalView proposal={proposal} content={proposalContent} fcProfile={fcProfile} />
      )}
    </main>
  );
}
