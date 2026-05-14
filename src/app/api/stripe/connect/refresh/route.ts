import { NextRequest, NextResponse } from "next/server";
import { createConnectOnboardingLink } from "@/src/modules/settings/actions/stripe-connect-actions";

/**
 * Refresh-URL für Stripe Connect Onboarding.
 * Wird aufgerufen wenn der Onboarding-Link abgelaufen ist - wir generieren einen neuen.
 */
export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.redirect(new URL("/settings/payments?error=missing-business", request.url));
  }

  const result = await createConnectOnboardingLink(businessId);

  if (!result.success || !result.url) {
    return NextResponse.redirect(new URL("/settings/payments?error=refresh-failed", request.url));
  }

  return NextResponse.redirect(result.url);
}
