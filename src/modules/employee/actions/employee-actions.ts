/**
 * Employee Actions - Server-seitige Aktionen für Mitarbeiterverwaltung
 *
 * Diese Datei enthält alle Server Actions für das Mitarbeiter-Management-System.
 * Funktionen umfassen: Mitarbeiter erstellen, abrufen, aktualisieren und löschen.
 * Alle Funktionen sind mit Authentifizierung und Autorisierung geschützt.
 */

"use server";

import { prisma } from "@/src/lib/prisma";
import { getUserData, isManager, isEmployee } from "@/src/lib/auth/getUser";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { employeeSchema, type EmployeeFormData } from "../schemas/employee-schema";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { sendMail } from "@/src/lib/mail/nodemailer";
import { generateOnboardingEmail } from "@/src/lib/mail/templates/employee-onboarding";
import { generateOnboardingCompleteEmail } from "@/src/lib/mail/templates/onboarding-complete";

/**
 * Generiert einen sicheren Onboarding-Token
 *
 * @returns Ein zufälliger 32-Byte Token als Hex-String
 */
function generateOnboardingToken(): string {
  return randomBytes(32).toString("hex");
}

type PermissionGroup = { view: boolean; create: boolean; edit: boolean; delete: boolean };
type PermissionsObj = {
  employees: PermissionGroup;
  courses: PermissionGroup;
  rooms: PermissionGroup;
};

/**
 * Begrenzt die zu speichernden Berechtigungen auf das, was der Aufrufer selbst besitzt.
 * Verhindert Privilege-Escalation: ein Employee kann nur Rechte vergeben, die er selbst hat.
 */
function clampPermissions(requested: PermissionsObj, ceiling: PermissionsObj): PermissionsObj {
  const clamp = (req: PermissionGroup, ceil: PermissionGroup): PermissionGroup => ({
    view: req.view && ceil.view,
    create: req.create && ceil.create,
    edit: req.edit && ceil.edit,
    delete: req.delete && ceil.delete,
  });
  return {
    employees: clamp(requested.employees, ceiling.employees),
    courses: clamp(requested.courses, ceiling.courses),
    rooms: clamp(requested.rooms, ceiling.rooms),
  };
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

    // Schritt 3: Manager oder Employee mit Berechtigung
    const canManageEmployees =
      isManager(userData) || (isEmployee(userData) && userData.permissions.employees.create);
    if (!canManageEmployees) {
      return {
        success: false,
        error: "Keine Berechtigung zum Erstellen von Mitarbeitern",
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

    // Schritt 7: Manager-ID ermitteln (Employee erbt createdBy vom eigenen Datensatz)
    let managerId = userData.id;
    if (isEmployee(userData)) {
      const selfRecord = await prisma.employee.findUnique({ where: { email: userData.email } });
      managerId = selfRecord?.createdBy ?? userData.id;
    }

    // Schritt 8: Berechtigungen auf Caller-Ceiling begrenzen (Privilege-Escalation verhindern)
    const finalPermissions = isEmployee(userData)
      ? clampPermissions(validatedData.permissions, userData.permissions)
      : validatedData.permissions;

    // Schritt 9: Mitarbeiter in der Datenbank erstellen
    const employee = await prisma.employee.create({
      data: {
        email: validatedData.email,
        roles: validatedData.roles,
        locations: validatedData.locations || [],
        permissions: finalPermissions,
        status: status,
        isOnboarded: false,
        onboardingToken,
        onboardingTokenExpiry,
        createdBy: managerId,
      },
    });

    // Schritt 8: E-Mail versenden wenn veröffentlicht
    if (status === "published" && onboardingToken) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const onboardingUrl = `${baseUrl}/employee/onboarding/${onboardingToken}`;

      const { subject, html, text } = generateOnboardingEmail({
        email: validatedData.email,
        onboardingUrl,
        companyName: process.env.COMPANY_NAME || "S3 Kuma",
      });

      // E-Mail asynchron versenden (nicht auf Antwort warten)
      sendMail({
        to: validatedData.email,
        subject,
        html,
        text,
      }).catch((error) => {
        console.error("Fehler beim E-Mail-Versand:", error);
        // E-Mail-Fehler wird nicht an den Benutzer weitergegeben
        // Der Mitarbeiter wurde trotzdem erstellt
      });
    }

    // Schritt 9: Next.js Cache für /employee Seite invalidieren, damit neue Daten angezeigt werden
    revalidatePath("/employee");

    return {
      success: true,
      employeeId: employee.id,
      onboardingToken: onboardingToken || undefined,
      message:
        status === "published"
          ? "Mitarbeiter erfolgreich veröffentlicht. Onboarding-E-Mail wurde versendet."
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
 * Ruft alle Trainer (Mitarbeiter mit Rolle "trainer") ab, die vom eingeloggten Manager erstellt wurden
 *
 * @returns Ein Objekt mit success-Flag und einem Array von Trainern im Format {value, label}
 */
export async function getMyTrainers() {
  try {
    const userData = await getUserData();

    if (
      !userData ||
      (!isManager(userData) && !(isEmployee(userData) && userData.permissions.employees.view))
    ) {
      return {
        success: false,
        error: "Unauthorized",
        trainers: [],
      };
    }

    let managerId = userData.id;
    if (isEmployee(userData)) {
      const selfRecord = await prisma.employee.findUnique({ where: { email: userData.email } });
      managerId = selfRecord?.createdBy ?? userData.id;
    }

    const employees = await prisma.employee.findMany({
      where: {
        createdBy: managerId,
        roles: { has: "trainer" },
        isOnboarded: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        pbSrc: true,
      },
      orderBy: { firstName: "asc" },
    });

    const trainers = employees.map((e) => ({
      value: e.id,
      label: e.firstName && e.lastName ? `${e.firstName} ${e.lastName}` : e.email,
      pbSrc: e.pbSrc ?? undefined,
    }));

    return { success: true, trainers };
  } catch (error) {
    console.error("Error fetching trainers:", error);
    return {
      success: false,
      error: "Fehler beim Laden der Trainer",
      trainers: [],
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

    // Schritt 2: Überprüfen, ob Benutzer ein Manager oder Employee mit Berechtigung ist
    if (
      !userData ||
      (!isManager(userData) && !(isEmployee(userData) && userData.permissions.employees.view))
    ) {
      return {
        success: false,
        error: "Unauthorized",
        employees: [],
      };
    }

    // Schritt 3: Mitarbeiter aus der Datenbank abrufen
    let whereClause: Record<string, unknown>;
    if (isManager(userData)) {
      // Manager sieht alle Mitarbeiter unter seiner ID
      whereClause = { createdBy: userData.id };
    } else {
      // Employee: eigene Manager-ID ermitteln, dann alle unter diesem Manager anzeigen (außer sich selbst)
      const selfRecord = await prisma.employee.findUnique({ where: { email: userData.email } });
      const managerId = selfRecord?.createdBy;
      whereClause = { createdBy: managerId, NOT: { email: userData.email } };
    }
    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
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

    // Schritt 2: Überprüfen, ob Benutzer ein Manager oder Employee mit Berechtigung ist
    if (
      !userData ||
      (!isManager(userData) && !(isEmployee(userData) && userData.permissions.employees.view))
    ) {
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

    // Schritt 4b: Employee darf eigenen Account nicht bearbeiten
    if (isEmployee(userData) && employee.email === userData.email) {
      return {
        success: false,
        error: "Sie können Ihren eigenen Account nicht bearbeiten",
      };
    }

    // Schritt 5: Überprüfen, ob der Manager der Besitzer des Mitarbeiters ist
    if (isManager(userData) && employee.createdBy !== userData.id) {
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

    // Schritt 3: Überprüfen, ob Benutzer ein Manager oder Employee mit Berechtigung ist
    const canManageEmployees =
      isManager(userData) || (isEmployee(userData) && userData.permissions.employees.edit);
    if (!canManageEmployees) {
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

    // Schritt 5b: Employee darf eigenen Account nicht bearbeiten
    if (isEmployee(userData) && existingEmployee.email === userData.email) {
      return {
        success: false,
        error: "Sie können Ihren eigenen Account nicht bearbeiten",
      };
    }

    // Schritt 6: Überprüfen, ob der Benutzer der Besitzer des Mitarbeiters ist
    let ownerManagerId = userData.id;
    if (isEmployee(userData)) {
      const selfRecord = await prisma.employee.findUnique({ where: { email: userData.email } });
      ownerManagerId = selfRecord?.createdBy ?? userData.id;
    }
    if (existingEmployee.createdBy !== ownerManagerId) {
      return {
        success: false,
        error: "Sie können nur Mitarbeiter Ihres Managers bearbeiten",
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
    let shouldSendEmail = false;

    if (status === "published" && !existingEmployee.onboardingToken) {
      onboardingToken = generateOnboardingToken();
      onboardingTokenExpiry = new Date();
      onboardingTokenExpiry.setDate(onboardingTokenExpiry.getDate() + 7);
      shouldSendEmail = true; // E-Mail nur senden wenn neuer Token generiert wurde
    }

    // Schritt 9: Berechtigungen auf Caller-Ceiling begrenzen (Privilege-Escalation verhindern)
    const finalPermissions = isEmployee(userData)
      ? clampPermissions(validatedData.permissions, userData.permissions)
      : validatedData.permissions;

    // Schritt 10: Mitarbeiter in der Datenbank aktualisieren
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        email: validatedData.email,
        roles: validatedData.roles,
        locations: validatedData.locations || [],
        permissions: finalPermissions,
        status,
        onboardingToken,
        onboardingTokenExpiry,
      },
    });

    // Schritt 10: E-Mail versenden wenn neuer Token generiert wurde
    if (shouldSendEmail && onboardingToken) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const onboardingUrl = `${baseUrl}/employee/onboarding/${onboardingToken}`;

      const { subject, html, text } = generateOnboardingEmail({
        email: validatedData.email,
        onboardingUrl,
        companyName: process.env.COMPANY_NAME || "S3 Kuma",
      });

      // E-Mail asynchron versenden (nicht auf Antwort warten)
      sendMail({
        to: validatedData.email,
        subject,
        html,
        text,
      }).catch((error) => {
        console.error("Fehler beim E-Mail-Versand:", error);
        // E-Mail-Fehler wird nicht an den Benutzer weitergegeben
      });
    }

    // Schritt 11: Next.js Cache invalidieren
    revalidatePath("/employee");
    revalidatePath(`/employee/edit/${employeeId}`);

    return {
      success: true,
      message:
        status === "published"
          ? shouldSendEmail
            ? "Mitarbeiter erfolgreich aktualisiert. Onboarding-E-Mail wurde versendet."
            : "Mitarbeiter erfolgreich aktualisiert und veröffentlicht"
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

    // Schritt 2: Manager oder Employee mit Berechtigung
    if (
      !userData ||
      (!isManager(userData) && !(isEmployee(userData) && userData.permissions.employees.view))
    ) {
      return {
        success: false,
        error: "Unauthorized",
        roles: [],
      };
    }

    // Schritt 3: Effektive Manager-ID ermitteln
    let managerId = userData.id;
    if (isEmployee(userData)) {
      const selfRecord = await prisma.employee.findUnique({ where: { email: userData.email } });
      managerId = selfRecord?.createdBy ?? userData.id;
    }

    // Schritt 4: Alle Mitarbeiter des Managers abrufen (nur roles Feld)
    const employees = await prisma.employee.findMany({
      where: {
        createdBy: managerId,
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

    // Schritt 2: Überprüfen, ob Benutzer ein Manager oder Employee mit Berechtigung ist
    if (
      !userData ||
      (!isManager(userData) && !(isEmployee(userData) && userData.permissions.employees.delete))
    ) {
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

    // Schritt 4b: Employee darf eigenen Account nicht löschen
    if (isEmployee(userData) && employee.email === userData.email) {
      return {
        success: false,
        error: "Sie können Ihren eigenen Account nicht löschen",
      };
    }

    // Schritt 5: Überprüfen, ob der Benutzer der Besitzer des Mitarbeiters ist
    let ownerManagerId = userData.id;
    if (isEmployee(userData)) {
      const selfRecord = await prisma.employee.findUnique({ where: { email: userData.email } });
      ownerManagerId = selfRecord?.createdBy ?? userData.id;
    }
    if (employee.createdBy !== ownerManagerId) {
      return {
        success: false,
        error: "Sie können nur Mitarbeiter Ihres Managers löschen",
      };
    }

    // Schritt 6: Mitarbeiter aus der Datenbank löschen
    await prisma.employee.delete({
      where: { id: employeeId },
    });

    // Schritt 7: Supabase Auth User löschen (erzwingt automatisches Ausloggen)
    if (employee.isOnboarded) {
      try {
        const adminClient = createAdminClient();
        const { data: authUsers } = await adminClient.auth.admin.listUsers();
        const authUser = authUsers?.users.find((u) => u.email === employee.email);
        if (authUser) {
          await adminClient.auth.admin.deleteUser(authUser.id);
        }
      } catch (err) {
        // Auth-Löschung schlägt fehl wenn SERVICE_ROLE_KEY fehlt — DB ist bereits gelöscht
        console.error("Supabase Auth User konnte nicht gelöscht werden:", err);
      }
    }

    // Schritt 8: Next.js Cache invalidieren
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

/**
 * Ruft einen Mitarbeiter anhand des Onboarding-Tokens ab (öffentlich, kein Login nötig)
 */
export async function getEmployeeByOnboardingToken(token: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { onboardingToken: token },
    });

    if (!employee) {
      return { success: false, error: "Ungültiger Onboarding-Link" };
    }

    if (employee.isOnboarded) {
      return { success: false, error: "Onboarding wurde bereits abgeschlossen" };
    }

    if (employee.onboardingTokenExpiry && employee.onboardingTokenExpiry < new Date()) {
      return { success: false, error: "Dieser Onboarding-Link ist abgelaufen" };
    }

    return { success: true, employee };
  } catch (error) {
    console.error("Error fetching employee by token:", error);
    return { success: false, error: "Fehler beim Laden der Mitarbeiterdaten" };
  }
}

/**
 * Schließt das Onboarding eines Mitarbeiters ab und erstellt einen Supabase-Account
 */
export async function completeEmployeeOnboarding(
  token: string,
  data: {
    firstName: string;
    lastName: string;
    tel: string;
    password: string;
    gender: string;
    qualification: string;
    pbSrc?: string;
  }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { onboardingToken: token },
    });

    if (!employee) {
      return { success: false, error: "Ungültiger Onboarding-Link" };
    }

    // Supabase Account über API Route erstellen
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/auth/register/employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        email: employee.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        tel: data.tel,
        gender: data.gender,
        qualification: data.qualification,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      return { success: false, error: result.error || "Registrierung fehlgeschlagen" };
    }

    // Mitarbeiter atomisch als onboarded markieren — verhindert TOCTOU race condition
    const updated = await prisma.employee.updateMany({
      where: {
        onboardingToken: token,
        isOnboarded: false,
        OR: [{ onboardingTokenExpiry: null }, { onboardingTokenExpiry: { gte: new Date() } }],
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        qualification: data.qualification,
        pbSrc: data.pbSrc ?? null,
        isOnboarded: true,
        onboardingToken: null,
        onboardingTokenExpiry: null,
      },
    });

    if (updated.count === 0) {
      return {
        success: false,
        error: "Onboarding wurde bereits abgeschlossen oder der Link ist abgelaufen",
      };
    }

    // Manager-Bestätigungs-E-Mail senden
    if (employee.createdBy) {
      const manager = await prisma.manager.findUnique({
        where: { id: employee.createdBy },
        select: { email: true, firstName: true, lastName: true },
      });

      if (manager) {
        const { subject, html, text } = generateOnboardingCompleteEmail({
          managerName: `${manager.firstName} ${manager.lastName}`,
          employeeFirstName: data.firstName,
          employeeLastName: data.lastName,
          employeeEmail: employee.email,
          companyName: process.env.COMPANY_NAME || "S3 Kuma",
        });

        sendMail({ to: manager.email, subject, html, text }).catch((error) => {
          console.error("Fehler beim Senden der Manager-Benachrichtigung:", error);
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: "Ein Fehler ist aufgetreten" };
  }
}
