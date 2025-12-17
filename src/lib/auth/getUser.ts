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

// Cache entry type
type CacheEntry = {
  data: AuthUserData;
  timestamp: number;
};

// Simple in-memory cache with timestamp
const userDataCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let userDataCallCount = 0;

// Cache Supabase user (per request)
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("🔐 [AUTH] getUser called - User:", user?.email || "none");
  return user;
});

// Cache user data from database with time-based cache
export const getUserData = cache(async (): Promise<AuthUserData | null> => {
  userDataCallCount++;
  console.log(`📊 [DB] getUserData called (count: ${userDataCallCount})`);

  const user = await getUser();
  if (!user) return null;

  // Check in-memory cache
  const cached = userDataCache.get(user.id);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(
      `⚡ [CACHE] Using cached data (${Math.round((now - cached.timestamp) / 1000)}s old)`
    );
    return cached.data;
  }

  console.log("🗄️ [DB] Fetching user data from Prisma for:", user.email);

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
    userDataCache.set(user.id, { data: userWithRole, timestamp: now });
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
    userDataCache.set(user.id, { data: managerWithRole, timestamp: now });
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
