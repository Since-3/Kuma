import { z } from "zod";

export const userLoginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen enthalten"),
});

export type UserLoginSchema = z.infer<typeof userLoginSchema>;
