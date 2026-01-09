"use client";
import { useState } from "react";
import AuthSidebarComponent from "../components/AuthSidebarComponent";
import InputComponent from "@/src/components/layout/InputComponent";
import { Button } from "@/src/components/ui/button";
import { useAuthFormStore } from "../../store/authFormState";
import { useAuth } from "@/src/hooks/useAuth";
import { ZodError } from "zod";
import {
  adminRegisterStep1Schema,
  adminRegisterStep2Schema,
  adminRegisterStep3Schema,
} from "../../validation/adminRegisterSchema";
import { Spinner } from "@/src/components/ui/spinner";
import { useRouter } from "next/navigation";

const RegisterAdmin = () => {
  const [step, setStep] = useState(1);
  const { registerAdmin, loading, errors, setErrors } = useAuth();
  const router = useRouter();
  const formData = useAuthFormStore();

  const handleChange = (field: string, value: string) => {
    formData.setField(field, value);
  };

  const handleNext = () => {
    setErrors({});
    try {
      if (step === 1) {
        adminRegisterStep1Schema.parse({
          fullName: formData.fullName,
          email: formData.email,
          tel: formData.tel,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
        });
        setStep(2);
      } else if (step === 2) {
        adminRegisterStep2Schema.parse({
          plz: formData.plz,
          place: formData.place,
          street: formData.street,
        });
        setStep(3);
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
    setErrors({});
    try {
      adminRegisterStep3Schema.parse({
        companyName: formData.companyName,
        companyPlace: formData.companyPlace,
        companyPLZ: formData.companyPLZ,
        companyStreet: formData.companyStreet,
        companyMail: formData.companyMail,
        companyNumber: formData.companyNumber,
      });

      const success = await registerAdmin({
        fullName: formData.fullName,
        email: formData.email,
        tel: formData.tel,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        plz: formData.plz,
        place: formData.place,
        street: formData.street,
        companyName: formData.companyName,
        companyPlace: formData.companyPlace,
        companyPLZ: formData.companyPLZ,
        companyStreet: formData.companyStreet,
        companyMail: formData.companyMail,
        companyNumber: formData.companyNumber,
      });

      if (success) {
        formData.resetForm();
        router.push("/login");
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

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block lg:w-[40%]">
        <div className="fixed left-0 top-0 h-screen w-[40%] p-2 z-10">
          <AuthSidebarComponent
            title="Werde zur besten Version deiner selbst"
            footer="info@since3.de"
            isSteps
            step={step}
            totalSteps={3}
            onStepChange={setStep}
          />
        </div>
      </div>

      <div className="w-full lg:w-[60%] lg:ml-auto flex justify-center items-center min-h-screen px-4">
        <div className="w-full max-w-lg flex flex-col gap-4 z-20">
          <h1 className="text-2xl font-extrabold text-blue mb-8 mt-8 ">Sign up for free</h1>

          {step === 1 && (
            <>
              <InputComponent
                isLabel
                label="Vor- und Nachname"
                type="text"
                id="register-admin-fullName"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                error={errors.fullName}
              />
              <InputComponent
                isLabel
                label="E-Mail"
                type="email"
                id="register-admin-email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={errors.email}
              />
              <InputComponent
                isLabel
                label="Telefonnummer"
                type="text"
                id="register-admin-tel"
                value={formData.tel}
                onChange={(e) => handleChange("tel", e.target.value)}
                error={errors.tel}
              />
              <InputComponent
                isLabel
                label="Passwort"
                type="password"
                id="register-admin-password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                error={errors.password}
              />
              <InputComponent
                isLabel
                label="Passwort bestätigen"
                type="password"
                id="register-admin-passwordConform"
                value={formData.passwordConfirm}
                onChange={(e) => handleChange("passwordConfirm", e.target.value)}
                error={errors.passwordConfirm}
              />

              <Button className="w-full mt-6" onClick={handleNext} disabled={loading}>
                {loading ? <Spinner /> : "Weiter"}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <InputComponent
                isLabel
                label="PLZ"
                type="text"
                id="register-admin-plz"
                value={formData.plz}
                onChange={(e) => handleChange("plz", e.target.value)}
                error={errors.plz}
              />

              <InputComponent
                isLabel
                label="Wohnort"
                type="text"
                id="register-admin-place"
                value={formData.place}
                onChange={(e) => handleChange("place", e.target.value)}
                error={errors.place}
              />
              <InputComponent
                isLabel
                label="Straße und Hausnummer"
                type="text"
                id="register-admin-street"
                value={formData.street}
                onChange={(e) => handleChange("street", e.target.value)}
                error={errors.street}
              />

              <Button className="w-full mt-6" onClick={handleNext} disabled={loading}>
                {loading ? <Spinner /> : "Weiter"}
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <InputComponent
                isLabel
                label="Unternehmensname"
                type="text"
                id="register-admin-companyName"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                error={errors.companyName}
              />
              <InputComponent
                isLabel
                label="Unternehmenssitz"
                type="text"
                id="register-admin-companyPlace"
                value={formData.companyPlace}
                onChange={(e) => handleChange("companyPlace", e.target.value)}
                error={errors.companyPlace}
              />

              <InputComponent
                isLabel
                label="PLZ"
                type="text"
                id="register-admin-companyPLZ"
                value={formData.companyPLZ}
                onChange={(e) => handleChange("companyPLZ", e.target.value)}
                error={errors.companyPLZ}
              />
              <InputComponent
                isLabel
                label="Straße und Hausnummer"
                type="text"
                id="register-admin-companyStreet"
                value={formData.companyStreet}
                onChange={(e) => handleChange("companyStreet", e.target.value)}
                error={errors.companyStreet}
              />
              <InputComponent
                isLabel
                label="Geschäftsmail (falls unterschiedlich)"
                type="email"
                id="register-admin-companyMail"
                value={formData.companyMail}
                onChange={(e) => handleChange("companyMail", e.target.value)}
                error={errors.companyMail}
              />
              <InputComponent
                isLabel
                label="Geschäftsnummer (falls unterschiedlich)"
                type="text"
                id="register-admin-companyNumber"
                value={formData.companyNumber}
                onChange={(e) => handleChange("companyNumber", e.target.value)}
                error={errors.companyNumber}
              />

              <Button className="w-full mt-6" onClick={handleRegister} disabled={loading}>
                {loading ? <Spinner /> : "Anmelden"}
              </Button>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-2 items-center mt-8 text-sm">
            <p>Ich habe schon einen Account</p>
            <p onClick={() => router.push("/login")} className="text-blue underline cursor-pointer">
              Login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterAdmin;
