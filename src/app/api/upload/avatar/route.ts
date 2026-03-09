import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

/**
 * POST /api/upload/avatar
 * Öffentliche Route für den Bild-Upload während des Onboardings.
 * Nutzt den Service Role Key um RLS zu bypassen.
 * Erwartet: multipart/form-data mit "file" und "path" Feldern.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const path = formData.get("path") as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: "Datei und Pfad erforderlich" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Nur Bilddateien erlaubt" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Datei darf maximal 5MB groß sein" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await adminClient.storage.from("avatars").upload(path, buffer, {
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
