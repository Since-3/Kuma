import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/src/app/api/auth/register/employee/route";

vi.mock("@/src/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/src/lib/prisma", () => ({
  prisma: {
    employee: { findUnique: vi.fn() },
  },
}));

import { createClient } from "@/src/lib/supabase/server";
import { prisma } from "@/src/lib/prisma";

const mockSignUp = vi.fn();
const mockSupabase = { auth: { signUp: mockSignUp } };

const validToken = "valid-token-abc";
const validEmployee = {
  email: "employee@example.com",
  isOnboarded: false,
  onboardingTokenExpiry: new Date(Date.now() + 3600000),
};

beforeEach(() => {
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  vi.mocked(prisma.employee.findUnique).mockReset();
  mockSignUp.mockReset();
});

const validBody = {
  token: validToken,
  email: "employee@example.com",
  password: "Sicher!123",
  firstName: "Anna",
  lastName: "Schmidt",
};

let ipCounter = 0;

function makeRequest(body: Record<string, unknown>) {
  // Each test gets a unique IP to avoid triggering the in-memory rate limiter
  const ip = `10.0.0.${++ipCounter}`;
  return new Request("http://localhost/api/auth/register/employee", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register/employee", () => {
  it("gibt 400 zurück wenn Pflichtfelder fehlen", async () => {
    const res = await POST(makeRequest({ token: validToken }));
    expect(res.status).toBe(400);
  });

  it("gibt 401 zurück bei ungültigem Token", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Ungültiger Token");
  });

  it("gibt 401 zurück bei bereits abgeschlossenem Onboarding", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      ...validEmployee,
      isOnboarded: true,
    } as never);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("gibt 401 zurück bei falschem E-Mail im Token", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      ...validEmployee,
      email: "andere@example.com",
    } as never);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("gibt 401 zurück bei abgelaufenem Token", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      ...validEmployee,
      onboardingTokenExpiry: new Date(Date.now() - 1000),
    } as never);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("abgelaufen");
  });

  it("gibt 400 zurück bei schwachem Passwort", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(validEmployee as never);

    const res = await POST(makeRequest({ ...validBody, password: "schwach" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Passwort");
  });

  it("gibt 201 zurück bei erfolgreicher Registrierung", async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(validEmployee as never);
    mockSignUp.mockResolvedValue({
      data: { user: { id: "emp-1" } },
      error: null,
    });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
