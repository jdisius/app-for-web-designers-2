import type { SupabaseClient } from "@supabase/supabase-js";
import { signedUrls } from "@/lib/signed-urls";
import { thumbPathOf } from "@/lib/storage-paths";

// A designer's portfolio with signed thumbnail and full-size URLs (one batched signing call).
export async function getPortfolio(supabase: SupabaseClient, designerId: string) {
  const { data } = await supabase
    .from("portfolio_items")
    .select("id, image_url")
    .eq("designer_id", designerId)
    .order("created_at");
  const items = data ?? [];

  const urls = await signedUrls(
    supabase,
    "portfolio",
    items.flatMap((item) => [item.image_url, thumbPathOf(item.image_url)]),
  );

  return items.map((item) => ({
    id: item.id as string,
    thumbUrl: urls.get(thumbPathOf(item.image_url)),
    fullUrl: urls.get(item.image_url),
  }));
}
