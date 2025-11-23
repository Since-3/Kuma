import { createClient } from "@/src/lib/supabase/server";
import { prisma } from "@/src/lib/prisma";
import { cache } from "react";

// Define the user data type
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
};

// Cache entry type
type CacheEntry = {
  data: UserData;
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
export const getUserData = cache(async (): Promise<UserData | null> => {
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

  console.log("✅ [DB] User data fetched:", userData?.name);

  // Store in cache
  if (userData) {
    userDataCache.set(user.id, { data: userData, timestamp: now });
  }

  return userData;
});

export async function requireAuth() {
  const user = await getUser();
  return user!;
}

export async function requireAuthWithData() {
  const userData = await getUserData();
  if (!userData) {
    throw new Error("User not found");
  }
  return userData;
}

export async function requireGuest() {
  const user = await getUser();
  if (user) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
}
