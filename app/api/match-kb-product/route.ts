import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { matchKbProduct } from "@/lib/ai/tools";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const clientId = body?.client_id as string | undefined;
  if (!clientId) return NextResponse.json({ error: "client_id is required" }, { status: 400 });

  const supabase = await createClient();
  try {
    const match = await matchKbProduct(supabase, clientId);
    if (!match) {
      return NextResponse.json({ product_kb_doc_id: null, confidence: 0 });
    }
    return NextResponse.json({
      product_kb_doc_id: match.doc.id,
      product_name: match.doc.original_filename,
      confidence: match.confidence,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to match KB product" },
      { status: 500 },
    );
  }
}
