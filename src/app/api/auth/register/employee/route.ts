import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// Simple in-memory rate limiter: max 5 attempts per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) return true;

  entry.count++;
  return false;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte 15 Minuten." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { token, email, password, firstName, lastName, tel, gender, qualification } = body;

    if (!token || !email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
    }

    // Token serverseitig validieren
    const employee = await prisma.employee.findUnique({
      where: { onboardingToken: token },
      select: { email: true, isOnboarded: true, onboardingTokenExpiry: true },
    });

    if (!employee || employee.isOnboarded || employee.email !== email) {
      return NextResponse.json({ error: "Ungültiger Token" }, { status: 401 });
    }

    if (employee.onboardingTokenExpiry && employee.onboardingTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Token abgelaufen" }, { status: 401 });
    }

    // Passwort-Stärke serverseitig prüfen
    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error:
            "Passwort muss mindestens 8 Zeichen, Groß-/Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten",
        },
        { status: 400 }
      );
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
