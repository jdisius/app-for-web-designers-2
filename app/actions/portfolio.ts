"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPortfolioCount, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PORTFOLIO_MAX, PORTFOLIO_MIN } from "@/lib/portfolio";
import { isOwnImagePath, thumbPathOf } from "@/lib/storage-paths";

type Result = { error?: string };

function refresh() {
  revalidatePath("/profile");
  revalidatePath("/onboarding");
}

// The browser has already uploaded the image and its thumbnail; this checks the paths and inserts the row.
// shortcut: does not check the files exist in Storage; add a list() check if that ever matters.
// shortcut: the 6-image cap is checked here, not in the DB, so two parallel uploads could pass 6; add a trigger if that matters.
export async function addPortfolioItem(path: string): Promise<Result> {
  const user = await requireRole("designer");
  const supabase = await createClient();

  const parsed = z.string().max(200).safeParse(path);
  if (!parsed.success || !isOwnImagePath(user.id, parsed.data)) return { error: "Neplatný soubor." };

  const remove = () => supabase.storage.from("portfolio").remove([parsed.data!, thumbPathOf(parsed.data!)]);

  if ((await getPortfolioCount(user.id)) >= PORTFOLIO_MAX) {
    await remove();
    return { error: `Portfolio může mít nejvýše ${PORTFOLIO_MAX} obrázků.` };
  }

  const { error } = await supabase.from("portfolio_items").insert({ designer_id: user.id, image_url: parsed.data });
  if (error) {
    await remove();
    return { error: "Obrázek se nepodařilo uložit. Zkuste to prosím znovu." };
  }

  refresh();
  return {};
}

// A designer who already has the minimum cannot go below it; below the minimum (onboarding) deleting is allowed.
export async function deletePortfolioItem(id: string): Promise<Result> {
  const user = await requireRole("designer");
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return { error: "Obrázek nenalezen." };

  if ((await getPortfolioCount(user.id)) === PORTFOLIO_MIN) {
    return { error: `Portfolio musí mít alespoň ${PORTFOLIO_MIN} obrázky.` };
  }

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("image_url")
    .eq("id", parsedId.data)
    .eq("designer_id", user.id)
    .single();
  if (!item) return { error: "Obrázek nenalezen." };

  const { error } = await supabase.from("portfolio_items").delete().eq("id", parsedId.data).eq("designer_id", user.id);
  if (error) return { error: "Obrázek se nepodařilo smazat. Zkuste to prosím znovu." };

  await supabase.storage.from("portfolio").remove([item.image_url, thumbPathOf(item.image_url)]);
  refresh();
  return {};
}
