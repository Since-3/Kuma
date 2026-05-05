"use client";

import { useState } from "react";
import { userRegisterSchema } from "../modules/auth/validation/userRegisterSchema";
import { toast } from "sonner";
import { ZodError } from "zod";
import { userLoginSchema } from "../modules/auth/validation/userLoginSchema";
import { createClient } from "@/src/lib/supabase/client";
import { useAuthStore } from "@/src/store/authStore";
import { useRouter } from "next/navigation";
import { RegisterFormData, AdminRegisterFormData } from "../types/auth";
import { adminRegisterSchema } from "../modules/auth/validation/adminRegisterSchema";

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

  /**
   * Authenticates the user and initializes the session in global state.
   * @param email - User's email address
   * @param password - Plain text password
   * @param remember - Boolean to determine session persistence
   * @returns {Promise<boolean>} - True if login and redirect were successful
   */
  const loginUser = async (email: string, password: string, remember: boolean) => {
    //TODO: Implement 'remember me' persistence logic

    setErrors({});
    setLoading(true);

    try {
      // 1. Validate inputs
      userLoginSchema.parse({ email, password });

      // 2. Attempt login via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrors({ email: "E-Mail oder Passwort ist falsch" });
        toast.error("E-Mail oder Passwort ist falsch");
        return false;
      }

      // 3. Update global store
      // The User-Store must manually update for Navbar etc.
      setUser(data.user);

      toast.success("Erfolgreich eingeloggt 🎉");

      // 4. Navigation
      router.push("/dashboard");

      return true;
    } catch (err) {
      // Zod Validation Error (for UI)
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const path = issue.path[0];
          if (typeof path === "string") fieldErrors[path] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
      // Catch-all for Network Errors or Supbase Auth Failure
      toast.error("Ein unerwarteter Fehler ist aufgetreten.");
      return false;
    } finally {
      // Reset Loading to free the Login Button
      setLoading(false);
    }
  };

  const registerAdmin = async (formData: AdminRegisterFormData) => {
    setErrors({});
    setLoading(true);

    try {
      adminRegisterSchema.parse(formData);

      const [firstName, ...lastNameParts] = formData.fullName.split(" ");
      const lastName = lastNameParts.join(" ") || firstName;

      const res = await fetch("/api/auth/register/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName,
          lastName,
          tel: formData.tel,
          plz: formData.plz,
          city: formData.place,
          street: formData.street,
          companyName: formData.companyName,
          companyPlace: formData.companyPlace,
          companyPLZ: formData.companyPLZ,
          companyStreet: formData.companyStreet,
          companyMail: formData.companyMail,
          companyNumber: formData.companyNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ email: data.error || "Registrierung fehlgeschlagen" });
        toast.error(data.error || "Registrierung fehlgeschlagen");
        return false;
      }

      toast.success("Manager und Business erfolgreich registriert! Bitte bestätige deine E-Mail.");
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

  return {
    loading,
    errors,
    registerUser,
    registerAdmin,
    loginUser,
    setErrors,
  };
};
