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

  const result = await syncConnectAccountStatus(businessId);
  if (!result.success) {
    return NextResponse.redirect(new URL("/settings/payments?error=sync-failed", request.url));
  }

  return NextResponse.redirect(new URL("/settings/payments?onboarding=success", request.url));
}
