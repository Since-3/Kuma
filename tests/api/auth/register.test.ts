import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/src/app/api/auth/register/route";

vi.mock("@/src/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/src/lib/prisma", () => ({
  prisma: {
    manager: { findUnique: vi.fn() },
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

import { createClient } from "@/src/lib/supabase/server";
import { prisma } from "@/src/lib/prisma";

const mockSignUp = vi.fn();
const mockSupabase = { auth: { signUp: mockSignUp } };

beforeEach(() => {
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  vi.mocked(prisma.manager.findUnique).mockReset();
  vi.mocked(prisma.user.findUnique).mockReset();
  vi.mocked(prisma.user.create).mockReset();
  mockSignUp.mockReset();
});

const validBody = {
  email: "neu@example.com",
  password: "Sicher!123",
  name: "Max Mustermann",
  birthday: "1990-05-15",
  plz: "10115",
  city: "Berlin",
  street: "Musterstraße 1",
  houseNumber: "1",
  gender: "Men",
};

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  it("gibt 400 zurück wenn Pflichtfelder fehlen", async () => {
    const res = await POST(makeRequest({ email: "test@example.com" }));
    expect(res.status).toBe(400);
  });

  it("gibt 409 zurück wenn E-Mail bereits als Manager existiert", async () => {
    vi.mocked(prisma.manager.findUnique).mockResolvedValue({
      id: "m-1",
      email: validBody.email,
    } as never);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("Manager");
  });

  it("gibt 409 zurück wenn User bereits existiert", async () => {
    vi.mocked(prisma.manager.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u-1",
      email: validBody.email,
    } as never);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("existiert bereits");
  });

  it("gibt 400 zurück bei Supabase-Auth-Fehler", async () => {
    vi.mocked(prisma.manager.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: "Email rate limit exceeded" },
    });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
  });

  it("gibt 201 und neuen User zurück bei Erfolg", async () => {
    const fakeUser = { id: "new-1" };
    const createdUser = { id: "new-1", email: validBody.email, name: validBody.name };

    vi.mocked(prisma.manager.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    mockSignUp.mockResolvedValue({ data: { user: fakeUser }, error: null });
    vi.mocked(prisma.user.create).mockResolvedValue(createdUser as never);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user.email).toBe(validBody.email);
  });
});
