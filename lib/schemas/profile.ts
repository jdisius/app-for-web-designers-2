import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, { error: "Zadejte jméno." }).max(100, { error: "Jméno je příliš dlouhé." }),
  bio: z.string().trim().max(500, { error: "Popis může mít nejvýše 500 znaků." }),
});
