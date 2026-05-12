import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { getUserData, isManager, isEmployee } from "@/src/lib/auth/getUser";

export async function POST(request: Request) {
  try {
    const userData = await getUserData();
    const canUpload =
      userData &&
      (isManager(userData) || (isEmployee(userData) && userData.permissions.courses.edit));

    if (!canUpload) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Datei erforderlich" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Nur Bilddateien erlaubt" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Datei darf maximal 5MB groß sein" }, { status: 400 });
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    const safePath = `courses/${Date.now()}.${extension}`;

    const adminClient = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await adminClient.storage.from("avatars").upload(safePath, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from("avatars").getPublicUrl(data.path);

    return NextResponse.json({ publicUrl }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/upload/course-image:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
