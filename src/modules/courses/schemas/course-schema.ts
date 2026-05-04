import { z } from "zod";

// Basis-Schema mit allen Feldern optional — für Entwürfe
export const courseSchema = z
  .object({
    name: z.string().min(1, "Kursname ist erforderlich").optional().or(z.literal("")),
    sport: z.array(z.string()).optional(),
    level: z.string().optional(),
    date: z.string().optional().or(z.literal("")),
    timeFrom: z.string().optional().or(z.literal("")),
    timeTo: z.string().optional().or(z.literal("")),
    trainers: z.array(z.string()).optional(),
    room: z.string().optional().or(z.literal("")),
    description: z.string().optional(),
    maxParticipants: z.number().max(100).optional(),
    price: z.number().max(9999.99).optional(),
    isStandingOrder: z.boolean(),
    frequency: z.string().optional(),
    weekdays: z.array(z.string()).optional(),
    businessId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.timeFrom && data.timeTo && data.timeFrom >= data.timeTo) {
        return false;
      }
      return true;
    },
    {
      message: "Endzeit muss nach der Anfangszeit liegen",
      path: ["timeTo"],
    }
  );

// Strenges Schema für veröffentlichte Kurse — alle Pflichtfelder erforderlich
export const publishedCourseSchema = z
  .object({
    name: z.string().min(1, "Kursname ist erforderlich"),
    sport: z.array(z.string()).min(1, "Mindestens eine Sportart ist erforderlich"),
    level: z.string().optional(),
    date: z.string().min(1, "Datum ist erforderlich"),
    timeFrom: z.string().min(1, "Anfangszeit ist erforderlich"),
    timeTo: z.string().min(1, "Endzeit ist erforderlich"),
    trainers: z.array(z.string()).min(1, "Mindestens ein Trainer muss ausgewählt werden"),
    room: z.string().min(1, "Raum ist erforderlich"),
    description: z.string().optional(),
    maxParticipants: z
      .number()
      .min(1, "Mindestens 1 Teilnehmer erforderlich")
      .max(100, "Maximal 100 Teilnehmer erlaubt"),
    price: z
      .number()
      .min(0, "Preis muss eine gültige positive Zahl sein")
      .max(9999.99, "Preis darf maximal 9.999,99 € betragen"),
    isStandingOrder: z.boolean(),
    frequency: z.string().optional(),
    weekdays: z.array(z.string()).optional(),
    businessId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isStandingOrder && !data.frequency) return false;
      return true;
    },
    { message: "Häufigkeit ist erforderlich bei Daueraufträgen", path: ["frequency"] }
  )
  .refine(
    (data) => {
      if (data.frequency === "custom" && (!data.weekdays || data.weekdays.length === 0))
        return false;
      return true;
    },
    {
      message: "Mindestens ein Tag muss ausgewählt werden bei individueller Häufigkeit",
      path: ["weekdays"],
    }
  )
  .refine(
    (data) => {
      if (data.timeFrom && data.timeTo && data.timeFrom >= data.timeTo) return false;
      return true;
    },
    { message: "Endzeit muss nach der Anfangszeit liegen", path: ["timeTo"] }
  );

export type CourseFormData = z.infer<typeof courseSchema>;
