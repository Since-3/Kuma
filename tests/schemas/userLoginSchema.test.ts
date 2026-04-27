import { describe, it, expect } from "vitest";
import { userLoginSchema } from "@/src/modules/auth/validation/userLoginSchema";

describe("userLoginSchema", () => {
  it("akzeptiert valide Anmeldedaten", () => {
    const result = userLoginSchema.safeParse({
      email: "test@example.com",
      password: "passwort123",
    });
    expect(result.success).toBe(true);
  });

  it("lehnt ungültige E-Mail ab", () => {
    const result = userLoginSchema.safeParse({
      email: "kein-email",
      password: "passwort123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("email");
  });

  it("lehnt Passwort unter 8 Zeichen ab", () => {
    const result = userLoginSchema.safeParse({
      email: "test@example.com",
      password: "kurz",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path[0]).toBe("password");
  });

  it("lehnt fehlende E-Mail ab", () => {
    const result = userLoginSchema.safeParse({ password: "passwort123" });
    expect(result.success).toBe(false);
  });

  it("lehnt fehlendes Passwort ab", () => {
    const result = userLoginSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(false);
  });
});
