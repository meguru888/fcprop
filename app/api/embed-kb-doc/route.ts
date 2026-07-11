import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedKbDoc } from "@/lib/ai/tools";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const docId = body?.product_kb_doc_id as string | undefined;
  if (!docId) {
    return NextResponse.json({ error: "product_kb_doc_id is required" }, { status: 400 });
  }

  const supabase = await createClient();
  try {
    const result = await embedKbDoc(supabase, docId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to embed KB doc" },
      { status: 500 },
    );
  }
}
