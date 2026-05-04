import { PrismaClient } from "@prisma/client";

export async function generateUniqueSlug(name: string, prisma: PrismaClient): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 60);
  let slug = base || "business";
  let counter = 2;
  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}
