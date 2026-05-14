import { NextRequest, NextResponse } from "next/server";
import { syncConnectAccountStatus } from "@/src/modules/settings/actions/stripe-connect-actions";

/**
 * Return-URL nach erfolgreichem (oder abgeschlossenem) Stripe Connect Onboarding.
 * Stripe leitet den Manager hierher zurück. Wir synchronisieren dann den Account-Status.
 */
export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.redirect(new URL("/settings/payments?error=missing-business", request.url));
  }

  await syncConnectAccountStatus(businessId);

  return NextResponse.redirect(new URL("/settings/payments?onboarding=success", request.url));
}
