"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateProposal } from "@/lib/ai/tools";
import type { Proposal } from "@/lib/supabase/types";

export async function getLatestProposal(clientId: string): Promise<Proposal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export interface GenerateProposalUiResult {
  status: "idle" | "blocked" | "needs_illustration" | "ok" | "error";
  message?: string;
}

export async function runGenerateProposal(
  _prev: GenerateProposalUiResult,
  formData: FormData,
): Promise<GenerateProposalUiResult> {
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return { status: "error", message: "Missing client." };

  const supabase = await createClient();
  try {
    const result = await generateProposal(supabase, clientId);

    if (result.status === "blocked") {
      return { status: "blocked", message: result.reason };
    }
    if (result.status === "needs_illustration") {
      return {
        status: "needs_illustration",
        message: `We found a suitable product (${result.productName}). Please upload the actual benefit illustration for ${result.clientName} before we generate the proposal.`,
      };
    }

    revalidatePath(`/clients/${clientId}`);
    return { status: "ok" };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Proposal generation timed out. Please try again.",
    };
  }
}

export async function approveProposal(proposalId: string, clientId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("proposals")
    .update({ status: "ready", content_review_status: "approved" })
    .eq("id", proposalId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
}
