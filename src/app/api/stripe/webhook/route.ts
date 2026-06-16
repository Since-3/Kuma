import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, getWebhookSecret } from "@/src/lib/stripe";
import { prisma } from "@/src/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
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
 * Unterstützt Auth-User und Gäste (isGuest === "true" in Metadata).
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const courseId = session.metadata?.courseId;
  const isGuest = session.metadata?.isGuest === "true";

  if (!courseId) {
    console.error("checkout.session.completed: courseId fehlt in Metadata");
    return;
  }

  if (session.payment_status !== "paid") {
    console.warn(
      `Session ${session.id} ist nicht 'paid', aktueller Status: ${session.payment_status}`
    );
    return;
  }

  const amountPaidCents = session.amount_total ?? 0;
  const paymentIntentId = (session.payment_intent as string | null) ?? null;
  const platformFeeCents = paymentIntentId
    ? await getApplicationFeeFromPaymentIntent(paymentIntentId)
    : 0;

  // Guest-Flow und Auth-Flow teilen die Kapazitäts-Logik, aber nutzen
  // unterschiedliche Identifikatoren und DB-Operationen.
  const MAX_ATTEMPTS = 3;
  let outcome: CapacityOutcome | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      if (isGuest) {
        const guestEmail = session.metadata?.guestEmail ?? "";
        const guestName = session.metadata?.guestName ?? undefined;

        if (!guestEmail) {
          console.error(
            "checkout.session.completed: isGuest=true aber guestEmail fehlt in Metadata. " +
              `Session ${session.id} wird ignoriert.`
          );
          return;
        }

        outcome = await runCapacityTransactionGuest({
          courseId,
          guestEmail,
          guestName: guestName || undefined,
          session,
          paymentIntentId,
          amountPaidCents,
          platformFeeCents,
        });
      } else {
        const userId = session.metadata?.userId;
        // Leerer String bedeutet: Checkout wurde ohne Auth erstellt (Race condition
        // oder alter Code-Pfad). Als Gast behandeln wenn guestEmail vorhanden.
        if (!userId) {
          const fallbackEmail =
            session.metadata?.guestEmail ||
            session.customer_details?.email ||
            session.customer_email;
          if (fallbackEmail) {
            outcome = await runCapacityTransactionGuest({
              courseId,
              guestEmail: fallbackEmail,
              guestName: session.metadata?.guestName || undefined,
              session,
              paymentIntentId,
              amountPaidCents,
              platformFeeCents,
            });
          } else {
            console.error(
              "checkout.session.completed: userId und guestEmail fehlen in Metadata. " +
                `Session ${session.id} wird ignoriert. Zahlung muss ggf. manuell erstattet werden.`
            );
            return;
          }
          break;
        }

        // Sicherheitsnetz: User muss in der User-Tabelle existieren.
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

        outcome = await runCapacityTransactionUser({
          courseId,
          userId,
          session,
          paymentIntentId,
          amountPaidCents,
          platformFeeCents,
        });
      }
      break;
    } catch (err: unknown) {
      const isSerializationError =
        err instanceof Error && "code" in err && (err as { code: string }).code === "P2034";

      if (isSerializationError && attempt < MAX_ATTEMPTS) {
        const delay = 50 * 2 ** (attempt - 1) + Math.random() * 30;
        console.warn(
          `Serialisierungskonflikt (Versuch ${attempt}/${MAX_ATTEMPTS}) – ` +
            `courseId=${courseId} isGuest=${isGuest} sessionId=${session.id}. ` +
            `Retry in ${Math.round(delay)}ms.`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (isSerializationError) {
        console.error(
          `Serialisierungskonflikt nach ${MAX_ATTEMPTS} Versuchen – ` +
            `courseId=${courseId} isGuest=${isGuest} sessionId=${session.id} ` +
            `paymentIntentId=${paymentIntentId}. Stripe wird den Webhook wiederholen.`
        );
      }
      throw err;
    }
  }

  if (!outcome) throw new Error("runCapacityTransaction lieferte kein Ergebnis");

  const needsRefund = outcome.result === "capacity_exceeded" || outcome.result === "already_failed";

  let refundSucceeded = false;
  if (needsRefund && paymentIntentId) {
    console.warn(
      `Kurs ${courseId} war voll als Zahlung ankam. ` +
        `Automatische Rückerstattung wird ausgelöst (PaymentIntent ${paymentIntentId}).`
    );
    refundSucceeded = await refundPayment(paymentIntentId);
    if (refundSucceeded && outcome.bookingId) {
      await prisma.courseBooking.update({
        where: { id: outcome.bookingId },
        data: { paymentStatus: "refunded" },
      });
    } else if (!refundSucceeded) {
      console.error(
        `Refund fehlgeschlagen für Kurs ${courseId}. ` +
          `Buchung bleibt "failed" – manuelle Erstattung im Stripe Dashboard nötig.`
      );
    }
  }

  // E-Mail-Versand – darf den Webhook NICHT zum Crashen bringen.
  const recipientEmail = session.customer_email ?? session.customer_details?.email ?? null;
  if (recipientEmail) {
    if (outcome.result === "booked") {
      await withTimeout(sendBookingConfirmation(recipientEmail, courseId, amountPaidCents), 2000);
    } else if (needsRefund && refundSucceeded) {
      await withTimeout(sendBookingRefund(recipientEmail, courseId, amountPaidCents), 2000);
    }
  }

  revalidatePath("/courses");
  revalidatePath("/courses/myCourses");

  if (outcome.result === "booked" || outcome.result === "capacity_exceeded") {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { businessId: true },
    });
    if (course) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (revalidateTag as any)(`business-courses-${course.businessId}`);
    }
  }
}

type CapacityOutcome = {
  result:
    | "booked"
    | "capacity_exceeded"
    | "already_paid"
    | "already_refunded"
    | "already_failed"
    | "course_not_found";
  bookingId?: string;
};

/**
 * Atomare Kapazitätsprüfung für authentifizierte User.
 */
async function runCapacityTransactionUser(params: {
  courseId: string;
  userId: string;
  session: Stripe.Checkout.Session;
  paymentIntentId: string | null;
  amountPaidCents: number;
  platformFeeCents: number;
}): Promise<CapacityOutcome> {
  const { courseId, userId, session, paymentIntentId, amountPaidCents, platformFeeCents } = params;

  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.courseBooking.findUnique({
        where: { courseId_userId: { courseId, userId } },
      });

      if (existing && existing.stripeSessionId === session.id) {
        if (existing.paymentStatus === "paid")
          return { result: "already_paid" as const, bookingId: existing.id };
        if (existing.paymentStatus === "refunded")
          return { result: "already_refunded" as const, bookingId: existing.id };
        if (existing.paymentStatus === "failed")
          return { result: "already_failed" as const, bookingId: existing.id };
      }

      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { maxParticipants: true },
      });

      if (!course) return { result: "course_not_found" as const };

      const paidCount = await tx.courseBooking.count({
        where: { courseId, paymentStatus: "paid" },
      });

      if (paidCount >= course.maxParticipants) {
        const booking = await tx.courseBooking.upsert({
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
        return { result: "capacity_exceeded" as const, bookingId: booking.id };
      }

      const booking = await tx.courseBooking.upsert({
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
      return { result: "booked" as const, bookingId: booking.id };
    },
    { isolationLevel: "Serializable" }
  );
}

/**
 * Atomare Kapazitätsprüfung für Gäste.
 * Erstellt einen GuestLead und eine CourseBooking ohne userId.
 * Idempotenz über stripeSessionId (findFirst statt findUnique).
 */
async function runCapacityTransactionGuest(params: {
  courseId: string;
  guestEmail: string;
  guestName?: string;
  session: Stripe.Checkout.Session;
  paymentIntentId: string | null;
  amountPaidCents: number;
  platformFeeCents: number;
}): Promise<CapacityOutcome> {
  const {
    courseId,
    guestEmail,
    guestName,
    session,
    paymentIntentId,
    amountPaidCents,
    platformFeeCents,
  } = params;

  return prisma.$transaction(
    async (tx) => {
      // Idempotenz: Wurde diese Session schon verarbeitet?
      const existing = await tx.courseBooking.findFirst({
        where: { stripeSessionId: session.id },
      });

      if (existing) {
        if (existing.paymentStatus === "paid")
          return { result: "already_paid" as const, bookingId: existing.id };
        if (existing.paymentStatus === "refunded")
          return { result: "already_refunded" as const, bookingId: existing.id };
        if (existing.paymentStatus === "failed")
          return { result: "already_failed" as const, bookingId: existing.id };
      }

      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { maxParticipants: true },
      });

      if (!course) return { result: "course_not_found" as const };

      const paidCount = await tx.courseBooking.count({
        where: { courseId, paymentStatus: "paid" },
      });

      // GuestLead erst nach Kapazitätsprüfung anlegen — verhindert Phantom-Einträge
      // bei Überbuchung. upsert by email: ein Gast bekommt genau einen Lead-Eintrag,
      // auch bei mehreren Buchungen (@@unique auf email im Schema).
      if (paidCount >= course.maxParticipants) {
        const guestLead = await tx.guestLead.upsert({
          where: { email: guestEmail },
          update: {},
          create: { email: guestEmail, name: guestName ?? null },
        });
        const booking = await tx.courseBooking.create({
          data: {
            courseId,
            guestLeadId: guestLead.id,
            paymentStatus: "failed",
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            amountPaid: amountPaidCents,
            platformFee: platformFeeCents,
          },
        });
        return { result: "capacity_exceeded" as const, bookingId: booking.id };
      }

      const guestLead = await tx.guestLead.upsert({
        where: { email: guestEmail },
        update: {},
        create: { email: guestEmail, name: guestName ?? null },
      });
      const booking = await tx.courseBooking.create({
        data: {
          courseId,
          guestLeadId: guestLead.id,
          paymentStatus: "paid",
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          amountPaid: amountPaidCents,
          platformFee: platformFeeCents,
        },
      });
      return { result: "booked" as const, bookingId: booking.id };
    },
    { isolationLevel: "Serializable" }
  );
}

/**
 * Wartet maximal `ms` Millisekunden auf das Promise.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

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
  const isGuest = session.metadata?.isGuest === "true";

  if (!courseId) return;

  if (isGuest) {
    // Gäste: per stripeSessionId suchen (kein courseId_userId Unique-Index)
    const existing = await prisma.courseBooking.findFirst({
      where: { stripeSessionId: session.id },
    });
    if (existing && existing.paymentStatus === "pending") {
      await prisma.courseBooking.update({
        where: { id: existing.id },
        data: { paymentStatus: "failed" },
      });
    }
    return;
  }

  const userId = session.metadata?.userId;
  if (!userId) return;

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
