// app/api/auth/login/route.ts
import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "E-Mail und Passwort sind erforderlich" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Login Error:", error.message);
      return NextResponse.json({ error: "E-Mail oder Passwort ist falsch" }, { status: 401 });
    }

    return NextResponse.json({ user: data.user, session: data.session }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/auth/login:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
