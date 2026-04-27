import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("@/src/store/authStore", () => ({
  useAuthStore: (selector: (s: { setUser: typeof mockSetUser }) => typeof mockSetUser) =>
    selector({ setUser: mockSetUser }),
}));

vi.mock("@/src/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword: mockSupabaseSignIn } }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockRouterPush = vi.fn();
const mockSetUser = vi.fn();
const mockSupabaseSignIn = vi.fn();

import { useAuth } from "@/src/hooks/useAuth";

beforeEach(() => {
  mockRouterPush.mockReset();
  mockSetUser.mockReset();
  mockSupabaseSignIn.mockReset();
  vi.stubGlobal("fetch", vi.fn());
});

describe("useAuth", () => {
  describe("loginUser", () => {
    it("gibt Zod-Validierungsfehler bei ungültiger E-Mail zurück", async () => {
      const { result } = renderHook(() => useAuth());

      let success: boolean;
      await act(async () => {
        success = await result.current.loginUser("keine-email", "passwort123", false);
      });

      expect(success!).toBe(false);
      expect(result.current.errors.email).toBeDefined();
      expect(mockSupabaseSignIn).not.toHaveBeenCalled();
    });

    it("setzt Fehler bei falschen Credentials", async () => {
      mockSupabaseSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid credentials" },
      });

      const { result } = renderHook(() => useAuth());

      let success: boolean;
      await act(async () => {
        success = await result.current.loginUser("test@example.com", "Falsch!123", false);
      });

      expect(success!).toBe(false);
      expect(result.current.errors.email).toBeDefined();
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it("ruft setUser und router.push bei erfolgreichem Login auf", async () => {
      const fakeUser = { id: "user-1", email: "test@example.com" };
      mockSupabaseSignIn.mockResolvedValue({
        data: { user: fakeUser, session: {} },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      let success: boolean;
      await act(async () => {
        success = await result.current.loginUser("test@example.com", "Richtig!123", false);
      });

      expect(success!).toBe(true);
      expect(mockSetUser).toHaveBeenCalledWith(fakeUser);
      expect(mockRouterPush).toHaveBeenCalledWith("/dashboard");
    });

    it("setzt loading auf false nach Abschluss", async () => {
      mockSupabaseSignIn.mockResolvedValue({
        data: { user: { id: "1" }, session: {} },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loginUser("test@example.com", "Richtig!123", false);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("registerUser", () => {
    const validFormData = {
      fullName: "Max Mustermann",
      email: "max@example.com",
      password: "Sicher!123",
      passwordConfirm: "Sicher!123",
      birthday: "1990-05-15",
      plz: "10115",
      place: "Berlin",
      street: "Musterstr. 1",
      gender: "Men" as const,
    };

    it("gibt Zod-Fehler bei fehlenden Pflichtfeldern zurück", async () => {
      const { result } = renderHook(() => useAuth());

      let success: boolean;
      await act(async () => {
        success = await result.current.registerUser({
          ...validFormData,
          email: "keine-email",
        });
      });

      expect(success!).toBe(false);
      expect(result.current.errors.email).toBeDefined();
    });

    it("gibt true bei erfolgreicher Registrierung zurück", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ user: { id: "new-1" } }),
      } as Response);

      const { result } = renderHook(() => useAuth());

      let success: boolean;
      await act(async () => {
        success = await result.current.registerUser(validFormData);
      });

      expect(success!).toBe(true);
    });

    it("setzt Fehler bei API-Fehlerantwort", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Dieser Nutzer existiert bereits." }),
      } as Response);

      const { result } = renderHook(() => useAuth());

      let success: boolean;
      await act(async () => {
        success = await result.current.registerUser(validFormData);
      });

      expect(success!).toBe(false);
      expect(result.current.errors.email).toContain("existiert bereits");
    });
  });
});
