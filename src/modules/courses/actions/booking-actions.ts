/**
 * Booking Actions - Server-seitige Aktionen für Kursbuchungen
 *
 * Diese Datei enthält alle Server Actions für Kursbuchungen.
 * Funktionen umfassen: Kurs buchen, Buchungen abrufen und Status prüfen.
 */

"use server";

import { prisma } from "@/src/lib/prisma";
import { getUserData } from "@/src/lib/auth/getUser";
import { revalidatePath } from "next/cache";

/**
 * Bucht einen User in einen Kurs ein
 *
 * Diese Funktion überprüft:
 * - Ob der Kurs existiert und veröffentlicht ist
 * - Ob noch Plätze verfügbar sind
 * - Ob der User bereits gebucht hat
 * - Ob der User angemeldet ist
 *
 * @param courseId - Die eindeutige ID des Kurses
 * @returns Ein Objekt mit success-Flag und Nachricht oder Fehler
 */
export async function bookCourse(courseId: string) {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer angemeldet ist
    if (!userData) {
      return {
        success: false,
        error: "Sie müssen angemeldet sein, um einen Kurs zu buchen",
      };
    }

    // Schritt 3: Kurs mit Buchungszähler abrufen
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    // Schritt 4: Überprüfen, ob Kurs existiert
    if (!course) {
      return {
        success: false,
        error: "Kurs nicht gefunden",
      };
    }

    // Schritt 5: Überprüfen, ob Kurs veröffentlicht ist
    if (course.status !== "published") {
      return {
        success: false,
        error: "Dieser Kurs ist nicht verfügbar",
      };
    }

    // Schritt 6: Überprüfen, ob noch Plätze verfügbar sind
    if (course._count.bookings >= course.maxParticipants) {
      return {
        success: false,
        error: "Dieser Kurs ist bereits ausgebucht",
      };
    }

    // Schritt 7: Überprüfen, ob User bereits gebucht hat
    const existingBooking = await prisma.courseBooking.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: userData.id,
        },
      },
    });

    if (existingBooking) {
      return {
        success: false,
        error: "Sie haben sich bereits für diesen Kurs angemeldet",
      };
    }

    // Schritt 8: Buchung erstellen
    await prisma.courseBooking.create({
      data: {
        courseId,
        userId: userData.id,
      },
    });

    // Schritt 9: Cache invalidieren
    revalidatePath("/courses");
    revalidatePath(`/courses/book/${courseId}`);

    return {
      success: true,
      message: "Sie wurden erfolgreich für den Kurs angemeldet",
    };
  } catch (error) {
    console.error("Error booking course:", error);
    return {
      success: false,
      error: "Ein Fehler ist bei der Buchung aufgetreten",
    };
  }
}

/**
 * Ruft einen Kurs mit Buchungsinformationen ab (öffentlich)
 *
 * Diese Funktion gibt Kursinformationen inkl. aktueller Teilnehmerzahl zurück.
 * Sie ist öffentlich zugänglich für die Buchungsseite.
 *
 * @param courseId - Die eindeutige ID des Kurses
 * @returns Ein Objekt mit success-Flag und Kursdaten
 */
export async function getCourseForBooking(courseId: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!course) {
      return {
        success: false,
        error: "Kurs nicht gefunden",
      };
    }

    if (course.status !== "published") {
      return {
        success: false,
        error: "Dieser Kurs ist nicht verfügbar",
      };
    }

    return {
      success: true,
      course: {
        ...course,
        currentParticipants: course._count.bookings,
      },
    };
  } catch (error) {
    console.error("Error fetching course for booking:", error);
    return {
      success: false,
      error: "Fehler beim Laden des Kurses",
    };
  }
}

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
      isBooked: !!booking,
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
        _count: { select: { bookings: true } },
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
