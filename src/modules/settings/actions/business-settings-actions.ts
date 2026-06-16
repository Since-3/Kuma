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

    const email = data.email.trim();

    if (!data.address.trim() || !email || !data.title.trim()) {
      return { success: false, error: "Bitte alle Pflichtfelder ausfüllen." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Ungültige E-Mail-Adresse." };
    }

    const updated = await prisma.business.update({
      where: { id: data.businessId },
      data: {
        address: data.address.trim(),
        email,
        title: data.title.trim(),
        ustId: data.ustId?.trim() || null,
        banking: data.banking?.trim() || null,
      },
      select: { slug: true },
    });

    (revalidateTag as (tag: string, type: "max") => void)(`user-data-${manager.email}`, "max");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (updated.slug) (revalidateTag as any)(`business-slug-${updated.slug}`);
    return { success: true };
  } catch {
    return { success: false, error: "Fehler beim Speichern der Business-Daten." };
  }
}
