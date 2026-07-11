import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/actions/clients";
import { getClientProfile } from "@/lib/actions/client-profiles";
import { getBenefitIllustration } from "@/lib/actions/benefit-illustrations";
import { ClientProfileForm } from "@/components/client-profile-form";
import { BenefitIllustrationForm } from "@/components/benefit-illustration-form";
import { DeleteClientButton } from "@/components/delete-client-button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const [profile, illustration] = await Promise.all([
    getClientProfile(id),
    getBenefitIllustration(id),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← Back to all clients
        </Link>
        <DeleteClientButton clientId={id} />
      </div>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{client.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {client.age ? `Age ${client.age}` : ""} {client.email ?? ""}
        </p>
      </header>

      <ClientProfileForm clientId={id} profile={profile} />
      <BenefitIllustrationForm clientId={id} illustration={illustration} />
    </main>
  );
}
