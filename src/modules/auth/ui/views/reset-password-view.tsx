"use client";
import InputComponent from "@/src/components/layout/InputComponent";
import AuthSidebarComponent from "../components/AuthSidebarComponent";
import { Button } from "@/src/components/ui/button";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/src/components/ui/spinner";
import { createClient } from "@/src/lib/supabase/client";

const ResetPasswordView = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
      }
    });
  }, [router, supabase]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setPasswordError("");
    setConfirmPasswordError("");

    if (password.length < 8) {
      setPasswordError("Mindestens 8 Zeichen");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwörter stimmen nicht überein");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setPasswordError("Passwort konnte nicht gesetzt werden");
      setLoading(false);
      return;
    }

    setResetSuccess(true);

    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error("Sign out error:", signOutError);
    }

    setTimeout(() => {
      router.push("/login");
    }, 2500);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden lg:block lg:w-[40%] ">
        <div className="fixed left-0 top-0 h-screen w-[40%] p-2 z-10">
          <AuthSidebarComponent
            title="Neues Passwort setzen"
            description="Wählen Sie ein sicheres Passwort für Ihr Konto."
            footer="info@since3.de"
          />
        </div>
      </div>

      {/* Reset Password Formular */}
      <div className="w-full lg:w-[60%] lg:ml-auto flex justify-center items-center min-h-screen px-4">
        <div className="w-full max-w-lg flex flex-col gap-4 z-20">
          <h1 className="text-2xl font-extrabold text-blue mb-8">Passwort zurücksetzen</h1>

          <p className="text-sm text-gray-600 mb-4">
            Bitte geben Sie Ihr neues Passwort ein. Es sollte mindestens 8 Zeichen lang sein.
          </p>

          {!resetSuccess ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <InputComponent
                isLabel
                label="Neues Passwort"
                type="password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
              />

              <InputComponent
                isLabel
                label="Passwort bestätigen"
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={confirmPasswordError}
              />

              <Button type="submit" disabled={loading} className="w-full mt-6">
                {loading ? <Spinner /> : "Passwort zurücksetzen"}
              </Button>
            </form>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Passwort erfolgreich zurückgesetzt!
              </h2>
              <p className="text-sm text-green-700">
                Ihr Passwort wurde erfolgreich geändert. Sie werden in Kürze zum Login
                weitergeleitet.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 items-center mt-8 text-sm">
            <p>Zurück zum</p>
            <p
              className="text-yellow hover:underline cursor-pointer"
              onClick={() => router.push("/login")}
            >
              Login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordView;
