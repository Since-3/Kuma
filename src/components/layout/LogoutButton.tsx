"use client";

import { useAuthStore } from "@/src/store/authStore";
import { Button } from "@/src/components/ui/button";

export function LogoutButton() {
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <Button onClick={signOut} variant="destructive" size="sm">
      Logout
    </Button>
  );
}
