import { z } from "zod";

export const messageSchema = z.object({
  selectionId: z.uuid(),
  body: z
    .string()
    .trim()
    .min(1, { error: "Napište zprávu." })
    .max(1000, { error: "Zpráva může mít nejvýše 1000 znaků." }),
});
