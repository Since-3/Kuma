// app/api/auth/register/admin/route.ts
import { createClient } from "@/src/lib/supabase/server";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      tel,
      plz,
      city,
      street,
      companyName,
      companyPlace,
      companyPLZ,
      companyStreet,
      companyMail,
      companyNumber,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !companyName) {
      return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ein User kann nicht gleichzeitig ein Manager sein" },
        { status: 409 }
      );
    }

    const supabase = await createClient();

    // Create Manager in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`,
        data: {
          firstName,
          lastName,
          role: "manager",
        },
      },
    });

    if (error) {
      console.error("❌ Supabase Auth Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const supabaseUser = data.user;
    if (!supabaseUser) {
      return NextResponse.json({ error: "Manager konnte nicht erstellt werden" }, { status: 500 });
    }

    // Check if Manager already exists in DB
    const existingManager = await prisma.manager.findUnique({
      where: { email },
    });

    if (existingManager) {
      return NextResponse.json({ manager: existingManager }, { status: 200 });
    }

    // Build business address
    const businessAddress = `${companyStreet}, ${companyPLZ} ${companyPlace}`;
    const managerAddress = plz && city && street ? `${street}, ${plz} ${city}` : "";

    // Create Manager and Business in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Manager
      const newManager = await tx.manager.create({
        data: {
          id: supabaseUser.id,
          firstName,
          lastName,
          tel: tel || null,
          email,
        },
      });

      // Create Business
      const newBusiness = await tx.business.create({
        data: {
          managerId: newManager.id,
          name: companyName,
          address: businessAddress,
          email: companyMail || email, // Use manager email if company email is not provided
          title: companyName, // Using company name as title
        },
      });

      return { manager: newManager, business: newBusiness };
    });

    return NextResponse.json(
      {
        manager: result.manager,
        business: result.business,
        message: "Manager und Business erfolgreich erstellt",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in /api/auth/register/admin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
