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

  // Sicherheitsnetz: User muss in der User-Tabelle existieren, sonst würde
  // der Foreign-Key-Constraint die Buchung ablehnen. Wir loggen das und
  // geben 200 zurück (kein Stripe-Retry für einen Fehler den ein Retry nicht behebt).
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!userExists) {
    console.error(
      `checkout.session.completed: User ${userId} existiert nicht in der User-Tabelle. ` +
        `Session ${session.id} wird ignoriert. Zahlung muss ggf. manuell erstattet werden.`
    );
    return;
  }

  // Beträge in Cents (ganzzahlig) speichern – keine Float-Rundungsfehler.
  const amountPaidCents = session.amount_total ?? 0;
  const paymentIntentId = (session.payment_intent as string | null) ?? null;
  const platformFeeCents = paymentIntentId
    ? await getApplicationFeeFromPaymentIntent(paymentIntentId)
    : 0;

  // Atomare Kapazitätsprüfung: verhindert dass zwei gleichzeitig zahlende User
  // den letzten Platz bekommen. Innerhalb der Transaction wird gezählt und
  // erst dann auf "paid" gesetzt.
  const outcome = await prisma.$transaction(async (tx) => {
    const existing = await tx.courseBooking.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });

    // Idempotenz: dieser Stripe-Event wurde schon verarbeitet.
    if (existing?.paymentStatus === "paid") {
      return "already_paid" as const;
    }

    const course = await tx.course.findUnique({
      where: { id: courseId },
      select: { maxParticipants: true },
    });

    if (!course) {
      return "course_not_found" as const;
    }

    const paidCount = await tx.courseBooking.count({
      where: { courseId, paymentStatus: "paid" },
    });

    if (paidCount >= course.maxParticipants) {
      // Platz ist weg – Buchung als failed markieren, Aufrufer löst Refund aus.
      await tx.courseBooking.upsert({
        where: { courseId_userId: { courseId, userId } },
        update: {
          paymentStatus: "failed",
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          amountPaid: amountPaidCents,
          platformFee: platformFeeCents,
        },
        create: {
          courseId,
          userId,
          paymentStatus: "failed",
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          amountPaid: amountPaidCents,
          platformFee: platformFeeCents,
        },
      });
      return "capacity_exceeded" as const;
    }

    await tx.courseBooking.upsert({
      where: { courseId_userId: { courseId, userId } },
      update: {
        paymentStatus: "paid",
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        amountPaid: amountPaidCents,
        platformFee: platformFeeCents,
      },
      create: {
        courseId,
        userId,
        paymentStatus: "paid",
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        amountPaid: amountPaidCents,
        platformFee: platformFeeCents,
      },
    });
    return "booked" as const;
  });

  if (outcome === "capacity_exceeded" && paymentIntentId) {
    console.warn(
      `Kurs ${courseId} war voll als Zahlung für User ${userId} ankam. ` +
        `Automatische Rückerstattung wird ausgelöst (PaymentIntent ${paymentIntentId}).`
    );
    await refundPayment(paymentIntentId);
    await prisma.courseBooking.update({
      where: { courseId_userId: { courseId, userId } },
      data: { paymentStatus: "refunded" },
    });
  }

  revalidatePath("/courses");
  revalidatePath(`/courses/book/${courseId}`);
  revalidatePath("/courses/myCourses");
}

/**
 * Erstattet eine Zahlung vollständig zurück (Reverse Transfer + Application Fee,
 * damit das Geld komplett zurückfließt – auch der bereits transferierte Anteil
 * beim Connected Account).
 */
async function refundPayment(paymentIntentId: string) {
  try {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reverse_transfer: true,
      refund_application_fee: true,
    });
  } catch (err) {
    console.error(`Refund für PaymentIntent ${paymentIntentId} fehlgeschlagen:`, err);
  }
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
