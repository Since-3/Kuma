import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { stripe, calculatePlatformFeeCents, eurosToCents } from "@/src/lib/stripe";
import { getUserData, isUser } from "@/src/lib/auth/getUser";

/**
 * Erstellt eine Stripe Checkout Session für eine Kurs-Buchung.
 * Geld geht direkt an das Business-Connect-Account (minus Plattform-Fee).
 *
 * Body: { courseId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userData = await getUserData();
    if (!userData) {
      return NextResponse.json(
        { error: "Sie müssen angemeldet sein, um einen Kurs zu buchen" },
        { status: 401 }
      );
    }

    // Nur normale User (role: "user") können Kurse buchen.
    // Manager/Employee haben keine Einträge in der User-Tabelle, daher würde
    // sonst der Foreign-Key-Constraint CourseBooking_userId_fkey im Webhook
    // verletzt werden – und das erst NACHDEM das Geld geflossen ist.
    if (!isUser(userData)) {
      return NextResponse.json(
        {
          error: "Nur Kunden-Accounts können Kurse buchen. Bitte mit einem Nutzer-Konto anmelden.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { courseId?: string };
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId fehlt" }, { status: 400 });
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const priceCents = eurosToCents(course.price);
    const platformFeeCents = calculatePlatformFeeCents(course.price);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // payment_method_types weggelassen → Checkout Sessions nutzen automatisch
      // alle im Stripe Dashboard aktivierten und für diese Session kompatiblen
      // Methoden (Dynamic Payment Methods).
      // Karte/Apple Pay/Google Pay/Link sind sofort verfügbar. PayPal
      // unterstützt kein Stripe Connect und muss über die PayPal Dev API eingerichtet werden
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
          userId: userData.id,
          businessId: course.business.id,
        },
      },
      metadata: {
        courseId: course.id,
        userId: userData.id,
        businessId: course.business.id,
      },
      customer_email: userData.email,
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
