// app/api/auth/register/route.ts
import { createClient } from "@/src/lib/supabase/server";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, birthday, plz, city, street, houseNumber, gender } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    const existingManager = await prisma.manager.findUnique({
      where: { email },
    });

    if (existingManager) {
      return NextResponse.json(
        { error: "Ein Manager kann nicht gleichzeitig ein User sein" },
        { status: 409 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Dieser Nutzer existiert bereits." }, { status: 409 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`,
        data: {
          name,
          gender,
        },
      },
    });

    if (error) {
      console.error("❌ Supabase Auth Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const supabaseUser = data.user;
    if (!supabaseUser) {
      return NextResponse.json({ error: "User konnte nicht erstellt werden" }, { status: 500 });
    }

    const newUser = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        name,
        email,
        birthday: birthday ? new Date(birthday) : null,
        plz,
        city,
        street,
        houseNumber,
        gender,
      },
    });

    // Gast-Buchungen mit derselben E-Mail auf den neuen Account übertragen.
    // GuestLead-Einträge mit dieser Mail suchen und deren Buchungen auf userId setzen.
    try {
      const guestLeads = await prisma.guestLead.findMany({
        where: { email },
        select: { id: true },
      });

      if (guestLeads.length > 0) {
        const guestLeadIds = guestLeads.map((g) => g.id);

        // Nur Buchungen übertragen die noch keinen User haben und paid/pending sind
        // (failed/refunded sind nicht mehr relevant)
        await prisma.courseBooking.updateMany({
          where: {
            guestLeadId: { in: guestLeadIds },
            userId: null,
            paymentStatus: { in: ["paid", "pending"] },
          },
          data: {
            userId: newUser.id,
            guestLeadId: null,
          },
        });
      }
    } catch (mergeError) {
      // Nicht-fatal: User wurde erfolgreich angelegt, Merge kann manuell nachgeholt werden
      console.error("Gast-Buchungen konnten nicht übertragen werden:", mergeError);
    }

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/auth/register:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
