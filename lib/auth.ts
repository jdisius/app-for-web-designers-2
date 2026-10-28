import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Role = Database["public"]["Enums"]["user_role"];

export const homeFor = (role: Role) => (role === "designer" ? "/swipe" : "/briefs/new");

// The role comes from profiles.role, never from user_metadata (users can edit that).
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims.sub;
  if (!id) return null;

  const { data: profile } = await supabase.from("profiles").select("role, name").eq("id", id).single();
  return profile ? { id, ...profile } : null;
});

export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}
