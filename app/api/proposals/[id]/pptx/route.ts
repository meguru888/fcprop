import { createClient } from "@/lib/supabase/server";
import { extractContent } from "@/lib/proposal-content";
import { buildProposalPptx } from "@/lib/pptx/proposal-pptx";
import { getFcProfile } from "@/lib/actions/fc-profile";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return new Response(error.message, { status: 500 });
  if (!proposal) return new Response("Proposal not found", { status: 404 });

  const content = extractContent(proposal);
  if (!content) return new Response("Proposal has no content yet", { status: 400 });

  const fcProfile = await getFcProfile();
  const pptx = buildProposalPptx(proposal, content, fcProfile);
  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="proposal-${content.client_name.replace(/\s+/g, "-").toLowerCase()}.pptx"`,
      "Cache-Control": "no-store",
    },
  });
}
