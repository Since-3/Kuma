// src/store/authStore.ts
import { create } from "zustand";
import { createClient } from "@/src/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  initAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => {
    console.log("👤 [ZUSTAND] setUser:", user?.email || "null");
    set({ user, loading: false });
  },

  initAuth: async () => {
    // Prevent multiple initializations
    if (get().initialized) {
      console.log("⏭️ [ZUSTAND] Already initialized, skipping");
      return;
    }

    console.log("🚀 [ZUSTAND] initAuth starting");
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("🔐 [ZUSTAND] Initial session:", session?.user?.email || "none");
    set({ user: session?.user ?? null, loading: false, initialized: true });

    // Listen for auth changes (login/logout only)
    supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 [ZUSTAND] Auth event:", event, session?.user?.email || "none");

      // Only update on actual auth changes, not on token refresh
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        set({ user: session?.user ?? null, loading: false });
      }
    });
  },

  signOut: async () => {
    console.log("👋 [ZUSTAND] Signing out");
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
    window.location.href = "/login";
  },
}));
