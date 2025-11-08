import { supabaseServer } from "@/src/lib/supabaseClient";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

/**
 ** Handles POST request to register and save a User in the DB
 *
 *
 * @param {Request} request - Incoming HTTP request containing user data in JSON format
 * @returns {Promise<NextResponse>} - JSON response with exisiting or newly created user
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, birthday, plz, city, street, houseNumber, gender } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    const { data, error } = await supabaseServer.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:3000/login",
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

    // Check if User exists in the DB
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ user: existingUser }, { status: 200 });
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

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/auth/register:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
