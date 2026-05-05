"use client";
import { useState } from "react";
import AuthSidebarComponent from "../components/AuthSidebarComponent";
import InputComponent from "@/src/components/layout/InputComponent";
import AddressAutocompleteComponent from "@/src/components/layout/AddressAutocompleteComponent";
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
  // ------------- States -------------
  // Controls multi-step registration flow
  const [step, setStep] = useState(1);

  // ------------- Hooks -------------
  const { registerUser, loading, errors, setErrors } = useAuth();
  const router = useRouter();
  const formData = useAuthFormStore();

  // Generic handler to update form state
  const handleChange = (field: string, value: string) => {
    formData.setField(field, value);
  };

  /**
   * Handles step 1 validation before moving to step 2
   *
   * Uses Zod schema to validate user input
   * Maps validation errors to UI-friendly error-object.
   *
   * @param {React.FormEvent} e - Form submit event
   */
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
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
      // Transform Zod erros into field-based error object
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

  /**
   * Final registration handler
   *
   * - Sends full form data to backend
   * - Resets form on success
   * - Redirects user to login
   *
   * @param {React.FormEvent} e - Form submit event
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Clear persisted form state
      formData.resetForm();
      router.push("/login");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar with step indicator */}
      <div className="hidden lg:block lg:w-[40%]">
        <div className="hidden lg:block fixed left-0 top-0 h-screen w-[40%] p-2 z-10">
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

      {/* Main registration form */}
      <div className="w-full lg:w-[60%] lg:ml-auto flex justify-center items-center min-h-screen px-4">
        <div className="w-full max-w-lg flex flex-col gap-4 z-20">
          <h1 className="text-2xl font-extrabold text-blue mb-8 mt-8 ">Sign up for free</h1>

          {/* Step 1: Basic account data */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-5">
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
                id="register-user-passwordConfirm"
                value={formData.passwordConfirm}
                onChange={(e) => handleChange("passwordConfirm", e.target.value)}
                error={errors.passwordConfirm}
              />

              <Button className="w-full mt-6" type="submit">
                {loading ? <Spinner /> : "Weiter"}
              </Button>
            </form>
          )}

          {/* Step 2: Additional user details */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <InputComponent
                isLabel
                label="Geburtsdatum"
                type="date"
                id="register-user-birthday"
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
                value={formData.birthday}
                onChange={(e) => handleChange("birthday", e.target.value)}
                error={errors.birthday}
              />
              <AddressAutocompleteComponent
                idPrefix="register-user"
                streetValue={formData.street}
                plzValue={formData.plz}
                placeValue={formData.place}
                onStreetChange={(v) => handleChange("street", v)}
                onPlzChange={(v) => handleChange("plz", v)}
                onPlaceChange={(v) => handleChange("place", v)}
                onSelect={({ street, plz, place }) => {
                  // Autofill address fields from selection
                  handleChange("street", street);
                  handleChange("plz", plz);
                  handleChange("place", place);
                }}
                streetError={errors.street}
                plzError={errors.plz}
                placeError={errors.place}
              />

              <DropdownComponent
                label="Geschlecht"
                selected={formData.gender}
                onSelect={(value: string) => handleChange("gender", value)}
                error={errors.gender}
              />

              <Button type="submit" disabled={loading} className="w-full mt-6">
                {loading ? <Spinner /> : "Anmelden"}
              </Button>
            </form>
          )}

          <hr className="mt-6 border-blue" />

          {/* Social login options */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <AuthButton Icon={FaGoogle} label="Login mit Google" />
            <AuthButton Icon={FaFacebook} label="Login mit Facebook" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-center mt-8 text-sm">
            <p>Ich habe schon einen Account</p>
            <p
              onClick={() => router.push("/login")}
              className="text-blue  underline cursor-pointer"
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
