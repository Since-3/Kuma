/**
 * Stripe Connect Actions - Server-seitige Aktionen für Business-Onboarding bei Stripe
 *
 * Diese Datei enthält alle Server Actions die nötig sind, damit ein Business
 * über Stripe Connect Express Zahlungen empfangen kann.
 */

"use server";

import { prisma } from "@/src/lib/prisma";
import { stripe } from "@/src/lib/stripe";
import { requireAuthWithData, isManager } from "@/src/lib/auth/getUser";
import { revalidatePath } from "next/cache";

/**
 * Erstellt einen Stripe Connect Express Account für ein Business und liefert
 * einen Onboarding-Link zurück. Wenn der Account schon existiert wird nur
 * ein neuer Onboarding-Link generiert.
 *
 * @param businessId - Die ID des Business
 * @returns Onboarding-URL oder Fehler
 */
export async function createConnectOnboardingLink(businessId: string) {
  try {
    const userData = await requireAuthWithData();

    if (!isManager(userData)) {
      return { success: false, error: "Nur Manager können Stripe-Konten verbinden" };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return { success: false, error: "Business nicht gefunden" };
    }

    if (business.managerId !== userData.id) {
      return { success: false, error: "Keine Berechtigung für dieses Business" };
    }

    let stripeAccountId = business.stripeAccountId;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "DE",
        email: business.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "company",
        business_profile: {
          name: business.name,
          mcc: "7991", // Sports and Recreation
        },
        metadata: {
          businessId: business.id,
          managerId: userData.id,
        },
      });

      stripeAccountId = account.id;

      await prisma.business.update({
        where: { id: businessId },
        data: {
          stripeAccountId,
          stripeAccountStatus: "pending",
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/api/stripe/connect/refresh?businessId=${businessId}`,
      return_url: `${baseUrl}/api/stripe/connect/return?businessId=${businessId}`,
      type: "account_onboarding",
    });

    return { success: true, url: accountLink.url };
  } catch (error) {
    console.error("Error creating Connect onboarding link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fehler beim Erstellen des Onboarding-Links",
    };
  }
}

/**
 * Prüft den Status eines Stripe Connect Accounts und aktualisiert ihn in der DB.
 * Wird typischerweise nach dem Onboarding-Return aufgerufen.
 *
 * @param businessId - Die ID des Business
 */
export async function syncConnectAccountStatus(businessId: string) {
  try {
    const userData = await requireAuthWithData();
    if (!isManager(userData)) {
      return { success: false, error: "Nur für Manager verfügbar" };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business?.stripeAccountId) {
      return { success: false, error: "Business hat kein Stripe-Konto" };
    }

    if (business.managerId !== userData.id) {
      return { success: false, error: "Keine Berechtigung für dieses Business" };
    }

    const account = await stripe.accounts.retrieve(business.stripeAccountId);

    let status: "pending" | "active" | "restricted" = "pending";
    if (account.charges_enabled && account.payouts_enabled) {
      status = "active";
    } else if (account.requirements?.disabled_reason) {
      status = "restricted";
    }

    await prisma.business.update({
      where: { id: businessId },
      data: { stripeAccountStatus: status },
    });

    revalidatePath("/settings");
    revalidatePath("/settings/payments");

    return { success: true, status };
  } catch (error) {
    console.error("Error syncing Connect account status:", error);
    return { success: false, error: "Fehler beim Synchronisieren des Status" };
  }
}

/**
 * Liefert alle Businesses eines Managers mit ihrem Stripe-Status.
 */
export async function getBusinessesWithStripeStatus() {
  try {
    const userData = await requireAuthWithData();

    if (!isManager(userData)) {
      return { success: false, error: "Nur für Manager verfügbar", businesses: [] };
    }

    const businesses = await prisma.business.findMany({
      where: { managerId: userData.id },
      select: {
        id: true,
        name: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
      },
    });

    return { success: true, businesses };
  } catch (error) {
    console.error("Error fetching businesses with stripe status:", error);
    return { success: false, error: "Fehler beim Laden", businesses: [] };
  }
}

/**
 * Erstellt einen Login-Link für das Stripe Express Dashboard.
 * So kann der Manager seinen Auszahlungs-Account einsehen.
 *
 * @param businessId - Die ID des Business
 */
export async function createStripeExpressDashboardLink(businessId: string) {
  try {
    const userData = await requireAuthWithData();

    if (!isManager(userData)) {
      return { success: false, error: "Nur Manager können das Dashboard öffnen" };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.managerId !== userData.id) {
      return { success: false, error: "Business nicht gefunden" };
    }

    if (!business.stripeAccountId) {
      return { success: false, error: "Kein Stripe-Konto verbunden" };
    }

    const loginLink = await stripe.accounts.createLoginLink(business.stripeAccountId);

    return { success: true, url: loginLink.url };
  } catch (error) {
    console.error("Error creating Stripe dashboard link:", error);
    return { success: false, error: "Fehler beim Erstellen des Dashboard-Links" };
  }
}
