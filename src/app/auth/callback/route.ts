import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Confirmation / code callback.
 *
 * The default Supabase "Confirm signup" email (built-in email service, whose
 * template can't be edited without custom SMTP) links to Supabase's verify
 * endpoint, which confirms the address and then redirects here with a `code`.
 *
 * - Same browser as sign-up → the PKCE verifier cookie is present, so we
 *   exchange the code and land the user straight on their my-page.
 * - Different browser, or the one-time code was already consumed by an email
 *   link pre-scanner → exchange fails, BUT the address is already confirmed by
 *   the verify step. So we send the user to /login with a friendly "confirmed,
 *   please sign in" notice rather than a hard error.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Code present but not exchangeable → email is confirmed; ask to sign in.
    return NextResponse.redirect(`${origin}/login?confirmed=1`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
