import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { syncEmailAfterConfirmation } from "@/src/modules/settings/actions/personal-settings-actions";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext && /^\/(?!\/)/.test(requestedNext) ? requestedNext : "/settings/personal";
  const isEmailChange = searchParams.get("email_confirmed") === "true";

  if (!code) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (isEmailChange) {
    const syncResult = await syncEmailAfterConfirmation();
    if (!syncResult.success) {
      const fallback = new URL("/settings/personal", request.url);
      fallback.searchParams.set("emailSync", "failed");
      return NextResponse.redirect(fallback);
    }
  }

  // Hard redirect so the browser re-fetches the page fully,
  // bypassing any Next.js client-side cache.
  const url = new URL(next, request.url);
  url.searchParams.set("t", Date.now().toString());
  return NextResponse.redirect(url);
}
