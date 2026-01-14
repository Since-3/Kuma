"use client";
import InputComponent from "@/src/components/layout/InputComponent";
import AuthSidebarComponent from "../components/AuthSidebarComponent";
import { Button } from "@/src/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/src/components/ui/spinner";
import { createClient } from "@/src/lib/supabase/client";

const ForgotPasswordView = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setLoading(true);

    if (!email) {
      setEmailError("Bitte E-Mail-Adresse eingeben");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setEmailError("E-Mail konnte nicht gesendet werden");
    } else {
      setEmailSent(true);
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden lg:block lg:w-[40%] ">
        <div className="fixed left-0 top-0 h-screen w-[40%] p-2 z-10">
          <AuthSidebarComponent
            title="Passwort zurücksetzen"
            description="Keine Sorge, wir helfen Ihnen dabei, wieder Zugang zu Ihrem Konto zu erhalten."
            footer="info@since3.de"
          />
        </div>
      </div>

      {/* Forgot Password Formular */}
      <div className="w-full lg:w-5/6 lg:ml-auto flex justify-center items-center min-h-screen px-4">
        <div className="w-full max-w-lg flex flex-col gap-4 z-20">
          <h1 className="text-2xl font-extrabold text-blue mb-8">Passwort vergessen?</h1>

          <p className="text-sm text-gray-600 mb-4">
            Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres
            Passworts.
          </p>

          {!emailSent ? (
            <form onSubmit={handleReset} className="space-y-5">
              <InputComponent
                isLabel
                label="E-mail Adresse"
                type="email"
                id="forgot-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
              />

              <Button type="submit" disabled={loading} className="w-full mt-6">
                {loading ? <Spinner /> : "Link zum Zurücksetzen senden"}
              </Button>
            </form>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">E-Mail wurde versendet!</h2>
              <p className="text-sm text-green-700">
                Wir haben Ihnen einen Link zum Zurücksetzen Ihres Passworts an{" "}
                <strong>{email}</strong> gesendet. Bitte überprüfen Sie Ihr Postfach und folgen Sie
                den Anweisungen in der E-Mail.
              </p>
              <p className="text-xs text-green-600 mt-4">
                Hinweis: Der Link ist 60 Minuten gültig. Falls Sie keine E-Mail erhalten haben,
                überprüfen Sie bitte Ihren Spam-Ordner.
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

export default ForgotPasswordView;
