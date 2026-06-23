/**
 * Employee Actions - Server-side actions for employee management
 *
 * This file contains all Server Actions for the employee management system.
 * Functions include: creating, fetching, updating, and deleting employees.
 * All functions are protected with authentication and authorization.
 */

"use server";

import { prisma } from "@/src/lib/prisma";
import { getUserData, isManager, isEmployee, getEffectiveManagerId } from "@/src/lib/auth/getUser";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { employeeSchema, type EmployeeFormData } from "../schemas/employee-schema";
import { revalidatePath, revalidateTag } from "next/cache";

function invalidateUserDataCache(email: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (revalidateTag as any)(`user-data-${email}`);
}
import { randomBytes } from "crypto";
import { sendMail } from "@/src/lib/mail/nodemailer";
import { generateOnboardingEmail } from "@/src/lib/mail/templates/employee-onboarding";
import { generateOnboardingCompleteEmail } from "@/src/lib/mail/templates/onboarding-complete";

/**
 * Generates a secure onboarding token
 *
 * @returns A random 32-byte token as a hex string
 */
function generateOnboardingToken(): string {
  return randomBytes(32).toString("hex");
}

type PermissionGroup = { view: boolean; create: boolean; edit: boolean; delete: boolean };
type PermissionsObj = {
  employees: PermissionGroup;
  courses: PermissionGroup;
  rooms: PermissionGroup;
};

/**
 * Clamps the permissions to be stored to what the caller themselves possesses.
 * Prevents privilege escalation: an employee can only grant permissions they already have.
 */
function clampPermissions(requested: PermissionsObj, ceiling: PermissionsObj): PermissionsObj {
  const clamp = (req: PermissionGroup, ceil: PermissionGroup): PermissionGroup => ({
    view: req.view && ceil.view,
    create: req.create && ceil.create,
    edit: req.edit && ceil.edit,
    delete: req.delete && ceil.delete,
  });
  return {
    employees: clamp(requested.employees, ceiling.employees),
    courses: clamp(requested.courses, ceiling.courses),
    rooms: clamp(requested.rooms, ceiling.rooms),
  };
}

/**
 * Creates a new employee in the database
 *
 * This function validates the input data, checks the user's permissions,
 * and creates a new employee. The employee receives an onboarding token
 * that is later used for the onboarding process.
 * Only managers can create employees.
 *
 * @param data - The employee data from the form
 * @param status - The employee's status ("draft" or "published")
 * @returns An object with a success flag, optional employeeId, onboardingToken, and a message or error
 */
export async function createEmployee(data: EmployeeFormData, status: "draft" | "published") {
  try {
    // Step 1: Fetch the current user
    const userData = await getUserData();

    // Step 2: Check if the user is logged in
    if (!userData) {
      return {
        success: false,
        error: "You must be logged in to create an employee",
      };
    }

    // Step 3: Manager or employee with the required permission
    const canManageEmployees =
      isManager(userData) || (isEmployee(userData) && userData.permissions.employees.create);
    if (!canManageEmployees) {
      return {
        success: false,
        error: "You do not have permission to create employees",
      };
    }

    // Step 4: Validate form data against the Zod schema
    const validation = employeeSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: "Validation error",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const validatedData = validation.data;

    // Step 5: Check if the email already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmployee) {
      return {
        success: false,
        error: "An employee with this email address already exists",
      };
    }

    // Step 6: Generate an onboarding token (only when publishing)
    let onboardingToken: string | null = null;
    let onboardingTokenExpiry: Date | null = null;

    if (status === "published") {
      onboardingToken = generateOnboardingToken();
      // Token is valid for 7 days
      onboardingTokenExpiry = new Date();
      onboardingTokenExpiry.setDate(onboardingTokenExpiry.getDate() + 7);
    }

    // Step 7: Determine the manager ID (an employee inherits createdBy from their own record)
    const managerId = getEffectiveManagerId(userData);
    if (!managerId)
      return { success: false, error: "Employee account is not assigned to a manager" };

    // Step 8: Clamp permissions to the caller's ceiling (prevent privilege escalation)
    const finalPermissions = isEmployee(userData)
      ? clampPermissions(validatedData.permissions, userData.permissions)
      : validatedData.permissions;

    // Step 9: Create the employee in the database
    const employee = await prisma.employee.create({
      data: {
        email: validatedData.email,
        roles: validatedData.roles,
        locations: validatedData.locations || [],
        permissions: finalPermissions,
        status: status,
        isOnboarded: false,
        onboardingToken,
        onboardingTokenExpiry,
        createdBy: managerId,
      },
    });

    // Step 10: Send email if status is published
    if (status === "published" && onboardingToken) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const onboardingUrl = `${baseUrl}/employee/onboarding/${onboardingToken}`;

      const { subject, html, text } = generateOnboardingEmail({
        email: validatedData.email,
        onboardingUrl,
        companyName: process.env.COMPANY_NAME || "S3 Kuma",
      });

      // Send email asynchronously (fire and forget)
      sendMail({
        to: validatedData.email,
        subject,
        html,
        text,
      }).catch((error) => {
        console.error("Error sending email:", error);
        // Email errors are not surfaced to the user;
        // the employee record has already been created
      });
    }

    // Step 11: Invalidate the Next.js cache for /employee so new data is shown
    revalidatePath("/employee");

    return {
      success: true,
      employeeId: employee.id,
      onboardingToken: onboardingToken || undefined,
      message:
        status === "published"
          ? "Employee successfully published. Onboarding email has been sent."
          : "Draft successfully saved",
    };
  } catch (error) {
    console.error("Error creating employee:", error);
    return {
      success: false,
      error: "An error occurred while creating the employee",
    };
  }
}

/**
 * Fetches all trainers (employees with the role "trainer") created by the logged-in manager
 *
 * @returns An object with a success flag and an array of trainers in the format {value, label}
 */
export async function getMyTrainers() {
  try {
    const userData = await getUserData();

    if (
      !userData ||
      (!isManager(userData) && !(isEmployee(userData) && userData.permissions.employees.view))
    ) {
      return {
        success: false,
        error: "Unauthorized",
        trainers: [],
      };
    }

    const managerId = getEffectiveManagerId(userData);
    if (!managerId)
      return {
        success: false,
        error: "Employee account is not assigned to a manager",
        employees: [],
        trainers: [],
      };

    const employees = await prisma.employee.findMany({
      where: {
        createdBy: managerId,
        roles: { has: "trainer" },
        isOnboarded: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        pbSrc: true,
      },
      orderBy: { firstName: "asc" },
    });

    const trainers = employees.map((e) => ({
      value: e.id,
      label: e.firstName && e.lastName ? `${e.firstName} ${e.lastName}` : e.email,
      pbSrc: e.pbSrc ?? undefined,
    }));

    return { success: true, trainers };
  } catch (error) {
    console.error("Error fetching trainers:", error);
    return {
      success: false,
      error: "Error loading trainers",
      trainers: [],
    };
  }
}

/**
 * Fetches all employees created by the logged-in manager
 *
 * This function returns all employees created by the current manager,
 * regardless of status (draft or published).
 *
 * @returns An object with a success flag and an array of employees
 */
export async function getMyEmployees() {
  try {
    // Step 1: Fetch the current user
    const userData = await getUserData();

    // Step 2: Check if the user is a manager or an employee with the required permission
    if (
      !userData ||
      (!isManager(userData) && !(isEmployee(userData) && userData.permissions.employees.view))
    ) {
      return {
        success: false,
        error: "Unauthorized",
        employees: [],
      };
    }

    // Step 3: Build the database query depending on the caller's role
    let whereClause: Record<string, unknown>;
    if (isManager(userData)) {
      // Manager sees all employees under their own ID
      whereClause = { createdBy: userData.id };
    } else {
      // Employee: show everyone under the same manager (excluding themselves)
      // createdBy can be null (orphaned account) — return nothing in that case
      const managerId = userData.createdBy;
      if (!managerId) {
        return { success: true, employees: [] };
      }
      whereClause = { createdBy: managerId, NOT: { email: userData.email } };
    }
    const employees = await prisma.employee.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      employees,
    };
  } catch (error) {
    console.error("Error fetching employees:", error);
    return {
      success: false,
      error: "Error loading employees",
      employees: [],
    };
  }
}

/**
 * Fetches a single employee by ID
 *
 * This function returns an employee only if the logged-in manager
 * is the one who created that employee.
 *
 * @param employeeId - The unique ID of the employee
 * @returns An object with a success flag and the employee or an error
 */
export async function getEmployeeById(employeeId: string) {
  try {
    // Step 1: Fetch the current user
    const userData = await getUserData();

    // Step 2: Check if the user is a manager or an employee with the required permission
    if (
      !userData ||
      (!isManager(userData) && !(isEmployee(userData) && userData.permissions.employees.view))
    ) {
      return {
        success: false,
        error: "Only managers can edit employees",
      };
    }

    // Step 3: Fetch the employee from the database
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    // Step 4: Check if the employee exists
    if (!employee) {
      return {
        success: false,
        error: "Employee not found",
      };
    }

    // Step 4b: An employee may not edit their own account
    if (isEmployee(userData) && employee.email === userData.email) {
      return {
        success: false,
        error: "You cannot edit your own account",
      };
    }

    // Step 5: Check if the manager owns this employee record
    if (isManager(userData) && employee.createdBy !== userData.id) {
      return {
        success: false,
        error: "You can only edit your own employees",
      };
    }

    return {
      success: true,
      employee,
    };
  } catch (error) {
    console.error("Error fetching employee:", error);
    return {
      success: false,
      error: "Error loading employee",
    };
  }
}

/**
 * Updates an existing employee
 *
 * This function validates the input data, checks the user's permissions,
 * and updates an existing employee. Only the manager who created the employee
 * can edit them.
 *
 * @param employeeId - The unique ID of the employee to update
 * @param data - The updated employee data from the form
 * @param status - The employee's status ("draft" or "published")
 * @returns An object with a success flag and a message or error
 */
export async function updateEmployee(
  employeeId: string,
  data: EmployeeFormData,
  status: "draft" | "published"
) {
  try {
    // Step 1: Fetch the current user
    const userData = await getUserData();

    // Step 2: Check if the user is logged in
    if (!userData) {
      return {
        success: false,
        error: "You must be logged in to edit an employee",
      };
    }

    // Step 3: Check if the user is a manager or an employee with the required permission
    const canManageEmployees =
      isManager(userData) || (isEmployee(userData) && userData.permissions.employees.edit);
    if (!canManageEmployees) {
      return {
        success: false,
        error: "Only managers can edit employees",
      };
    }

    // Step 4: Fetch the existing employee from the database
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    // Step 5: Check if the employee exists
    if (!existingEmployee) {
      return {
        success: false,
        error: "Employee not found",
      };
    }

    // Step 5b: An employee may not edit their own account
    if (isEmployee(userData) && existingEmployee.email === userData.email) {
      return {
        success: false,
        error: "You cannot edit your own account",
      };
    }

    // Step 6: Check if the caller owns this employee record
    const ownerManagerId = getEffectiveManagerId(userData);
    if (!ownerManagerId)
      return { success: false, error: "Employee account is not assigned to a manager" };
    if (existingEmployee.createdBy !== ownerManagerId) {
      return {
        success: false,
        error: "You can only edit employees belonging to your manager",
      };
    }

    // Step 7: Validate form data against the Zod schema
    const validation = employeeSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: "Validation error",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const validatedData = validation.data;

    // Step 8: Generate a new onboarding token if the employee is being published for the first time
    let onboardingToken = existingEmployee.onboardingToken;
    let onboardingTokenExpiry = existingEmployee.onboardingTokenExpiry;
    let shouldSendEmail = false;

    if (
      status === "published" &&
      !existingEmployee.isOnboarded &&
      !existingEmployee.onboardingToken
    ) {
      onboardingToken = generateOnboardingToken();
      onboardingTokenExpiry = new Date();
      onboardingTokenExpiry.setDate(onboardingTokenExpiry.getDate() + 7);
      shouldSendEmail = true; // Only send email when a new token was generated
    }

    // Step 9: Clamp permissions to the caller's ceiling (prevent privilege escalation)
    const finalPermissions = isEmployee(userData)
      ? clampPermissions(validatedData.permissions, userData.permissions)
      : validatedData.permissions;

    // Step 10: Update the employee in the database
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        email: validatedData.email,
        roles: validatedData.roles,
        locations: validatedData.locations || [],
        permissions: finalPermissions,
        status,
        onboardingToken,
        onboardingTokenExpiry,
      },
    });

    // Step 11: Send email if a new onboarding token was generated
    if (shouldSendEmail && onboardingToken) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const onboardingUrl = `${baseUrl}/employee/onboarding/${onboardingToken}`;

      const { subject, html, text } = generateOnboardingEmail({
        email: validatedData.email,
        onboardingUrl,
        companyName: process.env.COMPANY_NAME || "S3 Kuma",
      });

      // Send email asynchronously (fire and forget)
      sendMail({
        to: validatedData.email,
        subject,
        html,
        text,
      }).catch((error) => {
        console.error("Error sending email:", error);
        // Email errors are not surfaced to the user
      });
    }

    // Step 12: Invalidate the Next.js cache
    revalidatePath("/employee");
    revalidatePath(`/employee/edit/${employeeId}`);
    invalidateUserDataCache(validatedData.email);
    // If the email changed, also invalidate the old email's cache entry
    if (existingEmployee.email !== validatedData.email) {
      invalidateUserDataCache(existingEmployee.email);
    }

    return {
      success: true,
      message:
        status === "published"
          ? shouldSendEmail
            ? "Employee successfully updated. Onboarding email has been sent."
            : "Employee successfully updated and published"
          : "Draft successfully updated",
    };
  } catch (error) {
    console.error("Error updating employee:", error);
    return {
      success: false,
      error: "An error occurred while updating the employee",
    };
  }
}

/**
 * Fetches all roles currently used by the manager's employees
 *
 * This function extracts all roles from the current manager's employees,
 * deduplicates them, and returns the result. This allows custom roles to be
 * reused without requiring a separate roles table.
 *
 * @returns An object with a success flag and an array of roles in the format {value, label}
 */
export async function getMyEmployeeRoles() {
  try {
    // Step 1: Fetch the current user
    const userData = await getUserData();

    // Step 2: Manager or employee with the required permission
    if (
      !userData ||
      (!isManager(userData) && !(isEmployee(userData) && userData.permissions.employees.view))
    ) {
      return {
        success: false,
        error: "Unauthorized",
        roles: [],
      };
    }

    // Step 3: Determine the effective manager ID
    const managerId = getEffectiveManagerId(userData);
    if (!managerId)
      return {
        success: false,
        error: "Employee account is not assigned to a manager",
        roles: [],
      };

    // Step 4: Fetch all of the manager's employees (roles field only)
    const employees = await prisma.employee.findMany({
      where: {
        createdBy: managerId,
      },
      select: {
        roles: true,
      },
    });

    // Step 5: Extract all roles and deduplicate
    const allRoles = employees.flatMap((employee) => employee.roles);
    const uniqueRoles = [...new Set(allRoles)];

    // Step 6: Convert to {value, label} format
    const formattedRoles = uniqueRoles.map((role) => ({
      value: role,
      label: role.charAt(0).toUpperCase() + role.slice(1), // Capitalize first letter
    }));

    return {
      success: true,
      roles: formattedRoles,
    };
  } catch (error) {
    console.error("Error fetching employee roles:", error);
    return {
      success: false,
      error: "Error loading roles",
      roles: [],
    };
  }
}

/**
 * Deletes an employee from the database
 *
 * Before deleting, this function verifies that:
 * - The caller is a manager or has the delete permission
 * - The employee exists
 * - The caller owns the employee record (managers can only delete their own employees)
 *
 * @param employeeId - The unique ID of the employee to delete
 * @returns An object with a success flag and a message or error
 */
export async function deleteEmployee(employeeId: string) {
  try {
    // Step 1: Fetch the current user
    const userData = await getUserData();

    // Step 2: Check if the user is a manager or an employee with the required permission
    if (
      !userData ||
      (!isManager(userData) && !(isEmployee(userData) && userData.permissions.employees.delete))
    ) {
      return {
        success: false,
        error: "Only managers can delete employees",
      };
    }

    // Step 3: Fetch the employee from the database
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    // Step 4: Check if the employee exists
    if (!employee) {
      return {
        success: false,
        error: "Employee not found",
      };
    }

    // Step 4b: An employee may not delete their own account
    if (isEmployee(userData) && employee.email === userData.email) {
      return {
        success: false,
        error: "You cannot delete your own account",
      };
    }

    // Step 5: Check if the caller owns this employee record
    const ownerManagerId = getEffectiveManagerId(userData);
    if (!ownerManagerId)
      return { success: false, error: "Employee account is not assigned to a manager" };
    if (employee.createdBy !== ownerManagerId) {
      return {
        success: false,
        error: "You can only delete employees belonging to your manager",
      };
    }

    // Step 6: Delete the employee from the database
    await prisma.employee.delete({
      where: { id: employeeId },
    });

    // Step 7: Delete the Supabase Auth user (forces automatic sign-out)
    if (employee.isOnboarded) {
      try {
        const adminClient = createAdminClient();
        const { data: authUsers } = await adminClient.auth.admin.listUsers();
        const authUser = authUsers?.users.find((u) => u.email === employee.email);
        if (authUser) {
          await adminClient.auth.admin.deleteUser(authUser.id);
        }
      } catch (err) {
        // Auth deletion fails if SERVICE_ROLE_KEY is missing — the DB record is already gone
        console.error("Could not delete Supabase Auth user:", err);
      }
    }

    // Step 8: Invalidate the Next.js cache
    revalidatePath("/employee");
    invalidateUserDataCache(employee.email);

    return {
      success: true,
      message: "Employee successfully deleted",
    };
  } catch (error) {
    console.error("Error deleting employee:", error);
    return {
      success: false,
      error: "Error deleting employee",
    };
  }
}

/**
 * Checks whether a trainer is still assigned to active (future) courses.
 * Returns the number of affected courses.
 */
export async function getActiveCoursesCountByTrainer(employeeId: string) {
  try {
    const userData = await getUserData();

    if (
      !userData ||
      (!isManager(userData) && !(isEmployee(userData) && userData.permissions.employees.delete))
    ) {
      return { success: false, error: "Unauthorized", count: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.course.count({
      where: {
        trainers: { has: employeeId },
        date: { gte: today },
      },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Error checking active courses for trainer:", error);
    return { success: false, error: "Error checking courses", count: 0 };
  }
}

/**
 * Fetches an employee by their onboarding token (public — no login required)
 */
export async function getEmployeeByOnboardingToken(token: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { onboardingToken: token },
    });

    if (!employee) {
      return { success: false, error: "Invalid onboarding link" };
    }

    if (employee.isOnboarded) {
      return { success: false, error: "Onboarding has already been completed" };
    }

    if (employee.onboardingTokenExpiry && employee.onboardingTokenExpiry < new Date()) {
      return { success: false, error: "This onboarding link has expired" };
    }

    return { success: true, employee };
  } catch (error) {
    console.error("Error fetching employee by token:", error);
    return { success: false, error: "Error loading employee data" };
  }
}

/**
 * Completes an employee's onboarding and creates their Supabase account
 */
export async function completeEmployeeOnboarding(
  token: string,
  data: {
    firstName: string;
    lastName: string;
    tel: string;
    password: string;
    gender: string;
    qualification: string;
    pbSrc?: string;
  }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { onboardingToken: token },
    });

    if (!employee) {
      return { success: false, error: "Invalid onboarding link" };
    }

    // Create the Supabase account via the API route
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/auth/register/employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        email: employee.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        tel: data.tel,
        gender: data.gender,
        qualification: data.qualification,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      return { success: false, error: result.error || "Registration failed" };
    }

    // Atomically mark the employee as onboarded — prevents TOCTOU race condition
    const updated = await prisma.employee.updateMany({
      where: {
        onboardingToken: token,
        isOnboarded: false,
        OR: [{ onboardingTokenExpiry: null }, { onboardingTokenExpiry: { gte: new Date() } }],
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        qualification: data.qualification,
        pbSrc: data.pbSrc ?? null,
        isOnboarded: true,
        onboardingToken: null,
        onboardingTokenExpiry: null,
      },
    });

    if (updated.count === 0) {
      return {
        success: false,
        error: "Onboarding has already been completed or the link has expired",
      };
    }

    invalidateUserDataCache(employee.email);

    // Send a confirmation email to the manager
    if (employee.createdBy) {
      const manager = await prisma.manager.findUnique({
        where: { id: employee.createdBy },
        select: { email: true, firstName: true, lastName: true },
      });

      if (manager) {
        const { subject, html, text } = generateOnboardingCompleteEmail({
          managerName: `${manager.firstName} ${manager.lastName}`,
          employeeFirstName: data.firstName,
          employeeLastName: data.lastName,
          employeeEmail: employee.email,
          companyName: process.env.COMPANY_NAME || "S3 Kuma",
        });

        sendMail({ to: manager.email, subject, html, text }).catch((error) => {
          console.error("Error sending manager notification:", error);
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Resends the onboarding email to an employee who has not yet completed onboarding.
 * Generates a fresh token with a new 7-day expiry before sending.
 */
export async function resendOnboardingEmail(employeeId: string) {
  try {
    const userData = await getUserData();

    // Check if the caller has permission to manage employees
    const canManage =
      userData &&
      (isManager(userData) || (isEmployee(userData) && userData.permissions.employees.edit));

    if (!canManage) {
      return { success: false, error: "You do not have permission to perform this action" };
    }

    const managerId = getEffectiveManagerId(userData);
    if (!managerId) return { success: false, error: "Manager ID not found" };

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, email: true, status: true, isOnboarded: true, createdBy: true },
    });

    // Verify the employee exists and belongs to this manager
    if (!employee || employee.createdBy !== managerId) {
      return { success: false, error: "Employee not found" };
    }

    if (employee.isOnboarded) {
      return { success: false, error: "This employee has already completed onboarding" };
    }

    if (employee.status !== "published") {
      return { success: false, error: "Only published employees can receive an onboarding email" };
    }

    // Generate a new token and reset its expiry
    const newToken = generateOnboardingToken();
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);

    await prisma.employee.update({
      where: { id: employeeId },
      data: { onboardingToken: newToken, onboardingTokenExpiry: newExpiry },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const onboardingUrl = `${baseUrl}/employee/onboarding/${newToken}`;

    const { subject, html, text } = generateOnboardingEmail({
      email: employee.email,
      onboardingUrl,
      companyName: process.env.COMPANY_NAME || "S3 Kuma",
    });

    await sendMail({ to: employee.email, subject, html, text });

    return { success: true, message: "Onboarding email has been resent" };
  } catch (error) {
    console.error("Error resending onboarding email:", error);
    return { success: false, error: "Error sending email" };
  }
}
