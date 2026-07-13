import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Paths reachable without an FC login. /admin has its own separate
// password-cookie gate (a different system entirely — that's the operator,
// not an FC). /auth/confirm exchanges a Supabase email-link code and must be
// reachable pre-session. Stripe webhooks are called by Stripe's servers, not
// a browser, and health is for uptime checks.
const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/auth/confirm", "/admin"];
const PUBLIC_API_PATHS = ["/api/health", "/api/stripe/webhooks"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, skip the auth refresh and pass through.
  // Without this guard createServerClient throws "Your project's URL and Key
  // are required", crashing the edge middleware on every route (500
  // MIDDLEWARE_INVOCATION_FAILED).
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  try {
    let response = supabaseResponse;
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refresh session so it doesn't expire while user is active
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    if (!user && !isPublicPath(pathname) && !PUBLIC_API_PATHS.includes(pathname)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch {
    // Never let an auth hiccup crash the entire edge middleware
    return supabaseResponse;
  }
}
