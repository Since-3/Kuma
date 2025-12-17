/**
 * Room Actions - Server-seitige Aktionen für Raumverwaltung
 *
 * Diese Datei enthält alle Server Actions für das Raum-Management-System.
 * Funktionen umfassen: Räume erstellen, abrufen, aktualisieren und löschen.
 * Alle Funktionen sind mit Authentifizierung und Autorisierung geschützt.
 */

"use server";

import { prisma } from "@/src/lib/prisma";
import { getUserData, isManager } from "@/src/lib/auth/getUser";
import { roomSchema, type RoomFormData } from "../schemas/room-schema";
import { revalidatePath } from "next/cache";

/**
 * Erstellt einen neuen Raum in der Datenbank
 *
 * Diese Funktion validiert die Eingabedaten, überprüft die Berechtigungen des Benutzers
 * und erstellt einen neuen Raum. Nur Manager können Räume erstellen.
 *
 * @param data - Die Raumdaten aus dem Formular
 * @returns Ein Objekt mit success-Flag, optionaler roomId und Nachricht oder Fehler
 */
export async function createRoom(data: RoomFormData) {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer angemeldet ist
    if (!userData) {
      return {
        success: false,
        error: "Sie müssen angemeldet sein, um einen Raum zu erstellen",
      };
    }

    // Schritt 3: Überprüfen, ob Benutzer ein Manager ist (nur Manager dürfen Räume erstellen)
    if (!isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Räume erstellen",
      };
    }

    // Schritt 4: Formulardaten mit Zod-Schema validieren
    const validation = roomSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: "Validierungsfehler",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const validatedData = validation.data;

    // Schritt 5: Raum in der Datenbank erstellen
    const room = await prisma.room.create({
      data: {
        name: validatedData.name,
        createdBy: userData.id, // Manager-ID als Ersteller
      },
    });

    // Schritt 6: Next.js Cache für /rooms Seite invalidieren, damit neue Daten angezeigt werden
    revalidatePath("/rooms");

    return {
      success: true,
      roomId: room.id,
      message: "Raum erfolgreich erstellt",
    };
  } catch (error) {
    console.error("Error creating room:", error);
    return {
      success: false,
      error: "Ein Fehler ist beim Erstellen des Raumes aufgetreten",
    };
  }
}

/**
 * Ruft alle Räume ab
 *
 * Diese Funktion gibt alle Räume zurück.
 * Die Räume werden nach Namen aufsteigend sortiert.
 *
 * @returns Ein Objekt mit success-Flag und einem Array von Räumen
 */
export async function getAllRooms() {
  try {
    // Alle Räume aus der Datenbank abrufen
    // Sortiert nach Namen aufsteigend
    const rooms = await prisma.room.findMany({
      orderBy: {
        name: "asc", // Aufsteigende Sortierung nach Name
      },
    });

    return {
      success: true,
      rooms,
    };
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return {
      success: false,
      error: "Fehler beim Laden der Räume",
      rooms: [],
    };
  }
}

/**
 * Ruft alle Räume ab, die vom eingeloggten Manager erstellt wurden
 *
 * Diese Funktion gibt alle Räume zurück, die vom aktuell eingeloggten Manager erstellt wurden.
 *
 * @returns Ein Objekt mit success-Flag und einem Array der Räume des Managers
 */
export async function getMyRooms() {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer angemeldet ist und ein Manager ist
    if (!userData || !isManager(userData)) {
      return {
        success: false,
        error: "Unauthorized",
        rooms: [],
      };
    }

    // Schritt 3: Räume abrufen, die von diesem Manager erstellt wurden
    const rooms = await prisma.room.findMany({
      where: {
        createdBy: userData.id, // Filtere nach Manager-ID
      },
      orderBy: {
        name: "asc", // Sortiere nach Name aufsteigend
      },
    });

    return {
      success: true,
      rooms,
    };
  } catch (error) {
    console.error("Error fetching my rooms:", error);
    return {
      success: false,
      error: "Fehler beim Laden der Räume",
      rooms: [],
    };
  }
}

/**
 * Ruft einen einzelnen Raum nach ID ab
 *
 * Diese Funktion gibt einen Raum zurück, wenn der eingeloggte Manager
 * der Ersteller des Raumes ist.
 *
 * @param roomId - Die eindeutige ID des Raumes
 * @returns Ein Objekt mit success-Flag und dem Raum oder Fehler
 */
export async function getRoomById(roomId: string) {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer ein Manager ist
    if (!userData || !isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Räume bearbeiten",
      };
    }

    // Schritt 3: Raum aus der Datenbank abrufen
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    // Schritt 4: Überprüfen, ob Raum existiert
    if (!room) {
      return {
        success: false,
        error: "Raum nicht gefunden",
      };
    }

    // Schritt 5: Überprüfen, ob der Manager der Besitzer des Raumes ist
    if (room.createdBy !== userData.id) {
      return {
        success: false,
        error: "Sie können nur Ihre eigenen Räume bearbeiten",
      };
    }

    return {
      success: true,
      room,
    };
  } catch (error) {
    console.error("Error fetching room:", error);
    return {
      success: false,
      error: "Fehler beim Laden des Raumes",
    };
  }
}

/**
 * Aktualisiert einen bestehenden Raum
 *
 * Diese Funktion validiert die Eingabedaten, überprüft die Berechtigungen des Benutzers
 * und aktualisiert einen bestehenden Raum. Nur der Manager, der den Raum erstellt hat,
 * kann ihn bearbeiten.
 *
 * @param roomId - Die eindeutige ID des zu aktualisierenden Raumes
 * @param data - Die aktualisierten Raumdaten aus dem Formular
 * @param status - Der Status des Raumes ("draft" für Entwurf oder "published" für veröffentlicht)
 * @returns Ein Objekt mit success-Flag und Nachricht oder Fehler
 */
export async function updateRoom(roomId: string, data: RoomFormData) {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer angemeldet ist
    if (!userData) {
      return {
        success: false,
        error: "Sie müssen angemeldet sein, um einen Raum zu bearbeiten",
      };
    }

    // Schritt 3: Überprüfen, ob Benutzer ein Manager ist
    if (!isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Räume bearbeiten",
      };
    }

    // Schritt 4: Raum aus der Datenbank abrufen
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });

    // Schritt 5: Überprüfen, ob Raum existiert
    if (!existingRoom) {
      return {
        success: false,
        error: "Raum nicht gefunden",
      };
    }

    // Schritt 6: Überprüfen, ob der Manager der Besitzer des Raumes ist
    if (existingRoom.createdBy !== userData.id) {
      return {
        success: false,
        error: "Sie können nur Ihre eigenen Räume bearbeiten",
      };
    }

    // Schritt 7: Formulardaten mit Zod-Schema validieren
    const validation = roomSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: "Validierungsfehler",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const validatedData = validation.data;

    // Schritt 8: Raum in der Datenbank aktualisieren
    await prisma.room.update({
      where: { id: roomId },
      data: {
        name: validatedData.name,
      },
    });

    // Schritt 9: Next.js Cache für /rooms Seite invalidieren
    revalidatePath("/rooms");
    revalidatePath(`/rooms/edit/${roomId}`);

    return {
      success: true,
      message: "Raum erfolgreich aktualisiert",
    };
  } catch (error) {
    console.error("Error updating room:", error);
    return {
      success: false,
      error: "Ein Fehler ist beim Aktualisieren des Raumes aufgetreten",
    };
  }
}

/**
 * Löscht einen Raum aus der Datenbank
 *
 * Diese Funktion löscht einen Raum, überprüft aber vorher:
 * - Ob der Benutzer ein Manager ist
 * - Ob der Raum existiert
 * - Ob der Manager der Besitzer des Raumes ist (Manager können nur eigene Räume löschen)
 *
 * @param roomId - Die eindeutige ID des zu löschenden Raumes
 * @returns Ein Objekt mit success-Flag und Nachricht oder Fehler
 */
export async function deleteRoom(roomId: string) {
  try {
    // Schritt 1: Aktuellen Benutzer abrufen
    const userData = await getUserData();

    // Schritt 2: Überprüfen, ob Benutzer ein Manager ist
    if (!userData || !isManager(userData)) {
      return {
        success: false,
        error: "Nur Manager können Räume löschen",
      };
    }

    // Schritt 3: Raum aus der Datenbank abrufen
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    // Schritt 4: Überprüfen, ob Raum existiert
    if (!room) {
      return {
        success: false,
        error: "Raum nicht gefunden",
      };
    }

    // Schritt 5: Überprüfen, ob der Manager der Besitzer des Raumes ist
    // (Sicherheit: Manager können nur ihre eigenen Räume löschen)
    if (room.createdBy !== userData.id) {
      return {
        success: false,
        error: "Sie können nur Ihre eigenen Räume löschen",
      };
    }

    // Schritt 6: Raum aus der Datenbank löschen
    await prisma.room.delete({
      where: { id: roomId },
    });

    // Schritt 7: Next.js Cache invalidieren, damit gelöschter Raum nicht mehr angezeigt wird
    revalidatePath("/rooms");

    return {
      success: true,
      message: "Raum erfolgreich gelöscht",
    };
  } catch (error) {
    console.error("Error deleting room:", error);
    return {
      success: false,
      error: "Fehler beim Löschen des Raumes",
    };
  }
}
