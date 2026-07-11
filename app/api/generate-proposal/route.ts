import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateProposal } from "@/lib/ai/tools";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const clientId = body?.client_id as string | undefined;
  if (!clientId) return NextResponse.json({ error: "client_id is required" }, { status: 400 });

  const supabase = await createClient();
  try {
    const result = await generateProposal(supabase, clientId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Proposal generation timed out. Please try again." },
      { status: 500 },
    );
  }
}
