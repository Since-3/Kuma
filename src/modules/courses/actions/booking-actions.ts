/**
 * Booking Actions - Server-seitige Aktionen für Kursbuchungen
 *
 * Diese Datei enthält alle Server Actions für Kursbuchungen.
 * Funktionen umfassen: Kurs buchen, Buchungen abrufen und Status prüfen.
 */

"use server";

import { prisma } from "@/src/lib/prisma";
import { getUserData, isUser } from "@/src/lib/auth/getUser";
import { unstable_cache, revalidatePath, revalidateTag } from "next/cache";

export type UserBooking = {
  bookingId: string;
  courseId: string;
  courseName: string;
  date: string; // ISO
  timeFrom: string;
  timeTo: string;
  roomName: string;
  level: string;
  price: number;
  maxParticipants: number;
  currentParticipants: number;
  coverImage: string | null;
  description: string;
  trainerProfiles: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    pbSrc: string | null;
  }[];
  trainers: string[];
  trainersMap: Record<string, { label: string; pbSrc?: string }>;
  paymentStatus: string;
  isPast: boolean;
};

export async function getUserBookings(): Promise<
  { success: true; bookings: UserBooking[] } | { success: false; error: string }
> {
  const userData = await getUserData();
  if (!userData || !isUser(userData)) {
    return { success: false, error: "Nicht angemeldet." };
  }

  const userId = userData.id;

  const fetchBookings = unstable_cache(
    async () => {
      const bookingsRaw = await prisma.courseBooking.findMany({
        where: { userId },
        select: {
          id: true,
          paymentStatus: true,
          course: {
            select: {
              id: true,
              name: true,
              date: true,
              timeFrom: true,
              timeTo: true,
              room: true,
              trainers: true,
              level: true,
              price: true,
              maxParticipants: true,
              coverImage: true,
              description: true,
              _count: { select: { bookings: { where: { paymentStatus: "paid" } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Collect all room and trainer IDs
      const roomIds = [
        ...new Set(bookingsRaw.map((b) => b.course.room).filter(Boolean)),
      ] as string[];
      const allTrainerIds = new Set<string>();
      for (const b of bookingsRaw) {
        for (const tid of b.course.trainers) allTrainerIds.add(tid);
      }

      const [rooms, trainersData] = await Promise.all([
        roomIds.length > 0
          ? prisma.room.findMany({
              where: { id: { in: roomIds } },
              select: { id: true, name: true },
            })
          : [],
        allTrainerIds.size > 0
          ? prisma.employee.findMany({
              where: { id: { in: Array.from(allTrainerIds) } },
              select: { id: true, firstName: true, lastName: true, pbSrc: true },
            })
          : [],
      ]);

      const roomsMap: Record<string, string> = {};
      for (const r of rooms) roomsMap[r.id] = r.name;

      const trainersMap: Record<string, { label: string; pbSrc?: string }> = {};
      const trainerProfilesMap: Record<
        string,
        { id: string; firstName: string | null; lastName: string | null; pbSrc: string | null }
      > = {};
      for (const t of trainersData) {
        const label = [t.firstName, t.lastName].filter(Boolean).join(" ") || "Trainer";
        trainersMap[t.id] = { label, pbSrc: t.pbSrc ?? undefined };
        trainerProfilesMap[t.id] = {
          id: t.id,
          firstName: t.firstName,
          lastName: t.lastName,
          pbSrc: t.pbSrc,
        };
      }

      const now = new Date();

      return bookingsRaw.map((b) => {
        const courseDate = new Date(b.course.date);
        return {
          bookingId: b.id,
          courseId: b.course.id,
          courseName: b.course.name,
          date: b.course.date.toISOString(),
          timeFrom: b.course.timeFrom,
          timeTo: b.course.timeTo,
          roomName: roomsMap[b.course.room] ?? b.course.room,
          level: b.course.level,
          price: b.course.price,
          maxParticipants: b.course.maxParticipants,
          currentParticipants: b.course._count.bookings,
          coverImage: b.course.coverImage ?? null,
          description: b.course.description,
          trainerProfiles: b.course.trainers.map((tid) => trainerProfilesMap[tid]).filter(Boolean),
          trainers: b.course.trainers,
          trainersMap,
          paymentStatus: b.paymentStatus,
          isPast: courseDate < now,
        } satisfies UserBooking;
      });
    },
    [`user-bookings-${userId}`],
    { tags: [`user-bookings-${userId}`], revalidate: 60 }
  );

  try {
    const bookings = await fetchBookings();
    return { success: true, bookings };
  } catch {
    return { success: false, error: "Buchungen konnten nicht geladen werden." };
  }
}

export async function cancelUserBooking(
  bookingId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const userData = await getUserData();
  if (!userData || !isUser(userData)) {
    return { success: false, error: "Nicht angemeldet." };
  }

  try {
    const booking = await prisma.courseBooking.findUnique({
      where: { id: bookingId },
      select: {
        userId: true,
        paymentStatus: true,
        course: { select: { date: true, businessId: true } },
      },
    });

    if (!booking || booking.userId !== userData.id) {
      return { success: false, error: "Buchung nicht gefunden." };
    }

    if (new Date(booking.course.date) < new Date()) {
      return { success: false, error: "Vergangene Kurse können nicht storniert werden." };
    }

    if (booking.paymentStatus !== "paid") {
      return { success: false, error: "Nur bezahlte Buchungen können storniert werden." };
    }

    await prisma.courseBooking.update({
      where: { id: bookingId },
      data: { paymentStatus: "refunded" },
    });

    revalidatePath("/courses/myCourses");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (revalidateTag as any)(`business-courses-${booking.course.businessId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Stornierung fehlgeschlagen." };
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
  const fetch = unstable_cache(
    async () => {
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
          return { success: false as const, error: "Seite nicht gefunden" };
        }

        return { success: true as const, business };
      } catch (error) {
        console.error("Error fetching business by slug:", error);
        return { success: false as const, error: "Fehler beim Laden" };
      }
    },
    [`business-slug-${slug}`],
    { tags: [`business-slug-${slug}`], revalidate: 3600 }
  );

  return fetch();
}

export async function getPublishedCoursesForBusiness(
  businessId: string,
  options: { from: Date; to: Date }
) {
  const fromKey = options.from.toISOString().slice(0, 10);
  const toKey = options.to.toISOString().slice(0, 10);

  const fetch = unstable_cache(
    async () => _fetchCoursesForBusiness(businessId, options),
    [`business-courses-${businessId}-${fromKey}-${toKey}`],
    { tags: [`business-courses-${businessId}`], revalidate: 30 }
  );

  return fetch();
}

async function _fetchCoursesForBusiness(businessId: string, options: { from: Date; to: Date }) {
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
    const roomIds = [...new Set(courses.map((c) => c.room).filter(Boolean))] as string[];

    const [trainers, rooms] = await Promise.all([
      trainerIds.length > 0
        ? prisma.employee.findMany({
            where: { id: { in: trainerIds } },
            select: { id: true, firstName: true, lastName: true, pbSrc: true },
          })
        : Promise.resolve([]),
      roomIds.length > 0
        ? prisma.room.findMany({
            where: { id: { in: roomIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const trainerMap = Object.fromEntries(trainers.map((t) => [t.id, t]));
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
