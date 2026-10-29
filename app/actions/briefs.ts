"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { briefSchema } from "@/lib/schemas/brief";
import { isOwnImagePath, thumbPathOf } from "@/lib/storage-paths";

type Result = { error?: string };

// The photo is optional. If there is one, the browser has already uploaded it and its thumbnail; this validates everything and inserts the row.
export async function createBrief(fields: Record<string, string | null>): Promise<Result> {
  const user = await requireRole("customer");
  const supabase = await createClient();

  const parsed = briefSchema.safeParse(fields);
  // Clean up only a path in the caller's own folder, so a forged path cannot delete someone else's file.
  const remove = async () => {
    const path = typeof fields.imagePath === "string" ? fields.imagePath : null;
    if (path && isOwnImagePath(user.id, path)) {
      await supabase.storage.from("briefs").remove([path, thumbPathOf(path)]);
    }
  };

  if (!parsed.success) {
    await remove();
    return { error: parsed.error.issues[0].message };
  }
  const { imagePath, ...rest } = parsed.data;
  if (imagePath !== null && !isOwnImagePath(user.id, imagePath)) return { error: "Neplatný soubor." };

  const { error } = await supabase.from("briefs").insert({ customer_id: user.id, image_url: imagePath, ...rest });
  if (error) {
    await remove();
    return { error: "Zakázku se nepodařilo uložit. Zkuste to prosím znovu." };
  }

  revalidatePath("/briefs/new");
  return {};
}
