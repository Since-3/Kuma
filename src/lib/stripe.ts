import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (_stripe) return _stripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt");
  }
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripeClient(), prop, getStripeClient());
  },
});

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET ist nicht gesetzt");
}
export const STRIPE_WEBHOOK_SECRET: string = process.env.STRIPE_WEBHOOK_SECRET;

// Plattform-Fee in Prozent (z.B. 10 = 10%)
const rawPlatformFeePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? "5");
if (
  !Number.isFinite(rawPlatformFeePercent) ||
  rawPlatformFeePercent < 0 ||
  rawPlatformFeePercent > 100
) {
  throw new Error("STRIPE_PLATFORM_FEE_PERCENT muss zwischen 0 und 100 liegen");
}
export const PLATFORM_FEE_PERCENT = rawPlatformFeePercent;

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
