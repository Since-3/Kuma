import { createClient } from "@/src/lib/supabase/server";
import { prisma } from "@/src/lib/prisma";
import { cache } from "react";

// Define the user data types
export type UserData = {
  id: string;
  name: string | null;
  email: string;
  birthday: Date | null;
  plz: string | null;
  city: string | null;
  street: string | null;
  houseNumber: string | null;
  gender: string | null;
  pbSrc: string | null;
  createdAt: Date | null;
  role: "user";
};

export type ManagerData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tel: string | null;
  pbSrc: string | null;
  createdAt: Date | null;
  role: "manager";
  businesses: Array<{
    id: string;
    name: string;
    address: string;
    email: string;
  }>;
};

export type AuthUserData = UserData | ManagerData;

// Note: We don't use in-memory caching because this app runs on Vercel (serverless)
// Serverless functions are stateless - in-memory cache would be:
// 1. Inconsistent across Lambda instances
// 2. Lost on cold starts
// 3. Not shared between requests
// Instead, we rely on React's cache() for per-request deduplication only.

let userDataCallCount = 0;
let supabaseCallCount = 0;

// Get authenticated user from Supabase
// Uses React's cache() for per-request deduplication
// No cross-request caching due to serverless architecture
export const getUser = cache(async () => {
  supabaseCallCount++;
  console.log(`🔐 [AUTH] getUser called (count: ${supabaseCallCount})`);

  const supabase = await createClient();

  // Validate with Auth server (secure - always authenticates against Supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    console.log("🔐 [AUTH] User authenticated:", user.email);
  } else {
    console.log("🔐 [AUTH] No authenticated user");
  }

  return user;
});

// Get user data from database
// Uses React's cache() for per-request deduplication
// No cross-request caching due to serverless architecture
export const getUserData = cache(async (): Promise<AuthUserData | null> => {
  userDataCallCount++;
  console.log(`📊 [DB] getUserData called (count: ${userDataCallCount})`);

  const user = await getUser();
  if (!user) return null;

  console.log("🗄️ [DB] Fetching user data from database for:", user.email);

  // Try to find in User table first
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      birthday: true,
      plz: true,
      city: true,
      street: true,
      houseNumber: true,
      gender: true,
      pbSrc: true,
      createdAt: true,
    },
  });

  if (userData) {
    console.log("✅ [DB] User data fetched:", userData.name);
    const userWithRole: UserData = { ...userData, role: "user" };
    return userWithRole;
  }

  // If not found in User table, try Manager table
  const managerData = await prisma.manager.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      tel: true,
      pbSrc: true,
      createdAt: true,
      businesses: {
        select: {
          id: true,
          name: true,
          address: true,
          email: true,
        },
      },
    },
  });

  if (managerData) {
    console.log(
      "✅ [DB] Manager data fetched:",
      `${managerData.firstName} ${managerData.lastName}`
    );
    const managerWithRole: ManagerData = { ...managerData, role: "manager" };
    return managerWithRole;
  }

  console.log("⚠️ [DB] No user or manager found for:", user.email);
  return null;
});

export async function requireAuth() {
  const user = await getUser();
  return user!;
}

export async function requireAuthWithData(): Promise<AuthUserData> {
  const user = await getUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  const userData = await getUserData();
  if (!userData) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return userData as AuthUserData;
}

export async function requireGuest() {
  const user = await getUser();
  if (user) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
}

/**
 * Requires that the authenticated user is a Manager.
 * Redirects to /dashboard if user is not a manager.
 * Redirects to /login if not authenticated.
 */
export async function requireManager() {
  const userData = await requireAuthWithData();

  if (!isManager(userData)) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }

  return userData;
}

// Helper function to check if user is a manager
export function isManager(userData: AuthUserData): userData is ManagerData {
  return userData.role === "manager";
}

// Helper function to check if user is a regular user
export function isUser(userData: AuthUserData): userData is UserData {
  return userData.role === "user";
}
