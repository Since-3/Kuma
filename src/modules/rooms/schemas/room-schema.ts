import { z } from "zod";

export const roomSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
});

export type RoomFormData = z.infer<typeof roomSchema>;
