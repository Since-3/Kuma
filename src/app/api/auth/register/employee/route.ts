import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, tel, gender, qualification } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          tel,
          gender,
          qualification,
          role: "employee",
        },
      },
    });

    if (error) {
      console.error("Supabase Auth Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Account konnte nicht erstellt werden" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/auth/register/employee:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
