"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeFor } from "@/lib/auth";
import { loginSchema, signUpSchema } from "@/lib/schemas/auth";

export type FormState = { error?: string } | undefined;

const GENERIC_ERROR = "Něco se nepovedlo. Zkuste to prosím znovu.";

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { role, name, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } });

  if (error) {
    return { error: error.code === "user_already_exists" ? "Účet s tímto e-mailem už existuje." : GENERIC_ERROR };
  }
  // With email confirmation off the user is logged in right away; without a session something is misconfigured.
  if (!data.session) return { error: GENERIC_ERROR };

  redirect(homeFor(role));
}

export async function logIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Nesprávný e-mail nebo heslo." };

  const { data: claims } = await supabase.auth.getClaims();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", claims?.claims.sub ?? "").single();
  redirect(profile ? homeFor(profile.role) : "/");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
