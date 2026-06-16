"use server";

import { prisma } from "@/src/lib/prisma";
import { requireManager } from "@/src/lib/auth/getUser";

export type KundeRow = {
  id: string;
  name: string;
  email: string;
  telefon: string;
  status: "Bezahlt" | "Storniert" | "Ausstehend";
  isGuest: boolean;
};

function mapPaymentStatus(paymentStatus: string): KundeRow["status"] {
  if (paymentStatus === "paid") return "Bezahlt";
  if (paymentStatus === "refunded") return "Storniert";
  return "Ausstehend";
}

export async function getKunden(): Promise<
  { success: true; kunden: KundeRow[] } | { success: false; error: string }
> {
  const manager = await requireManager();
  const businessIds = manager.businesses.map((b) => b.id);

  try {
    if (businessIds.length === 0) {
      return { success: true, kunden: [] };
    }

    const bookings = await prisma.courseBooking.findMany({
      where: {
        course: { businessId: { in: businessIds } },
      },
      select: {
        paymentStatus: true,
        user: {
          select: { id: true, name: true, email: true, tel: true },
        },
        guestLead: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Deduplizieren: pro User-ID bzw. GuestLead-ID nur den letzten Status
    const seen = new Map<string, KundeRow>();

    for (const booking of bookings) {
      if (booking.user) {
        const key = `user:${booking.user.id}`;
        if (!seen.has(key)) {
          seen.set(key, {
            id: booking.user.id,
            name: booking.user.name ?? booking.user.email,
            email: booking.user.email,
            telefon: booking.user.tel ?? "–",
            status: mapPaymentStatus(booking.paymentStatus),
            isGuest: false,
          });
        }
      } else if (booking.guestLead) {
        const key = `guest:${booking.guestLead.id}`;
        if (!seen.has(key)) {
          seen.set(key, {
            id: booking.guestLead.id,
            name: booking.guestLead.name ?? booking.guestLead.email,
            email: booking.guestLead.email,
            telefon: "–",
            status: mapPaymentStatus(booking.paymentStatus),
            isGuest: true,
          });
        }
      }
    }

    return { success: true, kunden: Array.from(seen.values()) };
  } catch {
    return { success: false, error: "Kunden konnten nicht geladen werden." };
  }
}
