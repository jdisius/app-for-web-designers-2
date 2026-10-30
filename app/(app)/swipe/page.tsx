import { SwipeDeck } from "@/components/swipe-deck";
import { requireReadyDesigner } from "@/lib/auth";
import { signedUrls } from "@/lib/signed-urls";
import { createClient } from "@/lib/supabase/server";

export default async function SwipePage() {
  const user = await requireReadyDesigner();
  const supabase = await createClient();

  // RLS shows this designer their own swipes; open briefs they have not swiped yet make up the deck.
  const { data: swiped } = await supabase.from("swipes").select("brief_id").eq("designer_id", user.id);
  const seen = new Set(swiped?.map((s) => s.brief_id));
  const { data: open } = await supabase
    .from("briefs")
    .select("id, image_url, deadline, budget, description")
    .eq("status", "open")
    .order("created_at");
  const briefs = (open ?? []).filter((b) => !seen.has(b.id));

  const urls = await signedUrls(supabase, "briefs", briefs.flatMap((b) => (b.image_url ? [b.image_url] : [])));

  return (
    <main className="flex flex-col gap-4 py-4">
      <h1 className="px-4 text-2xl font-bold">Zakázky</h1>
      <SwipeDeck
        briefs={briefs.map((b) => ({
          id: b.id,
          imageUrl: b.image_url ? urls.get(b.image_url) : undefined,
          deadline: b.deadline,
          budget: b.budget,
          description: b.description,
        }))}
      />
    </main>
  );
}
