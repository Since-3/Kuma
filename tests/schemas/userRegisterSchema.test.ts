import { describe, it, expect } from "vitest";
import { userRegisterSchema } from "@/src/modules/auth/validation/userRegisterSchema";

const validData = {
  fullName: "Max Mustermann",
  email: "max@example.com",
  password: "Sicher!123",
  passwordConfirm: "Sicher!123",
  birthday: "1990-05-15",
  plz: "10115",
  place: "Berlin",
  street: "Musterstraße 1",
  gender: "Men" as const,
};

describe("userRegisterSchema", () => {
  it("akzeptiert vollständig valide Daten", () => {
    const result = userRegisterSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("lehnt zu kurzen Namen ab", () => {
    const result = userRegisterSchema.safeParse({ ...validData, fullName: "X" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("fullName");
  });

  it("lehnt ungültige E-Mail ab", () => {
    const result = userRegisterSchema.safeParse({ ...validData, email: "keine-email" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("email");
  });

  it("lehnt Passwort ohne Großbuchstaben ab", () => {
    const result = userRegisterSchema.safeParse({
      ...validData,
      password: "sicher!123",
      passwordConfirm: "sicher!123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("password");
  });

  it("lehnt Passwort ohne Sonderzeichen ab", () => {
    const result = userRegisterSchema.safeParse({
      ...validData,
      password: "Sicher1234",
      passwordConfirm: "Sicher1234",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("password");
  });

  it("lehnt Passwort unter 8 Zeichen ab", () => {
    const result = userRegisterSchema.safeParse({
      ...validData,
      password: "Ku!1",
      passwordConfirm: "Ku!1",
    });
    expect(result.success).toBe(false);
  });

  it("lehnt nicht übereinstimmende Passwörter ab", () => {
    const result = userRegisterSchema.safeParse({
      ...validData,
      passwordConfirm: "AndersPasswort!1",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("passwordConfirm");
  });

  it("lehnt Geburtsdatum in der Zukunft ab", () => {
    const result = userRegisterSchema.safeParse({ ...validData, birthday: "2099-01-01" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("birthday");
  });

  it("lehnt ungültiges Datumsformat ab", () => {
    const result = userRegisterSchema.safeParse({ ...validData, birthday: "15.05.1990" });
    expect(result.success).toBe(false);
  });

  it("lehnt fehlendes Geschlecht ab", () => {
    const result = userRegisterSchema.safeParse({ ...validData, gender: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("gender");
  });

  it("lehnt ungültigen Gender-Wert ab", () => {
    const result = userRegisterSchema.safeParse({ ...validData, gender: "Unknown" });
    expect(result.success).toBe(false);
  });

  it("akzeptiert alle Gender-Werte", () => {
    for (const gender of ["Men", "Woman", "Various"] as const) {
      const result = userRegisterSchema.safeParse({ ...validData, gender });
      expect(result.success).toBe(true);
    }
  });
});
