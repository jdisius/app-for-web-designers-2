import { z } from "zod";

export const roleSchema = z.enum(["designer", "customer"]);

const email = z.email({ error: "Zadejte platný e-mail." });
const password = z.string().min(8, { error: "Heslo musí mít alespoň 8 znaků." });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Zadejte heslo." }),
});

export const signUpSchema = z
  .object({
    role: roleSchema,
    name: z.string().trim().min(1, { error: "Zadejte jméno." }).max(100, { error: "Jméno je příliš dlouhé." }),
    email,
    password,
    passwordRepeat: z.string(),
  })
  .refine((d) => d.password === d.passwordRepeat, {
    error: "Hesla se neshodují.",
    path: ["passwordRepeat"],
  });
