import { describe, it, expect } from "vitest";
import { employeeSchema } from "@/src/modules/employee/schemas/employee-schema";

const defaultPermissions = {
  employees: { view: true, create: false, edit: false, delete: false },
  courses: { view: true, create: false, edit: false, delete: false },
  rooms: { view: true, create: false, edit: false, delete: false },
};

const validData = {
  email: "mitarbeiter@example.com",
  roles: ["Trainer"],
  isMultipleLocation: false,
  permissions: defaultPermissions,
};

describe("employeeSchema", () => {
  it("akzeptiert valide Mitarbeiterdaten", () => {
    const result = employeeSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("lehnt ungültige E-Mail ab", () => {
    const result = employeeSchema.safeParse({ ...validData, email: "keine-email" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("email");
  });

  it("lehnt leeres Rollen-Array ab", () => {
    const result = employeeSchema.safeParse({ ...validData, roles: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("roles");
  });

  it("lehnt mehrere Standorte ohne Standort-Auswahl ab", () => {
    const result = employeeSchema.safeParse({
      ...validData,
      isMultipleLocation: true,
      locations: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("locations");
  });

  it("akzeptiert mehrere Standorte mit mindestens einem Standort", () => {
    const result = employeeSchema.safeParse({
      ...validData,
      isMultipleLocation: true,
      locations: ["standort-1"],
    });
    expect(result.success).toBe(true);
  });

  it("akzeptiert mehrere Rollen", () => {
    const result = employeeSchema.safeParse({
      ...validData,
      roles: ["Trainer", "Admin", "Kassierer"],
    });
    expect(result.success).toBe(true);
  });

  it("akzeptiert alle Permissions als false", () => {
    const noPermissions = {
      employees: { view: false, create: false, edit: false, delete: false },
      courses: { view: false, create: false, edit: false, delete: false },
      rooms: { view: false, create: false, edit: false, delete: false },
    };
    const result = employeeSchema.safeParse({ ...validData, permissions: noPermissions });
    expect(result.success).toBe(true);
  });
});
