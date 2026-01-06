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
import { Prisma } from "@prisma/client";

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
        timeFrom: validatedData.timeFrom,
        timeTo: validatedData.timeTo,
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
 * Fetches all courses created by the logged-in manager
 *
 * This function returns all courses created by the currently logged-in manager,
 * regardless of status (draft or published). Supports optional date range filtering
 * to implement efficient loading for large datasets.
 *
 * @param options - Optional filtering parameters
 * @param options.dateFrom - Start date for filtering (inclusive)
 * @param options.dateTo - End date for filtering (inclusive)
 * @returns An object with success flag and an array of the manager's courses
 */
export async function getMyCourses(options?: { dateFrom?: Date; dateTo?: Date }) {
  try {
    // Step 1: Get current user
    const userData = await getUserData();

    // Step 2: Check if user is logged in and is a manager
    if (!userData || !isManager(userData)) {
      return {
        success: false,
        error: "Unauthorized",
        courses: [],
      };
    }

    // Step 3: Build the where clause with optional date filtering
    const whereClause: Prisma.CourseWhereInput = {
      createdBy: userData.id, // Filter by manager ID
    };

    // Add date range filter if provided
    if (options?.dateFrom || options?.dateTo) {
      whereClause.date = {};

      if (options.dateFrom) {
        // Filter courses from this date onwards (inclusive)
        whereClause.date.gte = options.dateFrom;
      }

      if (options.dateTo) {
        // Filter courses up to this date (inclusive)
        whereClause.date.lte = options.dateTo;
      }
    }

    // Step 4: Fetch courses created by this manager with optional date filtering
    const courses = await prisma.course.findMany({
      where: whereClause,
      orderBy: {
        date: "asc", // Sort by course date ascending (oldest first)
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
 * Ruft einen einzelnen Kurs nach ID ab
 *
 * Diese Funktion gibt einen Kurs zurück, wenn der eingeloggte Manager
 * der Ersteller des Kurses ist.
 *
 * @param courseId - Die eindeutige ID des Kurses
 * @returns Ein Objekt mit success-Flag und dem Kurs oder Fehler
 */
export async function getCourseById(courseId: string) {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer ein Manager ist
    if (!userData || !isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Kurse bearbeiten",
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
    if (course.createdBy !== userData.id) {
      return {
        success: false,
        error: "Sie können nur Ihre eigenen Kurse bearbeiten",
      };
    }

    return {
      success: true,
      course,
    };
  } catch (error) {
    console.error("Error fetching course:", error);
    return {
      success: false,
      error: "Fehler beim Laden des Kurses",
    };
  }
}

/**
 * Aktualisiert einen bestehenden Kurs
 *
 * Diese Funktion validiert die Eingabedaten, überprüft die Berechtigungen des Benutzers
 * und aktualisiert einen bestehenden Kurs. Nur der Manager, der den Kurs erstellt hat,
 * kann ihn bearbeiten.
 *
 * @param courseId - Die eindeutige ID des zu aktualisierenden Kurses
 * @param data - Die aktualisierten Kursdaten aus dem Formular
 * @param status - Der Status des Kurses ("draft" für Entwurf oder "published" für veröffentlicht)
 * @returns Ein Objekt mit success-Flag und Nachricht oder Fehler
 */
export async function updateCourse(
  courseId: string,
  data: CourseFormData,
  status: "draft" | "published"
) {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer angemeldet ist
    if (!userData) {
      return {
        success: false,
        error: "Sie müssen angemeldet sein, um einen Kurs zu bearbeiten",
      };
    }

    // Schritt 3: Überprüfen, ob Benutzer ein Manager ist
    if (!isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Kurse bearbeiten",
      };
    }

    // Schritt 4: Kurs aus der Datenbank abrufen
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    // Schritt 5: Überprüfen, ob Kurs existiert
    if (!existingCourse) {
      return {
        success: false,
        error: "Kurs nicht gefunden",
      };
    }

    // Schritt 6: Überprüfen, ob der Manager der Besitzer des Kurses ist
    if (existingCourse.createdBy !== userData.id) {
      return {
        success: false,
        error: "Sie können nur Ihre eigenen Kurse bearbeiten",
      };
    }

    // Schritt 7: Formulardaten mit Zod-Schema validieren
    const validation = courseSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: "Validierungsfehler",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const validatedData = validation.data;

    // Schritt 8: Kurs in der Datenbank aktualisieren
    await prisma.course.update({
      where: { id: courseId },
      data: {
        name: validatedData.name,
        sport: validatedData.sport,
        date: new Date(validatedData.date),
        timeFrom: validatedData.timeFrom,
        timeTo: validatedData.timeTo,
        trainers: validatedData.trainers,
        room: validatedData.room,
        description: validatedData.description,
        maxParticipants: validatedData.maxParticipants,
        isStandingOrder: validatedData.isStandingOrder,
        frequency: validatedData.frequency || null,
        weekdays: validatedData.weekdays || [],
        status,
      },
    });

    // Schritt 9: Next.js Cache für /courses Seite invalidieren
    revalidatePath("/courses");
    revalidatePath(`/courses/edit/${courseId}`);

    return {
      success: true,
      message:
        status === "published"
          ? "Kurs erfolgreich aktualisiert und veröffentlicht"
          : "Entwurf erfolgreich aktualisiert",
    };
  } catch (error) {
    console.error("Error updating course:", error);
    return {
      success: false,
      error: "Ein Fehler ist beim Aktualisieren des Kurses aufgetreten",
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
