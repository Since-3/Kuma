"use client";
import { useState } from "react";
import AuthSidebarComponent from "../components/AuthSidebarComponent";
import InputComponent from "@/src/components/layout/InputComponent";
import { Button } from "@/src/components/ui/button";
import AuthButton from "../components/AuthButton";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useAuthFormStore } from "../../store/authFormState";
import { userRegisterStep1Schema } from "../../validation/userRegisterSchema";
import { ZodError } from "zod";
import DropdownComponent from "@/src/components/layout/DropdownComponent";
import { Spinner } from "@/src/components/ui/spinner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";

const RegisterUserView = () => {
  const [step, setStep] = useState(1);
  const { registerUser, loading, errors, setErrors } = useAuth();
  const router = useRouter();
  const formData = useAuthFormStore();

  const handleChange = (field: string, value: string) => {
    formData.setField(field, value);
  };

  const handleNext = () => {
    setErrors({});
    try {
      if (step === 1) {
        userRegisterStep1Schema.parse({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
        });
        setStep(2);
      }
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const path = issue.path[0];
          if (typeof path === "string") {
            fieldErrors[path] = issue.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleRegister = async () => {
    const success = await registerUser({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      passwordConfirm: formData.passwordConfirm,
      birthday: formData.birthday,
      plz: formData.plz,
      place: formData.place,
      street: formData.street,
      gender: formData.gender,
    });

    if (success) {
      formData.resetForm();
      router.push("/login");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-1/6 ">
        <div className="fixed p-4 left-0 top-0 h-screen w-1/2 z-10">
          <AuthSidebarComponent
            title="Werde zur besten Version deiner selbst"
            footer="info@since3.de"
            isSteps
            step={step}
            totalSteps={2}
            onStepChange={setStep}
          />
        </div>
      </div>

      <div className="w-full lg:w-5/6 lg:ml-auto flex justify-center items-center min-h-screen px-4">
        <div className="w-full max-w-lg flex flex-col gap-4 z-20">
          <h1 className="text-2xl font-extrabold text-blue mb-8 mt-8 ">Sign up for free</h1>

          {step === 1 && (
            <>
              <InputComponent
                isLabel
                label="Vor- und Nachname"
                type="text"
                id="register-user-fullName"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                error={errors.fullName}
              />
              <InputComponent
                isLabel
                label="E-Mail"
                type="email"
                id="register-user-email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={errors.email}
              />

              <InputComponent
                isLabel
                label="Passwort"
                type="password"
                id="register-user-password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                error={errors.password}
              />
              <InputComponent
                isLabel
                label="Passwort bestätigen"
                type="password"
                id="register-user-passwordConform"
                value={formData.passwordConfirm}
                onChange={(e) => handleChange("passwordConfirm", e.target.value)}
                error={errors.passwordConfirm}
              />

              <Button className="w-full mt-6" onClick={handleNext}>
                {loading ? <Spinner /> : "Weiter"}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <InputComponent
                isLabel
                label="Geburtsdatum"
                type="date"
                id="register-user-birthday"
                max={new Date().toISOString().split("T")[0]}
                value={formData.birthday}
                onChange={(e) => handleChange("birthday", e.target.value)}
                error={errors.birthday}
              />
              <InputComponent
                isLabel
                label="PLZ"
                type="text"
                id="register-user-plz"
                value={formData.plz}
                onChange={(e) => handleChange("plz", e.target.value)}
                error={errors.plz}
              />

              <InputComponent
                isLabel
                label="Wohnort"
                type="text"
                id="register-user-place"
                value={formData.place}
                onChange={(e) => handleChange("place", e.target.value)}
                error={errors.place}
              />
              <InputComponent
                isLabel
                label="Straße und Hausnummer"
                type="text"
                id="register-user-street"
                value={formData.street}
                onChange={(e) => handleChange("street", e.target.value)}
                error={errors.street}
              />

              <DropdownComponent
                label="Geschlecht"
                selected={formData.gender}
                onSelect={(value: string) => handleChange("gender", value)}
                error={errors.gender}
              />

              <Button onClick={handleRegister} disabled={loading} className="w-full mt-6">
                {loading ? <Spinner /> : "Anmelden"}
              </Button>
            </>
          )}

          <hr className="mt-6 border-blue" />

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <AuthButton Icon={FaGoogle} label="Login mit Google" />
            <AuthButton Icon={FaFacebook} label="Login mit Facebook" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-center mt-8 text-sm">
            <p>Ich habe schon einen Account</p>
            <p
              onClick={() => router.push("/login")}
              className="text-yellow hover:underline cursor-pointer"
            >
              Login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterUserView;
