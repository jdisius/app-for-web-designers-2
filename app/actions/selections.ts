"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Stable error messages raised by the select_designer RPC, mapped to Czech.
const ERRORS: Record<string, string> = {
  brief_taken: "Zakázka už je obsazená.",
  designer_not_interested: "Tento designér o zakázku nemá zájem.",
  brief_not_found: "Zakázka nenalezena.",
  not_brief_owner: "Zakázka nenalezena.",
};

export async function selectDesigner(briefId: string, designerId: string): Promise<{ error: string }> {
  await requireRole("customer");
  const parsed = z.object({ briefId: z.uuid(), designerId: z.uuid() }).safeParse({ briefId, designerId });
  if (!parsed.success) return { error: "Zakázka nenalezena." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("select_designer", {
    p_brief_id: parsed.data.briefId,
    p_designer_id: parsed.data.designerId,
  });
  if (error) return { error: ERRORS[error.message] ?? "Výběr se nepodařil. Zkuste to prosím znovu." };

  revalidatePath("/designers");
  revalidatePath("/briefs/new");
  redirect("/chats"); // the chat page itself comes in step 12
}
