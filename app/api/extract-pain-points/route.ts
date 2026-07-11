import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPainPoints } from "@/lib/ai/tools";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const clientProfileId = body?.client_profile_id as string | undefined;
  if (!clientProfileId) {
    return NextResponse.json({ error: "client_profile_id is required" }, { status: 400 });
  }

  const supabase = await createClient();
  try {
    const result = await extractPainPoints(supabase, clientProfileId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to extract pain points" },
      { status: 500 },
    );
  }
}
