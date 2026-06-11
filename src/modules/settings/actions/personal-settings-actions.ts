"use server";

import { prisma } from "@/src/lib/prisma";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { requireAuthWithData, isManager, isEmployee, isUser } from "@/src/lib/auth/getUser";
import { revalidateTag } from "next/cache";

type ActionResult = { success: boolean; error?: string };

function revalidateUserCache(email: string) {
  (revalidateTag as (tag: string, type: "max") => void)(`user-data-${email}`, "max");
}

export async function updateProfileInfo(data: {
  firstName?: string;
  lastName?: string;
  name?: string;
  tel?: string;
  gender?: string;
}): Promise<ActionResult> {
  try {
    const userData = await requireAuthWithData();

    if (isManager(userData)) {
      await prisma.manager.update({
        where: { id: userData.id },
        data: {
          firstName: data.firstName ?? userData.firstName,
          lastName: data.lastName ?? userData.lastName,
          tel: data.tel ?? userData.tel,
        },
      });
    } else if (isEmployee(userData)) {
      await prisma.employee.update({
        where: { id: userData.id },
        data: {
          firstName: data.firstName ?? userData.firstName,
          lastName: data.lastName ?? userData.lastName,
        },
      });
    } else if (isUser(userData)) {
      await prisma.user.update({
        where: { id: userData.id },
        data: {
          name: data.name ?? userData.name,
          tel: data.tel,
          gender: data.gender,
        },
      });
    }

    revalidateUserCache(userData.email);
    return { success: true };
  } catch {
    return { success: false, error: "Fehler beim Aktualisieren der Profildaten." };
  }
}

export async function updateAddress(data: {
  street: string;
  plz: string;
  city: string;
}): Promise<ActionResult> {
  try {
    const userData = await requireAuthWithData();

    if (!isUser(userData)) {
      return { success: false, error: "Adresse kann nur von regulären Nutzern geändert werden." };
    }

    await prisma.user.update({
      where: { id: userData.id },
      data: {
        street: data.street,
        plz: data.plz,
        city: data.city,
      },
    });

    revalidateUserCache(userData.email);
    return { success: true };
  } catch {
    return { success: false, error: "Fehler beim Aktualisieren der Adresse." };
  }
}

export async function updateEmail(newEmail: string): Promise<ActionResult> {
  try {
    await requireAuthWithData();

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return { success: false, error: "Ungültige E-Mail-Adresse." };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${baseUrl}/auth/callback?next=/settings/personal&email_confirmed=true` }
    );

    if (authError) {
      return { success: false, error: authError.message };
    }

    // Prisma is updated in /auth/callback after the user confirms the link.
    return { success: true };
  } catch {
    return { success: false, error: "Fehler beim Aktualisieren der E-Mail." };
  }
}

export async function syncEmailAfterConfirmation(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) {
      return { success: false, error: "Nicht authentifiziert." };
    }

    const { id, email: newEmail } = user;

    const prismaUser = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (prismaUser) {
      await prisma.user.update({ where: { id }, data: { email: newEmail } });
    } else {
      const manager = await prisma.manager.findUnique({ where: { id }, select: { id: true } });
      if (manager) {
        await prisma.manager.update({ where: { id }, data: { email: newEmail } });
      } else {
        await prisma.employee.updateMany({ where: { id }, data: { email: newEmail } });
      }
    }

    revalidateUserCache(newEmail);
    return { success: true };
  } catch {
    return { success: false, error: "Fehler beim Synchronisieren der E-Mail." };
  }
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    if (newPassword.length < 8) {
      return { success: false, error: "Das neue Passwort muss mindestens 8 Zeichen lang sein." };
    }

    const userData = await requireAuthWithData();
    const supabase = await createClient();

    // Re-authenticate to verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, error: "Das aktuelle Passwort ist falsch." };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Fehler beim Aktualisieren des Passworts." };
  }
}

export async function updateAvatar(formData: FormData): Promise<ActionResult & { url?: string }> {
  try {
    const userData = await requireAuthWithData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return { success: false, error: "Keine Datei übergeben." };
    }

    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Nur Bilddateien erlaubt." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Datei darf maximal 5 MB groß sein." };
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";

    const folder = isManager(userData) ? "managers" : isEmployee(userData) ? "employees" : "users";
    const safePath = `${folder}/${userData.id}/${Date.now()}.${extension}`;

    const adminClient = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await adminClient.storage.from("avatars").upload(safePath, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from("avatars").getPublicUrl(data.path);

    if (isManager(userData)) {
      await prisma.manager.update({ where: { id: userData.id }, data: { pbSrc: publicUrl } });
    } else if (isEmployee(userData)) {
      await prisma.employee.update({ where: { id: userData.id }, data: { pbSrc: publicUrl } });
    } else if (isUser(userData)) {
      await prisma.user.update({ where: { id: userData.id }, data: { pbSrc: publicUrl } });
    }

    revalidateUserCache(userData.email);
    return { success: true, url: publicUrl };
  } catch {
    return { success: false, error: "Fehler beim Hochladen des Profilbilds." };
  }
}
