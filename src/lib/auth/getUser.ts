import { createClient } from "@/src/lib/supabase/server";
import { prisma } from "@/src/lib/prisma";
import { cache } from "react";
import { unstable_cache } from "next/cache";

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

export type EmployeeData = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  qualification: string | null;
  pbSrc: string | null;
  createdAt: Date | null;
  createdBy: string | null;
  role: "employee";
  permissions: {
    employees: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    courses: { view: boolean; create: boolean; edit: boolean; delete: boolean };
    rooms: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  };
};

export type AuthUserData = UserData | ManagerData | EmployeeData;

// Get authenticated user from Supabase
// Uses React's cache() for per-request deduplication
export const getUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

// Fetch user data from all three tables in parallel, return the first match.
// Wrapped in unstable_cache (Next.js Data Cache, shared across serverless instances)
// keyed by email with a 60s TTL. React.cache() deduplicates within a single request.
export const getUserData = cache(async (): Promise<AuthUserData | null> => {
  const user = await getUser();
  if (!user || !user.email) return null;

  return unstable_cache(
    async (email: string, id: string): Promise<AuthUserData | null> => {
      const [userData, managerData, employeeData] = await Promise.all([
        prisma.user.findUnique({
          where: { id },
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
        }),
        prisma.manager.findUnique({
          where: { id },
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
        }),
        prisma.employee.findUnique({
          where: { email },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            qualification: true,
            pbSrc: true,
            permissions: true,
            createdAt: true,
            createdBy: true,
          },
        }),
      ]);

      if (userData) {
        const userWithRole: UserData = { ...userData, role: "user" };
        return userWithRole;
      }

      if (managerData) {
        const managerWithRole: ManagerData = { ...managerData, role: "manager" };
        return managerWithRole;
      }

      if (employeeData) {
        const raw = employeeData.permissions as Record<string, unknown> | null;
        const empty = () => ({ view: false, create: false, edit: false, delete: false });

        let permissions: EmployeeData["permissions"];

        if (raw && ("canCreateCourses" in raw || "canCreateEmployees" in raw)) {
          // Backward-Kompatibilität: altes Format migrieren
          const old = raw as { canCreateCourses?: boolean; canCreateEmployees?: boolean };
          permissions = {
            employees: {
              view: old.canCreateEmployees ?? false,
              create: old.canCreateEmployees ?? false,
              edit: false,
              delete: false,
            },
            courses: {
              view: old.canCreateCourses ?? false,
              create: old.canCreateCourses ?? false,
              edit: false,
              delete: false,
            },
            rooms: empty(),
          };
        } else {
          const p = raw as {
            employees?: Partial<EmployeeData["permissions"]["employees"]>;
            courses?: Partial<EmployeeData["permissions"]["courses"]>;
            rooms?: Partial<EmployeeData["permissions"]["rooms"]>;
          } | null;
          permissions = {
            employees: {
              view: p?.employees?.view ?? false,
              create: p?.employees?.create ?? false,
              edit: p?.employees?.edit ?? false,
              delete: p?.employees?.delete ?? false,
            },
            courses: {
              view: p?.courses?.view ?? false,
              create: p?.courses?.create ?? false,
              edit: p?.courses?.edit ?? false,
              delete: p?.courses?.delete ?? false,
            },
            rooms: {
              view: p?.rooms?.view ?? false,
              create: p?.rooms?.create ?? false,
              edit: p?.rooms?.edit ?? false,
              delete: p?.rooms?.delete ?? false,
            },
          };
        }

        const employeeWithRole: EmployeeData = {
          ...employeeData,
          role: "employee",
          permissions,
          createdBy: employeeData.createdBy,
        };
        return employeeWithRole;
      }

      return null;
    },
    ["user-data", user.email],
    {
      tags: [`user-data-${user.email}`],
      revalidate: 60,
    }
  )(user.email, user.id);
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

// Helper function to check if user is an employee
export function isEmployee(userData: AuthUserData): userData is EmployeeData {
  return userData.role === "employee";
}

/**
 * Requires that the authenticated user is a Manager OR an Employee with the given permission.
 * Redirects to /dashboard if access is denied.
 */
export async function requireManagerOrPermission(
  check: (permissions: EmployeeData["permissions"]) => boolean
): Promise<ManagerData | EmployeeData> {
  const userData = await requireAuthWithData();

  if (isManager(userData)) return userData;

  if (isEmployee(userData) && check(userData.permissions)) return userData;

  const { redirect } = await import("next/navigation");
  redirect("/dashboard");
  throw new Error("unreachable");
}
