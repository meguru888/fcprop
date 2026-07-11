import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeIcp } from "@/lib/ai/tools";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const icpId = body?.icp_id as string | undefined;
  if (!icpId) return NextResponse.json({ error: "icp_id is required" }, { status: 400 });

  const supabase = await createClient();
  try {
    const result = await summarizeIcp(supabase, icpId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to summarize ICP" },
      { status: 500 },
    );
  }
}
