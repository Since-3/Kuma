/**
 * Booking Actions - Server-seitige Aktionen für Kursbuchungen
 *
 * Diese Datei enthält alle Server Actions für Kursbuchungen.
 * Funktionen umfassen: Kurs buchen, Buchungen abrufen und Status prüfen.
 */

"use server";

import { prisma } from "@/src/lib/prisma";
import { getUserData } from "@/src/lib/auth/getUser";

/**
 * Überprüft, ob ein User bereits für einen Kurs gebucht hat
 *
 * @param courseId - Die eindeutige ID des Kurses
 * @returns Ein Objekt mit success-Flag und isBooked Status
 */
export async function checkUserBookingStatus(courseId: string) {
  try {
    const userData = await getUserData();

    if (!userData) {
      return {
        success: true,
        isBooked: false,
      };
    }

    const booking = await prisma.courseBooking.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: userData.id,
        },
      },
    });

    return {
      success: true,
      isBooked: booking?.paymentStatus === "paid",
    };
  } catch (error) {
    console.error("Error checking booking status:", error);
    return {
      success: false,
      error: "Fehler beim Prüfen des Buchungsstatus",
      isBooked: false,
    };
  }
}

/**
 * Lädt eine kompakte Kurs-Zusammenfassung inkl. Business-Slug.
 * Wird für die Success-Page (Kursdetails anzeigen) und für den Redirect
 * der alten Buchungs-View auf die öffentliche Business-Seite genutzt.
 *
 * @param courseId - Die eindeutige ID des Kurses
 */
export async function getCourseSummaryForConfirmation(courseId: string) {
  try {
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        business: { isPublic: true },
      },
      select: {
        id: true,
        name: true,
        sport: true,
        date: true,
        timeFrom: true,
        timeTo: true,
        price: true,
        room: true,
        business: {
          select: {
            name: true,
            slug: true,
            address: true,
          },
        },
      },
    });

    if (!course) {
      return { success: false as const, error: "Kurs nicht gefunden" };
    }

    return { success: true as const, course };
  } catch (error) {
    console.error("Error fetching course summary:", error);
    return { success: false as const, error: "Fehler beim Laden des Kurses" };
  }
}

export async function getBusinessBySlug(slug: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        address: true,
        email: true,
        title: true,
        slug: true,
        isPublic: true,
      },
    });

    if (!business || !business.isPublic) {
      return { success: false, error: "Seite nicht gefunden" };
    }

    return { success: true, business };
  } catch (error) {
    console.error("Error fetching business by slug:", error);
    return { success: false, error: "Fehler beim Laden" };
  }
}

export async function getPublishedCoursesForBusiness(
  businessId: string,
  options: { from: Date; to: Date }
) {
  try {
    const courses = await prisma.course.findMany({
      where: {
        businessId,
        status: "published",
        date: { gte: options.from, lte: options.to },
      },
      include: {
        _count: { select: { bookings: { where: { paymentStatus: "paid" } } } },
      },
      orderBy: { date: "asc" },
    });

    const trainerIds = [...new Set(courses.flatMap((c) => c.trainers))];
    const trainers =
      trainerIds.length > 0
        ? await prisma.employee.findMany({
            where: { id: { in: trainerIds } },
            select: { id: true, firstName: true, lastName: true, pbSrc: true },
          })
        : [];
    const trainerMap = Object.fromEntries(trainers.map((t) => [t.id, t]));

    const roomIds = [...new Set(courses.map((c) => c.room).filter(Boolean))] as string[];
    const rooms =
      roomIds.length > 0
        ? await prisma.room.findMany({
            where: { id: { in: roomIds } },
            select: { id: true, name: true },
          })
        : [];
    const roomMap = Object.fromEntries(rooms.map((r) => [r.id, r.name]));

    return {
      success: true,
      courses: courses.map((c) => ({
        ...c,
        currentParticipants: c._count.bookings,
        roomName: c.room ? (roomMap[c.room] ?? null) : null,
        trainerProfiles: c.trainers.map((id) => trainerMap[id]).filter(Boolean) as {
          id: string;
          firstName: string | null;
          lastName: string | null;
          pbSrc: string | null;
        }[],
      })),
    };
  } catch (error) {
    console.error("Error fetching courses for business:", error);
    return { success: false, error: "Fehler beim Laden der Kurse", courses: [] };
  }
}
