import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, getWebhookSecret } from "@/src/lib/stripe";
import { prisma } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/src/lib/mail/nodemailer";
import { generateBookingConfirmationEmail } from "@/src/lib/mail/templates/booking-confirmation";
import { generateBookingRefundEmail } from "@/src/lib/mail/templates/booking-refund";

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
    event = stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret());
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
  const outcome = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.courseBooking.findUnique({
        where: { courseId_userId: { courseId, userId } },
      });

      // Idempotenz: Wenn diese Buchung bereits einen Endzustand für DIESE Session
      // erreicht hat, ist der Event schon verarbeitet. Erneutes Durchlaufen würde
      // sonst einen zweiten Refund auslösen oder "refunded" → "failed" überschreiben.
      if (existing && existing.stripeSessionId === session.id) {
        if (existing.paymentStatus === "paid") return "already_paid" as const;
        if (existing.paymentStatus === "refunded") return "already_refunded" as const;
        if (existing.paymentStatus === "failed") return "already_failed" as const;
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
    },
    { isolationLevel: "Serializable" }
  );

  // "already_failed" = Buchung wurde bei früherem Versuch wegen voller Kapazität
  // auf "failed" gesetzt, aber der Refund ist noch ausstehend (z.B. damals
  // fehlgeschlagen). Bei Stripe-Retry erneut versuchen.
  const needsRefund = outcome === "capacity_exceeded" || outcome === "already_failed";

  let refundSucceeded = false;
  if (needsRefund && paymentIntentId) {
    console.warn(
      `Kurs ${courseId} war voll als Zahlung für User ${userId} ankam. ` +
        `Automatische Rückerstattung wird ausgelöst (PaymentIntent ${paymentIntentId}).`
    );
    refundSucceeded = await refundPayment(paymentIntentId);
    if (refundSucceeded) {
      await prisma.courseBooking.update({
        where: { courseId_userId: { courseId, userId } },
        data: { paymentStatus: "refunded" },
      });
    } else {
      // Refund fehlgeschlagen: Buchung bleibt "failed" für manuelle Bearbeitung.
      // Stripe wiederholt den Webhook, sodass ein erneuter Refund-Versuch erfolgt.
      console.error(
        `Refund fehlgeschlagen für Kurs ${courseId}, User ${userId}. ` +
          `Buchung bleibt "failed" – manuelle Erstattung im Stripe Dashboard nötig.`
      );
    }
  }

  // E-Mail-Versand (FR.10) – darf den Webhook NICHT zum Crashen bringen.
  // Bei Fehler: nur loggen, sonst riskiert man Stripe-Retry-Schleifen und
  // mehrfache Buchungs-Verarbeitung.
  // Außerdem: harte 2-Sekunden-Grenze pro Mail, damit ein träger SMTP-Server
  // den Webhook nicht über sein Timeout-Limit zieht. Der Versand läuft dann
  // im Hintergrund weiter; der Webhook gibt nur früher 200 zurück.
  const recipientEmail = session.customer_email ?? session.customer_details?.email ?? null;
  if (recipientEmail) {
    if (outcome === "booked") {
      await withTimeout(sendBookingConfirmation(recipientEmail, courseId, amountPaidCents), 2000);
    } else if (needsRefund && refundSucceeded) {
      await withTimeout(sendBookingRefund(recipientEmail, courseId, amountPaidCents), 2000);
    }
  }

  revalidatePath("/courses");
  revalidatePath("/courses/myCourses");
}

/**
 * Wartet maximal `ms` Millisekunden auf das Promise. Läuft das Promise länger,
 * wird `null` zurückgegeben – das eigentliche Promise läuft im Hintergrund weiter.
 * Wird genutzt, um den Stripe-Webhook nicht über sein Timeout-Limit hinauszuziehen.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Lädt Kurs+Business und schickt die Buchungs-Bestätigung an den Kunden.
 * Schluckt Fehler bewusst (siehe Caller-Kommentar).
 */
async function sendBookingConfirmation(
  recipientEmail: string,
  courseId: string,
  amountPaidCents: number
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        name: true,
        date: true,
        timeFrom: true,
        timeTo: true,
        coverImage: true,
        business: { select: { name: true, address: true } },
      },
    });
    if (!course || !course.business) return;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { subject, html, text } = generateBookingConfirmationEmail({
      courseName: course.name,
      courseDate: course.date,
      timeFrom: course.timeFrom,
      timeTo: course.timeTo,
      businessName: course.business.name,
      businessAddress: course.business.address,
      amountPaidCents,
      myCoursesUrl: `${baseUrl}/courses/myCourses`,
      coverImageUrl: course.coverImage,
      companyName: process.env.COMPANY_NAME,
    });

    await sendMail({ to: recipientEmail, subject, html, text });
  } catch (err) {
    console.error("Buchungs-Bestätigungs-Mail fehlgeschlagen:", err);
  }
}

/**
 * Lädt Kurs+Business und schickt die Rückerstattungs-Mail an den Kunden.
 * Schluckt Fehler bewusst (siehe Caller-Kommentar).
 */
async function sendBookingRefund(
  recipientEmail: string,
  courseId: string,
  amountRefundedCents: number
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        name: true,
        business: { select: { name: true } },
      },
    });
    if (!course || !course.business) return;

    const { subject, html, text } = generateBookingRefundEmail({
      courseName: course.name,
      businessName: course.business.name,
      amountRefundedCents,
      companyName: process.env.COMPANY_NAME,
    });

    await sendMail({ to: recipientEmail, subject, html, text });
  } catch (err) {
    console.error("Refund-Mail fehlgeschlagen:", err);
  }
}

/**
 * Erstattet eine Zahlung vollständig zurück (Reverse Transfer + Application Fee,
 * damit das Geld komplett zurückfließt – auch der bereits transferierte Anteil
 * beim Connected Account).
 */
async function refundPayment(paymentIntentId: string): Promise<boolean> {
  try {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reverse_transfer: true,
      refund_application_fee: true,
    });
    return true;
  } catch (err) {
    console.error(`Refund für PaymentIntent ${paymentIntentId} fehlgeschlagen:`, err);
    return false;
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
