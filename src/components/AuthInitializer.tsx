"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/src/store/authStore";

export function AuthInitializer() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initialized = useAuthStore((state) => state.initialized);
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double initialization in development (React StrictMode)
    if (hasRun.current || initialized) return;

    hasRun.current = true;
    console.log("🎬 [INIT] AuthInitializer mounting");
    initAuth();
  }, [initAuth, initialized]);

  return null;
}
