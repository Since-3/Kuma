/**
 * Employee Schema - Validierungsschema für Mitarbeiter-Formulare
 *
 * Diese Datei definiert das Zod-Schema zur Validierung von Mitarbeiterdaten.
 * Es stellt sicher, dass alle erforderlichen Felder korrekt ausgefüllt werden.
 */

import { z } from "zod";

/**
 * Haupt-Validierungsschema für Mitarbeiter
 *
 * Dieses Schema validiert:
 * - E-Mail-Adresse des Mitarbeiters
 * - Rollen/Status des Mitarbeiters
 * - Standort-Zugriffe (einzeln oder mehrere)
 * - Administrationsrechte
 */
export const employeeSchema = z
  .object({
    // E-Mail (Pflichtfeld, muss gültige E-Mail sein)
    email: z.string().email("Gültige E-Mail-Adresse erforderlich"),

    // Array von Rollen (mindestens eine Rolle erforderlich)
    roles: z.array(z.string()).min(1, "Mindestens eine Rolle muss ausgewählt werden"),

    // Gibt an, ob der Mitarbeiter für mehrere Standorte zuständig ist
    isMultipleLocation: z.boolean(),

    // Array von Standort-IDs - optional
    locations: z.array(z.string()).optional(),

    // Administrationsrechte
    permissions: z.object({
      // Berechtigung zum Anzeigen/Verwalten von Kursen
      canCreateCourses: z.boolean(),
      // Berechtigung zum Anzeigen/Verwalten von Mitarbeitern
      canCreateEmployees: z.boolean(),
    }),
  })
  .refine(
    (data) => {
      // Validierungsregel: Wenn mehrere Standorte aktiviert sind, muss mindestens ein Standort ausgewählt werden
      if (data.isMultipleLocation && (!data.locations || data.locations.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Mindestens ein Standort muss ausgewählt werden",
      path: ["locations"],
    }
  );

/**
 * TypeScript-Typ für Mitarbeiterdaten
 * Wird automatisch aus dem Zod-Schema generiert
 */
export type EmployeeFormData = z.infer<typeof employeeSchema>;
