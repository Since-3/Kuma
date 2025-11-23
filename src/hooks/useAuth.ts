"use client";

import { useState } from "react";
import { userRegisterSchema } from "../modules/auth/validation/userRegisterSchema";
import { toast } from "sonner";
import { ZodError } from "zod";
import { userLoginSchema } from "../modules/auth/validation/userLoginSchema";
import { createClient } from "@/src/lib/supabase/client";
import { useAuthStore } from "@/src/store/authStore";
import { useRouter } from "next/navigation";
import { RegisterFormData } from "../types/auth";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const supabase = createClient();
  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();

  const registerUser = async (formData: RegisterFormData) => {
    setErrors({});
    setLoading(true);

    try {
      userRegisterSchema.parse(formData);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.fullName,
          birthday: formData.birthday,
          plz: formData.plz,
          city: formData.place,
          street: formData.street,
          houseNumber: "",
          gender: formData.gender,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ email: data.error || "Registrierung fehlgeschlagen" });
        toast.error(data.error || "Registrierung fehlgeschlagen");
        return false;
      }

      toast.success("Bitte bestätige deine E-Mail, um die Registrierung abzuschließen.");
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const path = issue.path[0];
          if (typeof path === "string") fieldErrors[path] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
      toast.error("Ein unbekannter Fehler ist aufgetreten.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email: string, password: string, remember: boolean) => {
    setErrors({});
    setLoading(true);

    try {
      userLoginSchema.parse({ email, password });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrors({ email: "E-Mail oder Passwort ist falsch" });
        toast.error("E-Mail oder Passwort ist falsch");
        return false;
      }

      // Update Zustand store
      setUser(data.user);

      toast.success("Erfolgreich eingeloggt 🎉");

      // Navigate and refresh
      router.push("/dashboard");
      router.refresh();

      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const path = issue.path[0];
          if (typeof path === "string") fieldErrors[path] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
      toast.error("Ein unerwarteter Fehler ist aufgetreten.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    errors,
    registerUser,
    loginUser,
    setErrors,
  };
};
