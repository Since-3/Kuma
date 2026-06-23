import { z } from "zod";

// Helper function to validate international phone numbers
const isValidPhoneNumber = (phone: string): boolean => {
  // Check if phone starts with + and has at least country code and number
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Step 1: Personal Info
const adminRegisterStep1Base = z.object({
  fullName: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben"),
  tel: z
    .string()
    .min(1, "Telefonnummer ist erforderlich")
    .refine((val) => isValidPhoneNumber(val), {
      message: "Bitte eine gültige Telefonnummer eingeben",
    }),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
  passwordConfirm: z.string(),
});

export const adminRegisterStep1Schema = adminRegisterStep1Base.refine(
  (data) => data.password === data.passwordConfirm,
  {
    message: "Passwürter müssen übereinstimmen",
    path: ["passwordConfirm"],
  }
);

// Step 2: Address Info
export const adminRegisterStep2Schema = z.object({
  plz: z.string().min(5, "PLZ muss 5 Zeichen lang sein").max(5, "PLZ muss 5 Zeichen lang sein"),
  place: z.string().min(2, "Wohnort muss mindestens 2 Zeichen lang sein"),
  street: z.string().min(3, "Straße und Hausnummer müssen mindestens 3 Zeichen lang sein"),
});

// Step 3: Business Info
const adminRegisterStep3Base = z.object({
  companyName: z.string().min(2, "Unternehmensname muss mindestens 2 Zeichen lang sein"),
  companyPlace: z.string().min(2, "Unternehmenssitz muss mindestens 2 Zeichen lang sein"),
  companyPLZ: z
    .string()
    .min(5, "PLZ muss 5 Zeichen lang sein")
    .max(5, "PLZ muss 5 Zeichen lang sein"),
  companyStreet: z.string().min(3, "Straße und Hausnummer müssen mindestens 3 Zeichen lang sein"),
  companyMail: z
    .string()
    .email("Bitte eine gültige E-Mail-Adresse eingeben")
    .optional()
    .or(z.literal("")),
  companyNumber: z.string().optional().or(z.literal("")),
});

export const adminRegisterStep3Schema = adminRegisterStep3Base.refine(
  (data) => {
    if (!data.companyNumber || data.companyNumber === "") return true;
    return isValidPhoneNumber(data.companyNumber);
  },
  {
    message: "Bitte eine gültige Telefonnummer eingeben",
    path: ["companyNumber"],
  }
);

// Full schema for complete validation — extend base shapes, then apply refinements
export const adminRegisterSchema = adminRegisterStep1Base
  .extend(adminRegisterStep2Schema.shape)
  .extend(adminRegisterStep3Base.shape)
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwürter müssen übereinstimmen",
    path: ["passwordConfirm"],
  })
  .refine(
    (data) => {
      if (!data.companyNumber || data.companyNumber === "") return true;
      return isValidPhoneNumber(data.companyNumber);
    },
    {
      message: "Bitte eine gültige Telefonnummer eingeben",
      path: ["companyNumber"],
    }
  );

export type AdminRegisterFormData = z.infer<typeof adminRegisterSchema>;
