import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (_stripe) return _stripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt");
  }
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-05-27.dahlia",
    typescript: true,
  });
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripeClient(), prop, getStripeClient());
  },
});

/**
 * Liefert das Webhook-Secret und wirft, wenn es fehlt.
 * Lazy ausgewertet (nicht auf Modul-Ebene), damit `next build` nicht abbricht,
 * wenn die ENV-Variable beim Build (z.B. in CI) noch nicht gesetzt ist.
 */
export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET ist nicht gesetzt");
  }
  return secret;
}

/**
 * Liefert die validierte Plattform-Fee in Prozent (Default 5%).
 * Lazy ausgewertet, damit ein ungültiger Wert nicht den Build crasht.
 */
export function getPlatformFeePercent(): number {
  const raw = process.env.STRIPE_PLATFORM_FEE_PERCENT;
  // Leerer/Whitespace-String würde via Number("") still zu 0 werden und so
  // die Fee unbemerkt auf 0 setzen. Explizit ablehnen.
  if (raw?.trim() === "") {
    throw new Error("STRIPE_PLATFORM_FEE_PERCENT darf nicht leer sein");
  }
  const value = Number(raw ?? "5");
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("STRIPE_PLATFORM_FEE_PERCENT muss zwischen 0 und 100 liegen");
  }
  return value;
}

/**
 * Berechnet die Plattform-Fee in Cents.
 * @param amountEuros - Kurs-Preis in EUR
 * @returns Fee-Betrag in Cents (für Stripe API)
 */
export function calculatePlatformFeeCents(amountEuros: number): number {
  const amountCents = Math.round(amountEuros * 100);
  return Math.round((amountCents * getPlatformFeePercent()) / 100);
}

/**
 * Konvertiert EUR zu Cents für Stripe API
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}
