"use client";
import React, { useState } from "react";
import AuthSidebarComponent from "../components/AuthSidebarComponent";
import InputComponent from "@/src/components/layout/InputComponent";
import AddressAutocompleteComponent from "@/src/components/layout/AddressAutocompleteComponent";
import PhoneInputComponent from "@/src/components/layout/PhoneInputComponent";
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

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <div className="hidden lg:block fixed left-0 top-0 h-screen w-[40%] p-2 z-10">
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
            <form onSubmit={handleNext} className="space-y-5">
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
              <PhoneInputComponent
                isLabel
                label="Telefonnummer"
                id="register-admin-tel"
                value={formData.tel}
                onChange={(value) => handleChange("tel", value || "")}
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

              <Button className="w-full mt-6" type="submit" disabled={loading}>
                {loading ? <Spinner /> : "Weiter"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNext} className="space-y-5">
              <AddressAutocompleteComponent
                idPrefix="register-admin"
                streetValue={formData.street}
                plzValue={formData.plz}
                placeValue={formData.place}
                onStreetChange={(v) => handleChange("street", v)}
                onPlzChange={(v) => handleChange("plz", v)}
                onPlaceChange={(v) => handleChange("place", v)}
                onSelect={({ street, plz, place }) => {
                  handleChange("street", street);
                  handleChange("plz", plz);
                  handleChange("place", place);
                }}
                streetError={errors.street}
                plzError={errors.plz}
                placeError={errors.place}
              />

              <Button className="w-full mt-6" type="submit" disabled={loading}>
                {loading ? <Spinner /> : "Weiter"}
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <InputComponent
                isLabel
                label="Unternehmensname"
                type="text"
                id="register-admin-companyName"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                error={errors.companyName}
              />
              <AddressAutocompleteComponent
                idPrefix="register-admin-company"
                streetValue={formData.companyStreet}
                plzValue={formData.companyPLZ}
                placeValue={formData.companyPlace}
                onStreetChange={(v) => handleChange("companyStreet", v)}
                onPlzChange={(v) => handleChange("companyPLZ", v)}
                onPlaceChange={(v) => handleChange("companyPlace", v)}
                onSelect={({ street, plz, place }) => {
                  handleChange("companyStreet", street);
                  handleChange("companyPLZ", plz);
                  handleChange("companyPlace", place);
                }}
                streetError={errors.companyStreet}
                plzError={errors.companyPLZ}
                placeError={errors.companyPlace}
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
              <PhoneInputComponent
                isLabel
                label="Geschäftsnummer (falls unterschiedlich)"
                id="register-admin-companyNumber"
                value={formData.companyNumber}
                onChange={(value) => handleChange("companyNumber", value || "")}
                error={errors.companyNumber}
              />

              <Button className="w-full mt-6" type="submit" disabled={loading}>
                {loading ? <Spinner /> : "Anmelden"}
              </Button>
            </form>
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
