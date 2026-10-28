"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isOwnImagePath, thumbPathOf } from "@/lib/storage-paths";

// The browser has already uploaded the image and its thumbnail; this checks the paths and inserts the row.
// shortcut: does not check the files exist in Storage; add a list() check if clients are ever untrusted beyond RLS.
export async function addPortfolioItem(path: string): Promise<{ error?: string }> {
  const user = await requireRole("designer");

  const parsed = z.string().max(200).safeParse(path);
  if (!parsed.success || !isOwnImagePath(user.id, parsed.data)) return { error: "Neplatný soubor." };

  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_items").insert({ designer_id: user.id, image_url: parsed.data });
  if (error) {
    await supabase.storage.from("portfolio").remove([parsed.data, thumbPathOf(parsed.data)]);
    return { error: "Obrázek se nepodařilo uložit. Zkuste to prosím znovu." };
  }

  revalidatePath("/profile");
  return {};
}
