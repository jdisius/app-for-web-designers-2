"use server";

import { z } from "zod";
import { requireReadyDesigner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Swipes are final: RLS allows only INSERT, and only on open briefs. A repeated swipe (unique violation) counts as done.
export async function swipeBrief(briefId: string, liked: boolean): Promise<{ error?: string }> {
  const user = await requireReadyDesigner();
  const parsed = z.object({ briefId: z.uuid(), liked: z.boolean() }).safeParse({ briefId, liked });
  if (!parsed.success) return { error: "Zakázka nenalezena." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("swipes")
    .insert({ designer_id: user.id, brief_id: parsed.data.briefId, liked: parsed.data.liked });
  if (error && error.code !== "23505") {
    return { error: "Zakázka už není dostupná nebo se akci nepodařilo uložit." };
  }
  return {};
}
