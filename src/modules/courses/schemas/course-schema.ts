/**
 * Course Schema - Validierungsschema für Kurs-Formulare
 *
 * Diese Datei definiert das Zod-Schema zur Validierung von Kursdaten.
 * Es stellt sicher, dass alle erforderlichen Felder korrekt ausgefüllt werden
 * und die Daten den definierten Regeln entsprechen.
 */

import { z } from "zod";

/**
 * Haupt-Validierungsschema für Kurse
 *
 * Dieses Schema validiert:
 * - Grundlegende Kursinformationen (Name, Sportart, Datum, Zeit)
 * - Trainer und Raum-Zuweisungen
 * - Teilnehmerbegrenzungen (1-100 Personen)
 * - Dauerauftrag-Einstellungen mit Häufigkeit und Wochentagen
 */
export const courseSchema = z
  .object({
    // Kursname (Pflichtfeld, min. 1 Zeichen)
    name: z.string().min(1, "Kursname ist erforderlich"),

    // Sportart (Pflichtfeld, z.B. Fußball, Basketball)
    sport: z.string().min(1, "Sportart ist erforderlich"),

    // Kursdatum als String im Format YYYY-MM-DD
    date: z.string().min(1, "Datum ist erforderlich"),

    // Anfangszeit als String im Format HH:MM
    timeFrom: z.string().min(1, "Anfangszeit ist erforderlich"),

    // Endzeit als String im Format HH:MM
    timeTo: z.string().min(1, "Endzeit ist erforderlich"),

    // Array von Trainer-IDs (mindestens ein Trainer erforderlich)
    trainers: z.array(z.string()).min(1, "Mindestens ein Trainer muss ausgewählt werden"),

    // Raum-ID für den Kurs (z.B. "Sporthalle 1")
    room: z.string().min(1, "Raum ist erforderlich"),

    // Rich-Text Beschreibung mit HTML-Inhalt
    description: z.string().min(1, "Beschreibung ist erforderlich"),

    // Maximale Anzahl der Teilnehmer (1-100)
    maxParticipants: z
      .number()
      .min(1, "Mindestens 1 Teilnehmer erforderlich")
      .max(100, "Maximal 100 Teilnehmer erlaubt"),

    // Gibt an, ob der Kurs ein Dauerauftrag ist (regelmäßig wiederkehrend)
    isStandingOrder: z.boolean(),

    // Häufigkeit des Dauerauftrags (täglich, wöchentlich, etc.) - optional
    frequency: z.string().optional(),

    // Ausgewählte Wochentage für individuelle Häufigkeit - optional
    weekdays: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // Validierungsregel: Wenn Dauerauftrag aktiviert ist, muss eine Häufigkeit ausgewählt werden
      if (data.isStandingOrder && !data.frequency) {
        return false;
      }
      return true;
    },
    {
      message: "Häufigkeit ist erforderlich bei Daueraufträgen",
      path: ["frequency"],
    }
  )
  .refine(
    (data) => {
      // Validierungsregel: Bei individueller Häufigkeit müssen Wochentage ausgewählt werden
      if (data.frequency === "custom" && (!data.weekdays || data.weekdays.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Mindestens ein Tag muss ausgewählt werden bei individueller Häufigkeit",
      path: ["weekdays"],
    }
  )
  .refine(
    (data) => {
      // Validierungsregel: Anfangszeit muss vor der Endzeit liegen
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

/**
 * TypeScript-Typ für Kursdaten
 * Wird automatisch aus dem Zod-Schema generiert
 */
export type CourseFormData = z.infer<typeof courseSchema>;
