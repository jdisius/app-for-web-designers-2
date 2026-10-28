"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/schemas/profile";

export type ProfileState = { error?: string; saved?: boolean } | undefined;

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Nejste přihlášeni." };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { error: "Uložení se nepovedlo. Zkuste to prosím znovu." };

  revalidatePath("/profile");
  return { saved: true };
}
