import { z } from "zod";

export const userRegisterStep1Schema = z
  .object({
    fullName: z.string().min(2, "Name ist zu kurz"),
    email: z.string().email("Ungültige E-Mail-Adresse"),
    password: z
      .string()
      .min(8)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d.@$!%*?&]+$/,
        "Passwort muss mindestens 8 Zeichen haben, Großbuchstaben, Kleinbuchstaben, Nummer und ein spezielles Zeichen beinhalten"
      ),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwörter stimmen nicht überein",
    path: ["passwordConfirm"],
  });

export const userRegisterSchema = z
  .object({
    fullName: z.string().min(2, "Name ist zu kurz"),
    email: z.string().email("Ungültige E-Mail-Adresse"),
    password: z
      .string()
      .min(8)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d.@$!%*?&]+$/,
        "Passwort muss mindestens 8 Zeichen haben, Großbuchstaben, Kleinbuchstaben, Nummer und ein spezielles Zeichen beinhalten"
      ),
    passwordConfirm: z.string(),
    birthday: z.iso
      .date({
        message: "Ungültiges Datumsformat",
      })
      .refine(
        (date) => {
          const selectedDate = new Date(date);
          selectedDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return selectedDate <= today;
        },
        {
          message: "Geburtsdatum darf nicht in der Zukunft liegen",
        }
      ),
    plz: z.string().min(1, "PLZ erforderlich"),
    place: z.string().min(1, "Wohnort erforderlich"),
    street: z.string().min(1, "Straße erforderlich"),
    gender: z
      .enum(["Men", "Woman", "Various"])
      .or(z.literal(""))
      .refine((val) => val !== "", {
        message: "Geschlecht ist erforderlich",
      }),
    role: z.literal("user").optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwörter stimmen nicht überein",
    path: ["passwordConfirm"],
  });

export type UserRegisterSchema = z.infer<typeof userRegisterSchema>;
