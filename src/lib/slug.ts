import { PrismaClient } from "@prisma/client";

export async function generateUniqueSlug(name: string, prisma: PrismaClient): Promise<string> {
  const normalized = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 60);
  const base = normalized || "business";
  let slug = base;
  let counter = 2;
  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}
