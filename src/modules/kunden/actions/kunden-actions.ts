"use server";

import { prisma } from "@/src/lib/prisma";
import { requireManager } from "@/src/lib/auth/getUser";

export type KundeRow = {
  id: string;
  name: string;
  email: string;
  telefon: string;
  status: "Bezahlt" | "Storniert" | "Ausstehend";
};

function mapPaymentStatus(paymentStatus: string): KundeRow["status"] {
  if (paymentStatus === "paid") return "Bezahlt";
  if (paymentStatus === "refunded") return "Storniert";
  return "Ausstehend";
}

export async function getKunden(): Promise<
  { success: true; kunden: KundeRow[] } | { success: false; error: string }
> {
  try {
    const manager = await requireManager();
    const businessIds = manager.businesses.map((b) => b.id);

    if (businessIds.length === 0) {
      return { success: true, kunden: [] };
    }

    // Alle Bookings für Kurse die zu diesem Manager gehören, gruppiert nach User
    const bookings = await prisma.courseBooking.findMany({
      where: {
        course: { businessId: { in: businessIds } },
      },
      select: {
        paymentStatus: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            tel: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Pro User nur den letzten (relevantesten) Status behalten
    const seen = new Map<string, KundeRow>();
    for (const booking of bookings) {
      if (!seen.has(booking.user.id)) {
        seen.set(booking.user.id, {
          id: booking.user.id,
          name: booking.user.name ?? booking.user.email,
          email: booking.user.email,
          telefon: booking.user.tel ?? "–",
          status: mapPaymentStatus(booking.paymentStatus),
        });
      }
    }

    return { success: true, kunden: Array.from(seen.values()) };
  } catch {
    return { success: false, error: "Kunden konnten nicht geladen werden." };
  }
}
