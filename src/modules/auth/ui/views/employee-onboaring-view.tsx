"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ZodError, z } from "zod";
import AuthSidebarComponent from "../components/AuthSidebarComponent";
import InputComponent from "@/src/components/layout/InputComponent";
import PhoneInputComponent from "@/src/components/layout/PhoneInputComponent";
import DropdownComponent from "@/src/components/layout/DropdownComponent";
import ImageUploadComponent from "@/src/components/layout/ImageUploadComponent";
import { Button } from "@/src/components/ui/button";
import { Spinner } from "@/src/components/ui/spinner";
import {
  getEmployeeByOnboardingToken,
  completeEmployeeOnboarding,
} from "@/src/modules/employee/actions/employee-actions";
import { toast } from "sonner";

const step1Schema = z
  .object({
    firstName: z.string().min(2, "Vorname ist zu kurz"),
    lastName: z.string().min(2, "Nachname ist zu kurz"),
    tel: z.string().min(5, "Telefonnummer ist erforderlich"),
    password: z
      .string()
      .min(8)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d.@$!%*?&]+$/,
        "Passwort muss mindestens 8 Zeichen, Groß-/Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten"
      ),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwörter stimmen nicht überein",
    path: ["passwordConfirm"],
  });

const step2Schema = z.object({
  gender: z
    .enum(["Men", "Woman", "Various"])
    .or(z.literal(""))
    .refine((val) => val !== "", { message: "Geschlecht ist erforderlich" }),
  qualification: z.string().min(1, "Qualifikation ist erforderlich"),
});

const EmployeeOnboardingView = () => {
  const params = useParams();
  const router = useRouter();
  const token = params?.onboardingToken as string;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tel, setTel] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [gender, setGender] = useState("");
  const [qualification, setQualification] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenError("Kein Onboarding-Token gefunden");
        setTokenLoading(false);
        return;
      }
      const result = await getEmployeeByOnboardingToken(token);
      if (!result.success) {
        setTokenError(result.error || "Ungültiger Link");
      } else {
        setEmployeeEmail(result.employee!.email);
      }
      setTokenLoading(false);
    };
    checkToken();
  }, [token]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      step1Schema.parse({ firstName, lastName, tel, password, passwordConfirm });
      setStep(2);
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const path = issue.path[0];
          if (typeof path === "string") fieldErrors[path] = issue.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      step2Schema.parse({ gender, qualification });
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const path = issue.path[0];
          if (typeof path === "string") fieldErrors[path] = issue.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);

    let pbSrc: string | undefined;
    if (avatarFile) {
      try {
        const formData = new FormData();
        formData.append("file", avatarFile);
        formData.append("token", token);
        const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        pbSrc = json.publicUrl;
      } catch {
        toast.error("Fehler beim Hochladen des Profilbilds");
        setLoading(false);
        return;
      }
    }

    const result = await completeEmployeeOnboarding(token, {
      firstName,
      lastName,
      tel,
      password,
      gender,
      qualification,
      pbSrc,
    });
    setLoading(false);

    if (result.success) {
      toast.success("Account erfolgreich erstellt! Du kannst dich jetzt einloggen.");
      router.push("/login");
    } else {
      toast.error(result.error || "Ein Fehler ist aufgetreten");
    }
  };

  if (tokenLoading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex min-h-screen justify-center items-center flex-col gap-4 px-4">
        <h1 className="text-2xl font-bold text-red-500">{tokenError}</h1>
        <p className="text-gray-500 text-center">
          Bitte wende dich an deinen Manager für einen neuen Onboarding-Link.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block lg:w-[40%]">
        <div className="fixed left-0 top-0 h-screen w-[40%] p-2 z-10">
          <AuthSidebarComponent
            title="Werde Teil unseres Teams"
            footer="info@since3.de"
            isSteps
            step={step}
            totalSteps={2}
            onStepChange={setStep}
          />
        </div>
      </div>

      <div className="w-full lg:w-[60%] lg:ml-auto flex justify-center items-center min-h-screen px-4">
        <div className="w-full max-w-lg flex flex-col gap-4 z-20">
          <h1 className="text-2xl font-extrabold text-blue mb-2 mt-8">Herzlich Willkommen!</h1>
          <p className="text-gray-500 mb-6">{employeeEmail}</p>

          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-5">
              <div className="flex gap-4">
                <InputComponent
                  isLabel
                  label="Vorname"
                  type="text"
                  id="onboarding-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={errors.firstName}
                />
                <InputComponent
                  isLabel
                  label="Nachname"
                  type="text"
                  id="onboarding-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  error={errors.lastName}
                />
              </div>
              <PhoneInputComponent
                isLabel
                label="Telefonnummer"
                id="onboarding-tel"
                value={tel}
                onChange={(val) => setTel(val)}
                error={errors.tel}
              />
              <InputComponent
                isLabel
                label="Passwort"
                type="password"
                id="onboarding-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              <InputComponent
                isLabel
                label="Passwort bestätigen"
                type="password"
                id="onboarding-passwordConfirm"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                error={errors.passwordConfirm}
              />
              <Button className="w-full mt-6" type="submit">
                Weiter
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-500 mb-3">Profilbild (optional)</p>
                <ImageUploadComponent
                  value={avatarFile}
                  preview={avatarPreview}
                  onChange={(file, preview) => {
                    setAvatarFile(file);
                    setAvatarPreview(preview);
                  }}
                />
              </div>
              <DropdownComponent
                label="Geschlecht"
                selected={gender}
                onSelect={(value: string) => setGender(value)}
                error={errors.gender}
              />
              <InputComponent
                isLabel
                label="Qualifikation"
                type="text"
                id="onboarding-qualification"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                error={errors.qualification}
              />
              <Button type="submit" disabled={loading} className="w-full mt-6">
                {loading ? <Spinner /> : "Account erstellen"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboardingView;
