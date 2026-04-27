import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/src/app/api/auth/login/route";

vi.mock("@/src/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/src/lib/supabase/server";

const mockSignInWithPassword = vi.fn();
const mockSupabase = { auth: { signInWithPassword: mockSignInWithPassword } };

beforeEach(() => {
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  mockSignInWithPassword.mockReset();
});

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  it("gibt 400 zurück wenn E-Mail fehlt", async () => {
    const res = await POST(makeRequest({ password: "passwort123" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("gibt 400 zurück wenn Passwort fehlt", async () => {
    const res = await POST(makeRequest({ email: "test@example.com" }));
    expect(res.status).toBe(400);
  });

  it("gibt 401 zurück bei falschen Credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const res = await POST(makeRequest({ email: "test@example.com", password: "falsch123" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("falsch");
  });

  it("gibt 200 und User/Session zurück bei Erfolg", async () => {
    const fakeUser = { id: "user-1", email: "test@example.com" };
    const fakeSession = { access_token: "token-abc" };
    mockSignInWithPassword.mockResolvedValue({
      data: { user: fakeUser, session: fakeSession },
      error: null,
    });

    const res = await POST(makeRequest({ email: "test@example.com", password: "Richtig!123" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.id).toBe("user-1");
    expect(data.session.access_token).toBe("token-abc");
  });
});
