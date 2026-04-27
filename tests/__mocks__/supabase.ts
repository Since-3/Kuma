import { vi } from "vitest";

export const mockAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

export const mockStorage = {
  from: vi.fn().mockReturnValue({
    upload: vi.fn(),
    remove: vi.fn(),
    getPublicUrl: vi
      .fn()
      .mockReturnValue({ data: { publicUrl: "https://example.com/avatar.jpg" } }),
  }),
};

export const mockSupabaseClient = {
  auth: mockAuth,
  storage: mockStorage,
};

// Used by vi.mock('@/src/lib/supabase/server', ...)
export const createClient = vi.fn().mockResolvedValue(mockSupabaseClient);

// Used by vi.mock('@/src/lib/supabase/client', ...)
export const createClientClient = vi.fn().mockReturnValue(mockSupabaseClient);
