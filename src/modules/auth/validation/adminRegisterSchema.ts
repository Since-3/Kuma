import { z } from "zod";

// Helper function to validate international phone numbers
const isValidPhoneNumber = (phone: string): boolean => {
  // Check if phone starts with + and has at least country code and number
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Step 1: Personal Info
export const adminRegisterStep1Schema = z
  .object({
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
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwürter müssen übereinstimmen",
    path: ["passwordConfirm"],
  });

// Step 2: Address Info
export const adminRegisterStep2Schema = z.object({
  plz: z.string().min(5, "PLZ muss 5 Zeichen lang sein").max(5, "PLZ muss 5 Zeichen lang sein"),
  place: z.string().min(2, "Wohnort muss mindestens 2 Zeichen lang sein"),
  street: z.string().min(3, "Straße und Hausnummer müssen mindestens 3 Zeichen lang sein"),
});

// Step 3: Business Info
export const adminRegisterStep3Schema = z.object({
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
  companyNumber: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val || val === "") return true;
        return isValidPhoneNumber(val);
      },
      {
        message: "Bitte eine gültige Telefonnummer eingeben",
      }
    ),
});

// Full schema for complete validation
export const adminRegisterSchema = adminRegisterStep1Schema
  .merge(adminRegisterStep2Schema)
  .merge(adminRegisterStep3Schema);

export type AdminRegisterFormData = z.infer<typeof adminRegisterSchema>;
