"use client";
import InputComponent from "@/src/components/layout/InputComponent";
import AuthButton from "../components/AuthButton";
import AuthSidebarComponent from "../components/AuthSidebarComponent";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/src/lib/supabaseClient";
import { Spinner } from "@/src/components/ui/spinner";

const LoginView = () => {
  //TODO: RIGHT LOGIN with Schema etc.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Login Error:", error.message);
        setError("E-Mail oder Passwort ist falsch");
        setLoading(false);
        return;
      }

      // Optional: Session speichern
      if (remember) {
        localStorage.setItem("since3_remember_me", "true");
      } else {
        localStorage.removeItem("since3_remember_me");
      }

      // Redirect nach Login
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-1/6 ">
        <div className="fixed p-4 left-0 top-0 h-screen w-1/2 z-10">
          <AuthSidebarComponent
            title="Deine Reise beginnt hier"
            description="Werde Teil einer Plattform, die Trainer und Lernende zusammenbringt."
            footer="info@since3.de"
          />
        </div>
      </div>

      {/* Login-Formular */}
      <div className="w-full lg:w-5/6 lg:ml-auto flex justify-center items-center min-h-screen px-4">
        <div className="w-full max-w-lg flex flex-col gap-4 z-20">
          <h1 className="text-2xl font-extrabold text-blue mb-8 ">Login</h1>

          <InputComponent
            isLabel
            label="E-mail Adresse"
            type="email"
            id="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputComponent
            isLabel
            label="Passwort"
            type="password"
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={handleLogin} disabled={loading} className="w-full mt-6">
            {loading ? <Spinner /> : "Weiter"}
          </Button>

          <div className="flex flex-col sm:flex-row sm:justify-between w-full mt-6 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remembering"
                checked={remember}
                onCheckedChange={(val: boolean) => setRemember(val)}
                className="shadow-none h-5 w-5 bg-white border-blue cursor-pointer"
              />
              <Label htmlFor="remembering" className="cursor-pointer">
                Beim nächsten Mal an mich erinnern
              </Label>
            </div>
            <p className="hover:underline cursor-pointer text-blue">Passwort vergessen?</p>
          </div>

          <hr className="mt-6 border-blue" />

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <AuthButton Icon={FaGoogle} label="Login mit Google" />
            <AuthButton Icon={FaFacebook} label="Login mit Facebook" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-center mt-16 text-sm">
            <p>Ich habe noch keinen Account</p>
            <p
              className="text-yellow hover:underline cursor-pointer"
              onClick={() => router.push("/register")}
            >
              Sign Up
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
