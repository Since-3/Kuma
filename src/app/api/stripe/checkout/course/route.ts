import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { stripe, calculatePlatformFeeCents, eurosToCents } from "@/src/lib/stripe";
import { getUserData, isUser } from "@/src/lib/auth/getUser";

// Simple in-memory rate limiter: max 10 checkout attempts per IP per minute.
// Resets automatically as entries expire — no external dependency needed.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Erstellt eine Stripe Checkout Session für eine Kurs-Buchung.
 * Geld geht direkt an das Business-Connect-Account (minus Plattform-Fee).
 *
 * Auth-Flow  → Body: { courseId: string }
 * Guest-Flow → Body: { courseId: string; guestEmail: string; guestName?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting per IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte kurz und versuche es erneut." },
        { status: 429 }
      );
    }

    // Auth check — always first, Guest-Path only when no session exists
    const userData = await getUserData();

    const body = (await request.json()) as {
      courseId?: string;
      guestEmail?: string;
      guestName?: string;
    };
    const { courseId, guestEmail, guestName } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId fehlt" }, { status: 400 });
    }

    // Determine flow: authenticated user or guest
    const isGuest = !userData;

    if (!isGuest) {
      // Nur normale User (role: "user") können Kurse buchen.
      // Manager/Employee haben keine Einträge in der User-Tabelle, daher würde
      // sonst der Foreign-Key-Constraint CourseBooking_userId_fkey im Webhook
      // verletzt werden – und das erst NACHDEM das Geld geflossen ist.
      if (!isUser(userData)) {
        return NextResponse.json(
          {
            error:
              "Nur Kunden-Accounts können Kurse buchen. Bitte mit einem Nutzer-Konto anmelden.",
          },
          { status: 403 }
        );
      }
    } else {
      // Guest flow: guestEmail required
      if (!guestEmail || !EMAIL_RE.test(guestEmail)) {
        return NextResponse.json(
          { error: "Bitte eine gültige E-Mail-Adresse angeben.", isGuestRequired: true },
          { status: 401 }
        );
      }
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        // Nur bezahlte Buchungen belegen einen Platz (failed/refunded zählen nicht).
        _count: { select: { bookings: { where: { paymentStatus: "paid" } } } },
        business: {
          select: {
            id: true,
            name: true,
            stripeAccountId: true,
            stripeAccountStatus: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
    }

    if (course.status !== "published") {
      return NextResponse.json({ error: "Dieser Kurs ist nicht verfügbar" }, { status: 400 });
    }

    // Grober Vor-Filter: spart unnötige Stripe-Sessions wenn offensichtlich voll.
    // Die verbindliche Kapazitätsprüfung passiert atomar im Webhook (siehe #101).
    if (course._count.bookings >= course.maxParticipants) {
      return NextResponse.json({ error: "Dieser Kurs ist bereits ausgebucht" }, { status: 400 });
    }

    if (!course.business) {
      return NextResponse.json(
        { error: "Dieser Kurs hat keinen zugeordneten Anbieter" },
        { status: 400 }
      );
    }

    if (!course.business.stripeAccountId || course.business.stripeAccountStatus !== "active") {
      return NextResponse.json(
        {
          error: "Dieser Anbieter hat noch keine Zahlung eingerichtet. Bitte später versuchen.",
        },
        { status: 400 }
      );
    }

    // Duplicate-booking check only for authenticated users (guests have no unique constraint)
    if (!isGuest && userData) {
      const existingBooking = await prisma.courseBooking.findUnique({
        where: {
          courseId_userId: { courseId, userId: userData.id },
        },
      });

      if (existingBooking && existingBooking.paymentStatus === "paid") {
        return NextResponse.json(
          { error: "Sie haben sich bereits für diesen Kurs angemeldet" },
          { status: 400 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const priceCents = eurosToCents(course.price);
    const platformFeeCents = calculatePlatformFeeCents(course.price);

    const customerEmail = isGuest ? guestEmail! : userData!.email;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: course.name,
              description: `${course.business.name} - ${new Date(course.date).toLocaleDateString("de-DE")} ${course.timeFrom}`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: course.business.stripeAccountId,
        },
        metadata: {
          courseId: course.id,
          userId: isGuest ? "" : userData!.id,
          businessId: course.business.id,
          isGuest: isGuest ? "true" : "false",
          guestEmail: isGuest ? guestEmail! : "",
          guestName: isGuest ? (guestName ?? "") : "",
        },
      },
      metadata: {
        courseId: course.id,
        userId: isGuest ? "" : userData!.id,
        businessId: course.business.id,
        isGuest: isGuest ? "true" : "false",
        guestEmail: isGuest ? guestEmail! : "",
        guestName: isGuest ? (guestName ?? "") : "",
      },
      customer_email: customerEmail,
      success_url: `${baseUrl}/courses/book/${course.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/courses/book/${course.id}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Fehler beim Erstellen der Checkout-Session",
      },
      { status: 500 }
    );
  }
}
