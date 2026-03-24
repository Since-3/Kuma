import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { prisma } from "@/src/lib/prisma";

/**
 * POST /api/upload/avatar
 * Öffentliche Route für den Bild-Upload während des Onboardings.
 * Nutzt den Service Role Key um RLS zu bypassen.
 * Erwartet: multipart/form-data mit "file" und "token" Feldern.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const token = formData.get("token") as string | null;

    if (!file || !token) {
      return NextResponse.json({ error: "Datei und Token erforderlich" }, { status: 400 });
    }

    // Token serverseitig validieren
    const employee = await prisma.employee.findUnique({
      where: { onboardingToken: token },
      select: { id: true, isOnboarded: true, onboardingTokenExpiry: true },
    });

    if (!employee || employee.isOnboarded) {
      return NextResponse.json({ error: "Ungültiger Token" }, { status: 401 });
    }

    if (employee.onboardingTokenExpiry && employee.onboardingTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Token abgelaufen" }, { status: 401 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Nur Bilddateien erlaubt" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Datei darf maximal 5MB groß sein" }, { status: 400 });
    }

    // Pfad serverseitig generieren — kein Client-Input
    const extension =
      file.name
        .split(".")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    const safePath = `employees/${employee.id}/${Date.now()}.${extension}`;

    const adminClient = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await adminClient.storage.from("avatars").upload(safePath, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from("avatars").getPublicUrl(data.path);

    return NextResponse.json({ publicUrl }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/upload/avatar:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
