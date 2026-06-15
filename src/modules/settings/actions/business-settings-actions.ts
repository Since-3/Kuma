"use server";

import { prisma } from "@/src/lib/prisma";
import { requireManager } from "@/src/lib/auth/getUser";
import { revalidateTag } from "next/cache";

type ActionResult = { success: boolean; error?: string };

export async function updateBusinessInfo(data: {
  businessId: string;
  address: string;
  email: string;
  title: string;
  ustId?: string;
  banking?: string;
}): Promise<ActionResult> {
  try {
    const manager = await requireManager();

    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
      select: { managerId: true },
    });

    if (!business || business.managerId !== manager.id) {
      return { success: false, error: "Nicht berechtigt." };
    }

    if (!data.address.trim() || !data.email.trim() || !data.title.trim()) {
      return { success: false, error: "Bitte alle Pflichtfelder ausfüllen." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: "Ungültige E-Mail-Adresse." };
    }

    await prisma.business.update({
      where: { id: data.businessId },
      data: {
        address: data.address.trim(),
        email: data.email.trim(),
        title: data.title.trim(),
        ustId: data.ustId?.trim() || null,
        banking: data.banking?.trim() || null,
      },
    });

    revalidateTag(`user-data-${manager.email}`);
    return { success: true };
  } catch {
    return { success: false, error: "Fehler beim Speichern der Business-Daten." };
  }
}
