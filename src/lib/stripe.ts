import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

// Plattform-Fee in Prozent (z.B. 10 = 10%)
export const PLATFORM_FEE_PERCENT = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? "5");

/**
 * Berechnet die Plattform-Fee in Cents.
 * @param amountEuros - Kurs-Preis in EUR
 * @returns Fee-Betrag in Cents (für Stripe API)
 */
export function calculatePlatformFeeCents(amountEuros: number): number {
  const amountCents = Math.round(amountEuros * 100);
  return Math.round((amountCents * PLATFORM_FEE_PERCENT) / 100);
}

/**
 * Konvertiert EUR zu Cents für Stripe API
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}
