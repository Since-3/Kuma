"use server";

import { prisma } from "@/src/lib/prisma";
import { requireManager } from "@/src/lib/auth/getUser";
import { unstable_cache } from "next/cache";

export type KundeBooking = {
  bookingId: string;
  courseId: string;
  courseName: string;
  date: string; // ISO
  timeFrom: string;
  timeTo: string;
  roomName: string;
  // Felder für den PublicCourseCard-Dialog
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
  // Für die Card-Anzeige
  trainers: string[];
  trainersMap: Record<string, { label: string; pbSrc?: string }>;
  paymentStatus: string;
  isPast: boolean;
};

export type KundeDetail = {
  id: string;
  name: string;
  email: string;
  telefon: string;
  gender: string | null;
  birthday: Date | null;
  pbSrc: string | null;
  createdAt: Date | null;
  bookings: KundeBooking[];
};

export async function getKundeDetail(
  kundeId: string
): Promise<{ success: true; kunde: KundeDetail } | { success: false; error: string }> {
  const manager = await requireManager();
  const businessIds = manager.businesses.map((b) => b.id);

  const fetchDetail = unstable_cache(
    async () => {
      // Alles parallel: User+Bookings und Räume des Managers
      const [userWithBookings, allRooms] = await Promise.all([
        prisma.user.findUnique({
          where: { id: kundeId },
          select: {
            id: true,
            name: true,
            email: true,
            tel: true,
            gender: true,
            birthday: true,
            pbSrc: true,
            createdAt: true,
            courseBookings: {
              where: {
                course: { businessId: { in: businessIds } },
              },
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
                    // Dialog-Felder
                    level: true,
                    price: true,
                    maxParticipants: true,
                    coverImage: true,
                    description: true,
                    // Anzahl aller Buchungen für diesen Kurs
                    _count: { select: { bookings: true } },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        }),
        prisma.room.findMany({
          where: { createdBy: manager.id },
          select: { id: true, name: true },
        }),
      ]);

      if (!userWithBookings) return null;

      // Raum-ID → Name
      const roomsMap: Record<string, string> = {};
      for (const r of allRooms) roomsMap[r.id] = r.name;

      // Alle Trainer-IDs sammeln
      const allTrainerIds = new Set<string>();
      for (const b of userWithBookings.courseBookings) {
        for (const tid of b.course.trainers) allTrainerIds.add(tid);
      }

      // Trainer-Daten laden (ein Query für alle)
      const trainersData = await prisma.employee.findMany({
        where: { id: { in: Array.from(allTrainerIds) } },
        select: { id: true, firstName: true, lastName: true, pbSrc: true },
      });

      // trainersMap für die Card-Avatare (id → label+pbSrc)
      const trainersMap: Record<string, { label: string; pbSrc?: string }> = {};
      for (const t of trainersData) {
        const label = [t.firstName, t.lastName].filter(Boolean).join(" ") || "Trainer";
        trainersMap[t.id] = { label, pbSrc: t.pbSrc ?? undefined };
      }

      // trainerProfiles-Map für den Dialog (id → volles Profil)
      const trainerProfilesMap: Record<
        string,
        { id: string; firstName: string | null; lastName: string | null; pbSrc: string | null }
      > = {};
      for (const t of trainersData) {
        trainerProfilesMap[t.id] = {
          id: t.id,
          firstName: t.firstName,
          lastName: t.lastName,
          pbSrc: t.pbSrc,
        };
      }

      const now = new Date();

      const bookings: KundeBooking[] = userWithBookings.courseBookings.map((b) => {
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
        };
      });

      return {
        id: userWithBookings.id,
        name: userWithBookings.name ?? userWithBookings.email,
        email: userWithBookings.email,
        telefon: userWithBookings.tel ?? "–",
        gender: userWithBookings.gender,
        birthday: userWithBookings.birthday,
        pbSrc: userWithBookings.pbSrc,
        createdAt: userWithBookings.createdAt,
        bookings,
      } satisfies KundeDetail;
    },
    [`kunde-detail-${kundeId}-${manager.id}`],
    {
      tags: [`kunde-detail-${kundeId}`, `manager-${manager.id}`],
      revalidate: 60,
    }
  );

  try {
    const kunde = await fetchDetail();
    if (!kunde) return { success: false, error: "Kunde nicht gefunden." };
    return { success: true, kunde };
  } catch {
    return { success: false, error: "Kundendetails konnten nicht geladen werden." };
  }
}
