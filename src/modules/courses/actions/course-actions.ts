/**
 * Course Actions - Server-seitige Aktionen für Kursverwaltung
 *
 * Diese Datei enthält alle Server Actions für das Kurs-Management-System.
 * Funktionen umfassen: Kurse erstellen, abrufen, aktualisieren und löschen.
 * Alle Funktionen sind mit Authentifizierung und Autorisierung geschützt.
 */

"use server";

import { prisma } from "@/src/lib/prisma";
import { getUserData, isManager } from "@/src/lib/auth/getUser";
import { courseSchema, type CourseFormData } from "../schemas/course-schema";
import { revalidatePath } from "next/cache";

/**
 * Erstellt einen neuen Kurs in der Datenbank
 *
 * Diese Funktion validiert die Eingabedaten, überprüft die Berechtigungen des Benutzers
 * und erstellt einen neuen Kurs. Nur Manager können Kurse erstellen.
 *
 * @param data - Die Kursdaten aus dem Formular
 * @param status - Der Status des Kurses ("draft" für Entwurf oder "published" für veröffentlicht)
 * @returns Ein Objekt mit success-Flag, optionaler courseId und Nachricht oder Fehler
 */
export async function createCourse(data: CourseFormData, status: "draft" | "published") {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer angemeldet ist
    if (!userData) {
      return {
        success: false,
        error: "Sie müssen angemeldet sein, um einen Kurs zu erstellen",
      };
    }

    // Schritt 3: Überprüfen, ob Benutzer ein Manager ist (nur Manager dürfen Kurse erstellen)
    if (!isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Kurse erstellen",
      };
    }

    // Schritt 4: Formulardaten mit Zod-Schema validieren
    const validation = courseSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: "Validierungsfehler",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const validatedData = validation.data;

    // Schritt 5: Kurs in der Datenbank erstellen
    const course = await prisma.course.create({
      data: {
        name: validatedData.name,
        sport: validatedData.sport,
        date: new Date(validatedData.date), // String zu Date konvertieren
        time: validatedData.time,
        trainers: validatedData.trainers,
        room: validatedData.room,
        description: validatedData.description,
        maxParticipants: validatedData.maxParticipants,
        isStandingOrder: validatedData.isStandingOrder,
        frequency: validatedData.frequency || null,
        weekdays: validatedData.weekdays || [],
        status, // "draft" oder "published"
        createdBy: userData.id, // Manager-ID als Ersteller
      },
    });

    // Schritt 6: Next.js Cache für /courses Seite invalidieren, damit neue Daten angezeigt werden
    revalidatePath("/courses");

    return {
      success: true,
      courseId: course.id,
      message:
        status === "published"
          ? "Kurs erfolgreich veröffentlicht"
          : "Entwurf erfolgreich gespeichert",
    };
  } catch (error) {
    console.error("Error creating course:", error);
    return {
      success: false,
      error: "Ein Fehler ist beim Erstellen des Kurses aufgetreten",
    };
  }
}

/**
 * Ruft alle veröffentlichten Kurse ab
 *
 * Diese Funktion gibt alle Kurse zurück, die den Status "published" haben.
 * Die Kurse werden nach Datum aufsteigend sortiert.
 *
 * @returns Ein Objekt mit success-Flag und einem Array von Kursen
 */
export async function getAllCourses() {
  try {
    // Alle veröffentlichten Kurse aus der Datenbank abrufen
    // Sortiert nach Datum aufsteigend (älteste zuerst)
    const courses = await prisma.course.findMany({
      where: {
        status: "published", // Nur veröffentlichte Kurse
      },
      orderBy: {
        date: "asc", // Aufsteigende Sortierung nach Datum
      },
    });

    return {
      success: true,
      courses,
    };
  } catch (error) {
    console.error("Error fetching courses:", error);
    return {
      success: false,
      error: "Fehler beim Laden der Kurse",
      courses: [],
    };
  }
}

/**
 * Ruft alle Kurse des angemeldeten Managers ab
 *
 * Diese Funktion gibt alle Kurse zurück, die vom aktuell angemeldeten Manager
 * erstellt wurden, unabhängig vom Status (Entwurf oder veröffentlicht).
 * Die Kurse werden nach Erstellungsdatum absteigend sortiert (neueste zuerst).
 *
 * @returns Ein Objekt mit success-Flag und einem Array von Kursen des Managers
 */
export async function getMyCourses() {
  try {
    // Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Überprüfen, ob Benutzer angemeldet und ein Manager ist
    if (!userData || !isManager(userData)) {
      return {
        success: false,
        error: "Unauthorized",
        courses: [],
      };
    }

    // Alle Kurse abrufen, die von diesem Manager erstellt wurden
    const courses = await prisma.course.findMany({
      where: {
        createdBy: userData.id, // Filtert nach Manager-ID
      },
      orderBy: {
        createdAt: "desc", // Neueste Kurse zuerst
      },
    });

    return {
      success: true,
      courses,
    };
  } catch (error) {
    console.error("Error fetching my courses:", error);
    return {
      success: false,
      error: "Fehler beim Laden der Kurse",
      courses: [],
    };
  }
}

/**
 * Löscht einen Kurs aus der Datenbank
 *
 * Diese Funktion löscht einen Kurs, überprüft aber vorher:
 * - Ob der Benutzer ein Manager ist
 * - Ob der Kurs existiert
 * - Ob der Manager der Besitzer des Kurses ist (Manager können nur eigene Kurse löschen)
 *
 * @param courseId - Die eindeutige ID des zu löschenden Kurses
 * @returns Ein Objekt mit success-Flag und Nachricht oder Fehler
 */
export async function deleteCourse(courseId: string) {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer ein Manager ist
    if (!userData || !isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Kurse löschen",
      };
    }

    // Schritt 3: Kurs aus der Datenbank abrufen
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    // Schritt 4: Überprüfen, ob Kurs existiert
    if (!course) {
      return {
        success: false,
        error: "Kurs nicht gefunden",
      };
    }

    // Schritt 5: Überprüfen, ob der Manager der Besitzer des Kurses ist
    // (Sicherheit: Manager können nur ihre eigenen Kurse löschen)
    if (course.createdBy !== userData.id) {
      return {
        success: false,
        error: "Sie können nur Ihre eigenen Kurse löschen",
      };
    }

    // Schritt 6: Kurs aus der Datenbank löschen
    await prisma.course.delete({
      where: { id: courseId },
    });

    // Schritt 7: Next.js Cache invalidieren, damit gelöschter Kurs nicht mehr angezeigt wird
    revalidatePath("/courses");

    return {
      success: true,
      message: "Kurs erfolgreich gelöscht",
    };
  } catch (error) {
    console.error("Error deleting course:", error);
    return {
      success: false,
      error: "Fehler beim Löschen des Kurses",
    };
  }
}
