import { z } from "zod";

// Today's date in Prague as YYYY-MM-DD (en-CA formats that way).
export const todayPrague = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague" }).format(new Date());

// Fields arrive as strings from the form; z.coerce.number() would turn an empty budget into 0, so check for empty first.
// imagePath is the Storage path of the optional photo (the file itself is not validated here). The format check is
// shape only; the server also checks the path is in the caller's own folder.
export const briefSchema = z.object({
  imagePath: z
    .string()
    .max(200)
    .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg)$/, { error: "Neplatný soubor." })
    .nullable(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Zadejte termín." })
    .refine((d) => new Date(`${d}T00:00:00Z`).toISOString().startsWith(d), { error: "Zadejte platné datum." })
    .refine((d) => d >= todayPrague(), { error: "Termín nesmí být v minulosti." }),
  budget: z
    .string()
    .trim()
    .min(1, { error: "Zadejte rozpočet." })
    .transform((s) => Math.round(Number(s.replace(",", "."))))
    .pipe(
      z
        .number({ error: "Rozpočet musí být číslo." })
        .min(1, { error: "Rozpočet musí být alespoň 1 Kč." })
        .max(1_000_000_000, { error: "Rozpočet je příliš vysoký." }),
    ),
  description: z
    .string()
    .trim()
    .min(1, { error: "Zadejte popis." })
    .max(1000, { error: "Popis může mít nejvýše 1000 znaků." }),
});
