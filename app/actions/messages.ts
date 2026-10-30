"use server";

import { getCurrentUser } from "@/lib/auth";
import type { Tables } from "@/lib/database.types";
import { messageSchema } from "@/lib/schemas/message";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string } | { message: Tables<"messages"> };

// RLS decides who may write: only the two parties of the selection, and only as themselves.
export async function sendMessage(selectionId: string, body: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Nejste přihlášeni." };

  const parsed = messageSchema.safeParse({ selectionId, body });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ selection_id: parsed.data.selectionId, sender_id: user.id, body: parsed.data.body })
    .select()
    .single();
  if (error || !data) return { error: "Zprávu se nepodařilo odeslat. Zkuste to prosím znovu." };

  return { message: data };
}
