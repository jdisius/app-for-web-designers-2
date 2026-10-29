import { BriefForm } from "@/components/brief-form";
import { requireRole } from "@/lib/auth";
import { formatCzk, formatDate } from "@/lib/format";
import { signedUrls } from "@/lib/signed-urls";
import { createClient } from "@/lib/supabase/server";
import { thumbPathOf } from "@/lib/storage-paths";

export default async function NewBriefPage() {
  const user = await requireRole("customer");
  const supabase = await createClient();
  const { data: briefs } = await supabase
    .from("briefs")
    .select("id, image_url, deadline, budget, description, status")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });
  const urls = await signedUrls(supabase, "briefs", (briefs ?? []).flatMap((b) => (b.image_url ? [thumbPathOf(b.image_url)] : [])));

  return (
    <main className="flex flex-col gap-6 px-4 py-4">
      <h1 className="text-2xl font-bold">Nová zakázka</h1>
      <BriefForm userId={user.id} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Moje zakázky</h2>
        {briefs?.length === 0 && <p className="text-muted">Zatím nemáte žádnou zakázku.</p>}
        <ul className="flex flex-col gap-3">
          {briefs?.map((b) => {
            const src = b.image_url ? urls.get(thumbPathOf(b.image_url)) : undefined;
            return (
              <li key={b.id} className="flex gap-3 rounded-2xl border border-muted/40 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- signed Storage URLs, already resized in the browser */}
                {src && <img src={src} alt="" className="size-20 shrink-0 rounded-xl object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{formatCzk(b.budget)} · do {formatDate(b.deadline)}</p>
                  <p className="line-clamp-2 break-words text-sm">{b.description}</p>
                  <p className="text-sm font-semibold text-primary">{b.status === "open" ? "Otevřená" : "Obsazená"}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
