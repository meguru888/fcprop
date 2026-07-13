import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for Supabase Auth email links (password reset, invites).
// Exchanges the one-time code for a real session, then forwards the FC on to
// wherever the link was meant to send them (defaults to the reset-password page).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/reset-password";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link_expired`);
}
