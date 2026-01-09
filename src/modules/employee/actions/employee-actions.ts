/**
 * Employee Actions - Server-seitige Aktionen für Mitarbeiterverwaltung
 *
 * Diese Datei enthält alle Server Actions für das Mitarbeiter-Management-System.
 * Funktionen umfassen: Mitarbeiter erstellen, abrufen, aktualisieren und löschen.
 * Alle Funktionen sind mit Authentifizierung und Autorisierung geschützt.
 */

"use server";

import { prisma } from "@/src/lib/prisma";
import { getUserData, isManager } from "@/src/lib/auth/getUser";
import { employeeSchema, type EmployeeFormData } from "../schemas/employee-schema";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

/**
 * Generiert einen sicheren Onboarding-Token
 *
 * @returns Ein zufälliger 32-Byte Token als Hex-String
 */
function generateOnboardingToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Erstellt einen neuen Mitarbeiter in der Datenbank
 *
 * Diese Funktion validiert die Eingabedaten, überprüft die Berechtigungen des Benutzers
 * und erstellt einen neuen Mitarbeiter. Der Mitarbeiter erhält einen Onboarding-Token,
 * der später für den Onboarding-Prozess verwendet wird.
 * Nur Manager können Mitarbeiter erstellen.
 *
 * @param data - Die Mitarbeiterdaten aus dem Formular
 * @param status - Der Status des Mitarbeiters ("draft" für Entwurf oder "published" für veröffentlicht)
 * @returns Ein Objekt mit success-Flag, optionaler employeeId, onboardingToken und Nachricht oder Fehler
 */
export async function createEmployee(data: EmployeeFormData, status: "draft" | "published") {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer angemeldet ist
    if (!userData) {
      return {
        success: false,
        error: "Sie müssen angemeldet sein, um einen Mitarbeiter zu erstellen",
      };
    }

    // Schritt 3: Überprüfen, ob Benutzer ein Manager ist (nur Manager dürfen Mitarbeiter erstellen)
    if (!isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Mitarbeiter erstellen",
      };
    }

    // Schritt 4: Formulardaten mit Zod-Schema validieren
    const validation = employeeSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: "Validierungsfehler",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const validatedData = validation.data;

    // Schritt 5: Überprüfen, ob E-Mail bereits existiert
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmployee) {
      return {
        success: false,
        error: "Ein Mitarbeiter mit dieser E-Mail-Adresse existiert bereits",
      };
    }

    // Schritt 6: Onboarding-Token generieren (nur wenn veröffentlicht)
    let onboardingToken: string | null = null;
    let onboardingTokenExpiry: Date | null = null;

    if (status === "published") {
      onboardingToken = generateOnboardingToken();
      // Token ist 7 Tage gültig
      onboardingTokenExpiry = new Date();
      onboardingTokenExpiry.setDate(onboardingTokenExpiry.getDate() + 7);
    }

    // Schritt 7: Mitarbeiter in der Datenbank erstellen
    const employee = await prisma.employee.create({
      data: {
        email: validatedData.email,
        roles: validatedData.roles,
        locations: validatedData.locations || [],
        permissions: validatedData.permissions,
        status: status,
        isOnboarded: false,
        onboardingToken,
        onboardingTokenExpiry,
        createdBy: userData.id, // Manager-ID als Ersteller
      },
    });

    // Schritt 8: Next.js Cache für /employee Seite invalidieren, damit neue Daten angezeigt werden
    revalidatePath("/employee");

    return {
      success: true,
      employeeId: employee.id,
      onboardingToken: onboardingToken || undefined,
      message:
        status === "published"
          ? "Mitarbeiter erfolgreich veröffentlicht. Onboarding-Link wurde generiert."
          : "Entwurf erfolgreich gespeichert",
    };
  } catch (error) {
    console.error("Error creating employee:", error);
    return {
      success: false,
      error: "Ein Fehler ist beim Erstellen des Mitarbeiters aufgetreten",
    };
  }
}

/**
 * Ruft alle Mitarbeiter ab, die vom eingeloggten Manager erstellt wurden
 *
 * Diese Funktion gibt alle Mitarbeiter zurück, die vom aktuellen Manager erstellt wurden,
 * unabhängig vom Status (draft oder published).
 *
 * @returns Ein Objekt mit success-Flag und einem Array von Mitarbeitern
 */
export async function getMyEmployees() {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer ein Manager ist
    if (!userData || !isManager(userData)) {
      return {
        success: false,
        error: "Unauthorized",
        employees: [],
      };
    }

    // Schritt 3: Mitarbeiter aus der Datenbank abrufen
    const employees = await prisma.employee.findMany({
      where: {
        createdBy: userData.id, // Filter nach Manager ID
      },
      orderBy: {
        createdAt: "desc", // Neueste zuerst
      },
    });

    return {
      success: true,
      employees,
    };
  } catch (error) {
    console.error("Error fetching employees:", error);
    return {
      success: false,
      error: "Fehler beim Laden der Mitarbeiter",
      employees: [],
    };
  }
}

/**
 * Ruft einen einzelnen Mitarbeiter nach ID ab
 *
 * Diese Funktion gibt einen Mitarbeiter zurück, wenn der eingeloggte Manager
 * der Ersteller des Mitarbeiters ist.
 *
 * @param employeeId - Die eindeutige ID des Mitarbeiters
 * @returns Ein Objekt mit success-Flag und dem Mitarbeiter oder Fehler
 */
export async function getEmployeeById(employeeId: string) {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer ein Manager ist
    if (!userData || !isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Mitarbeiter bearbeiten",
      };
    }

    // Schritt 3: Mitarbeiter aus der Datenbank abrufen
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    // Schritt 4: Überprüfen, ob Mitarbeiter existiert
    if (!employee) {
      return {
        success: false,
        error: "Mitarbeiter nicht gefunden",
      };
    }

    // Schritt 5: Überprüfen, ob der Manager der Besitzer des Mitarbeiters ist
    if (employee.createdBy !== userData.id) {
      return {
        success: false,
        error: "Sie können nur Ihre eigenen Mitarbeiter bearbeiten",
      };
    }

    return {
      success: true,
      employee,
    };
  } catch (error) {
    console.error("Error fetching employee:", error);
    return {
      success: false,
      error: "Fehler beim Laden des Mitarbeiters",
    };
  }
}

/**
 * Aktualisiert einen bestehenden Mitarbeiter
 *
 * Diese Funktion validiert die Eingabedaten, überprüft die Berechtigungen des Benutzers
 * und aktualisiert einen bestehenden Mitarbeiter. Nur der Manager, der den Mitarbeiter erstellt hat,
 * kann ihn bearbeiten.
 *
 * @param employeeId - Die eindeutige ID des zu aktualisierenden Mitarbeiters
 * @param data - Die aktualisierten Mitarbeiterdaten aus dem Formular
 * @param status - Der Status des Mitarbeiters ("draft" für Entwurf oder "published" für veröffentlicht)
 * @returns Ein Objekt mit success-Flag und Nachricht oder Fehler
 */
export async function updateEmployee(
  employeeId: string,
  data: EmployeeFormData,
  status: "draft" | "published"
) {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer angemeldet ist
    if (!userData) {
      return {
        success: false,
        error: "Sie müssen angemeldet sein, um einen Mitarbeiter zu bearbeiten",
      };
    }

    // Schritt 3: Überprüfen, ob Benutzer ein Manager ist
    if (!isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Mitarbeiter bearbeiten",
      };
    }

    // Schritt 4: Mitarbeiter aus der Datenbank abrufen
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    // Schritt 5: Überprüfen, ob Mitarbeiter existiert
    if (!existingEmployee) {
      return {
        success: false,
        error: "Mitarbeiter nicht gefunden",
      };
    }

    // Schritt 6: Überprüfen, ob der Manager der Besitzer des Mitarbeiters ist
    if (existingEmployee.createdBy !== userData.id) {
      return {
        success: false,
        error: "Sie können nur Ihre eigenen Mitarbeiter bearbeiten",
      };
    }

    // Schritt 7: Formulardaten mit Zod-Schema validieren
    const validation = employeeSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: "Validierungsfehler",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const validatedData = validation.data;

    // Schritt 8: Onboarding-Token generieren, falls noch nicht vorhanden und veröffentlicht
    let onboardingToken = existingEmployee.onboardingToken;
    let onboardingTokenExpiry = existingEmployee.onboardingTokenExpiry;

    if (status === "published" && !existingEmployee.onboardingToken) {
      onboardingToken = generateOnboardingToken();
      onboardingTokenExpiry = new Date();
      onboardingTokenExpiry.setDate(onboardingTokenExpiry.getDate() + 7);
    }

    // Schritt 9: Mitarbeiter in der Datenbank aktualisieren
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        email: validatedData.email,
        roles: validatedData.roles,
        locations: validatedData.locations || [],
        permissions: validatedData.permissions,
        status,
        onboardingToken,
        onboardingTokenExpiry,
      },
    });

    // Schritt 10: Next.js Cache invalidieren
    revalidatePath("/employee");
    revalidatePath(`/employee/edit/${employeeId}`);

    return {
      success: true,
      message:
        status === "published"
          ? "Mitarbeiter erfolgreich aktualisiert und veröffentlicht"
          : "Entwurf erfolgreich aktualisiert",
    };
  } catch (error) {
    console.error("Error updating employee:", error);
    return {
      success: false,
      error: "Ein Fehler ist beim Aktualisieren des Mitarbeiters aufgetreten",
    };
  }
}

/**
 * Ruft alle verwendeten Rollen des Managers ab
 *
 * Diese Funktion extrahiert alle Rollen aus den Mitarbeitern des aktuellen Managers,
 * dedupliziert sie und gibt sie zurück. Dies ermöglicht es, custom Rollen
 * wiederzuverwenden ohne eine separate Rollen-Tabelle zu benötigen.
 *
 * @returns Ein Objekt mit success-Flag und einem Array von Rollen im Format {value, label}
 */
export async function getMyEmployeeRoles() {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer ein Manager ist
    if (!userData || !isManager(userData)) {
      return {
        success: false,
        error: "Unauthorized",
        roles: [],
      };
    }

    // Schritt 3: Alle Mitarbeiter des Managers abrufen (nur roles Feld)
    const employees = await prisma.employee.findMany({
      where: {
        createdBy: userData.id,
      },
      select: {
        roles: true,
      },
    });

    // Schritt 4: Alle Rollen extrahieren und deduplizieren
    const allRoles = employees.flatMap((employee) => employee.roles);
    const uniqueRoles = [...new Set(allRoles)];

    // Schritt 5: In das Format {value, label} konvertieren
    const formattedRoles = uniqueRoles.map((role) => ({
      value: role,
      label: role.charAt(0).toUpperCase() + role.slice(1), // Capitalize first letter
    }));

    return {
      success: true,
      roles: formattedRoles,
    };
  } catch (error) {
    console.error("Error fetching employee roles:", error);
    return {
      success: false,
      error: "Fehler beim Laden der Rollen",
      roles: [],
    };
  }
}

/**
 * Löscht einen Mitarbeiter aus der Datenbank
 *
 * Diese Funktion löscht einen Mitarbeiter, überprüft aber vorher:
 * - Ob der Benutzer ein Manager ist
 * - Ob der Mitarbeiter existiert
 * - Ob der Manager der Besitzer des Mitarbeiters ist (Manager können nur eigene Mitarbeiter löschen)
 *
 * @param employeeId - Die eindeutige ID des zu löschenden Mitarbeiters
 * @returns Ein Objekt mit success-Flag und Nachricht oder Fehler
 */
export async function deleteEmployee(employeeId: string) {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer ein Manager ist
    if (!userData || !isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Mitarbeiter löschen",
      };
    }

    // Schritt 3: Mitarbeiter aus der Datenbank abrufen
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    // Schritt 4: Überprüfen, ob Mitarbeiter existiert
    if (!employee) {
      return {
        success: false,
        error: "Mitarbeiter nicht gefunden",
      };
    }

    // Schritt 5: Überprüfen, ob der Manager der Besitzer des Mitarbeiters ist
    if (employee.createdBy !== userData.id) {
      return {
        success: false,
        error: "Sie können nur Ihre eigenen Mitarbeiter löschen",
      };
    }

    // Schritt 6: Mitarbeiter aus der Datenbank löschen
    await prisma.employee.delete({
      where: { id: employeeId },
    });

    // Schritt 7: Next.js Cache invalidieren
    revalidatePath("/employee");

    return {
      success: true,
      message: "Mitarbeiter erfolgreich gelöscht",
    };
  } catch (error) {
    console.error("Error deleting employee:", error);
    return {
      success: false,
      error: "Fehler beim Löschen des Mitarbeiters",
    };
  }
}
