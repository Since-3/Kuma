import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/src/lib/stripe";
import { prisma } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Stripe Webhook Handler.
 *
 * WICHTIG: Erst hier wird die CourseBooking endgültig in der DB als bezahlt markiert.
 * Niemals den Booking-Status auf der Success-Page-Seite setzen (kann umgangen werden).
 *
 * Die folgenden Events werden verarbeitet:
 * - checkout.session.completed → Booking als "paid" markieren (oder erstellen)
 * - checkout.session.expired → Pending-Booking aufräumen
 * - account.updated → Stripe Connect Account-Status synchronisieren
 */
export async function POST(request: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET ist nicht gesetzt");
    return NextResponse.json({ error: "Webhook nicht konfiguriert" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signatur fehlt" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook-Signatur ungültig:", err);
    return NextResponse.json({ error: "Ungültige Signatur" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object);
        break;
      }
      case "checkout.session.expired": {
        await handleCheckoutExpired(event.data.object);
        break;
      }
      case "account.updated": {
        await handleAccountUpdated(event.data.object);
        break;
      }
      default:
        // andere Events werden ignoriert
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Fehler bei Webhook-Event ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook-Verarbeitung fehlgeschlagen" }, { status: 500 });
  }
}

/**
 * Verarbeitet eine erfolgreiche Checkout-Session.
 * Erstellt die CourseBooking (falls nicht vorhanden) und setzt sie auf "paid".
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const courseId = session.metadata?.courseId;
  const userId = session.metadata?.userId;

  if (!courseId || !userId) {
    console.error("checkout.session.completed: courseId oder userId fehlt in Metadata");
    return;
  }

  if (session.payment_status !== "paid") {
    console.warn(
      `Session ${session.id} ist nicht 'paid', aktueller Status: ${session.payment_status}`
    );
    return;
  }

  const amountTotal = session.amount_total ?? 0;
  const amountPaidEur = amountTotal / 100;
  const applicationFee = session.payment_intent
    ? await getApplicationFeeFromPaymentIntent(session.payment_intent as string)
    : 0;
  const platformFeeEur = applicationFee / 100;

  // Idempotent: existiert Buchung schon, update sie; sonst erstelle sie
  await prisma.courseBooking.upsert({
    where: {
      courseId_userId: { courseId, userId },
    },
    update: {
      paymentStatus: "paid",
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string | null,
      amountPaid: amountPaidEur,
      platformFee: platformFeeEur,
    },
    create: {
      courseId,
      userId,
      paymentStatus: "paid",
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string | null,
      amountPaid: amountPaidEur,
      platformFee: platformFeeEur,
    },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/book/${courseId}`);
  revalidatePath("/courses/myCourses");
}

/**
 * Holt die application_fee_amount vom PaymentIntent.
 * Wird gebraucht weil das Feld nicht direkt in der Session steht.
 */
async function getApplicationFeeFromPaymentIntent(paymentIntentId: string): Promise<number> {
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return intent.application_fee_amount ?? 0;
  } catch (err) {
    console.error("Fehler beim Abrufen des PaymentIntent:", err);
    return 0;
  }
}

/**
 * Verarbeitet eine abgelaufene Checkout-Session.
 * Setzt eventuell vorhandene Pending-Buchung auf "failed".
 */
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const courseId = session.metadata?.courseId;
  const userId = session.metadata?.userId;

  if (!courseId || !userId) return;

  const existing = await prisma.courseBooking.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });

  if (existing && existing.paymentStatus === "pending") {
    await prisma.courseBooking.update({
      where: { courseId_userId: { courseId, userId } },
      data: { paymentStatus: "failed" },
    });
  }
}

/**
 * Synchronisiert den Stripe Connect Account-Status mit der DB.
 * Wird ausgelöst wenn z.B. das Onboarding abgeschlossen wird.
 */
async function handleAccountUpdated(account: Stripe.Account) {
  const business = await prisma.business.findUnique({
    where: { stripeAccountId: account.id },
  });

  if (!business) {
    console.warn(`Kein Business für Stripe-Account ${account.id} gefunden`);
    return;
  }

  let status: "pending" | "active" | "restricted" = "pending";
  if (account.charges_enabled && account.payouts_enabled) {
    status = "active";
  } else if (account.requirements?.disabled_reason) {
    status = "restricted";
  }

  await prisma.business.update({
    where: { id: business.id },
    data: { stripeAccountStatus: status },
  });
}
